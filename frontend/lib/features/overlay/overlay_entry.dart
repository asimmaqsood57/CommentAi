import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_overlay_window/flutter_overlay_window.dart';
import 'package:http/http.dart' as http;

// ─────────────────────────────────────────────
// Entry point — registered as a separate Flutter engine
// ─────────────────────────────────────────────
@pragma('vm:entry-point')
void overlayMain() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const _OverlayApp());
}

class _OverlayApp extends StatelessWidget {
  const _OverlayApp();
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(colorSchemeSeed: Colors.deepPurple, useMaterial3: true),
      home: const OverlayRoot(),
    );
  }
}

// ─────────────────────────────────────────────
// Root widget — switches between bubble and panel
// ─────────────────────────────────────────────
class OverlayRoot extends StatefulWidget {
  const OverlayRoot({super.key});
  @override
  State<OverlayRoot> createState() => _OverlayRootState();
}

enum _OverlayState { bubble, loading, panel }

class _OverlayRootState extends State<OverlayRoot> {
  _OverlayState _mode = _OverlayState.bubble;
  String _ocrText = '';
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    // Listen for responses from the main app engine
    FlutterOverlayWindow.overlayListener.listen(_onMainAppMessage);
  }

  void _onMainAppMessage(dynamic data) {
    if (data is! Map) return;
    final action = data['action'] as String?;

    switch (action) {
      case 'ocr_result':
        final text = (data['text'] as String?) ?? '';
        setState(() {
          _ocrText = text;
          _mode = _OverlayState.panel;
        });
        // Expand the overlay window to show the full panel (-1 = match parent)
        FlutterOverlayWindow.resizeOverlay(-1, 520);
        break;

      case 'screenshot_error':
        setState(() {
          _errorMessage = (data['message'] as String?) ?? 'Unknown error';
          _mode = _OverlayState.bubble;
        });
        // Collapse back to bubble on error
        FlutterOverlayWindow.resizeOverlay(56, 56);
        break;
    }
  }

  Future<void> _onBubbleTap() async {
    setState(() {
      _mode = _OverlayState.loading;
      _errorMessage = '';
    });

    // Ask the main app engine to take a screenshot + run OCR
    await FlutterOverlayWindow.shareData({'action': 'capture_screenshot'});
    // Response arrives via _onMainAppMessage
  }

  void _onClose() {
    setState(() {
      _mode = _OverlayState.bubble;
      _ocrText = '';
    });
    FlutterOverlayWindow.resizeOverlay(56, 56);
  }

  @override
  Widget build(BuildContext context) {
    return switch (_mode) {
      _OverlayState.bubble  => _BubbleView(onTap: _onBubbleTap, error: _errorMessage),
      _OverlayState.loading => const _LoadingView(),
      _OverlayState.panel   => _PanelView(initialText: _ocrText, onClose: _onClose),
    };
  }
}

// ─────────────────────────────────────────────
// Bubble — 56×56 floating button
// ─────────────────────────────────────────────
class _BubbleView extends StatelessWidget {
  final VoidCallback onTap;
  final String error;
  const _BubbleView({required this.onTap, required this.error});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: Colors.deepPurple,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha:0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Stack(
          children: [
            const Center(
              child: Text('💬', style: TextStyle(fontSize: 24)),
            ),
            if (error.isNotEmpty)
              Positioned(
                top: 0, right: 0,
                child: Container(
                  width: 14, height: 14,
                  decoration: const BoxDecoration(
                    color: Colors.red, shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Loading — shown while screenshot + OCR runs
// ─────────────────────────────────────────────
class _LoadingView extends StatelessWidget {
  const _LoadingView();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 56, height: 56,
      decoration: const BoxDecoration(
        color: Colors.deepPurple,
        shape: BoxShape.circle,
      ),
      child: const Center(
        child: SizedBox(
          width: 28, height: 28,
          child: CircularProgressIndicator(
            color: Colors.white,
            strokeWidth: 2.5,
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Panel — full comment generation UI
// ─────────────────────────────────────────────
const _platforms = ['linkedin', 'instagram', 'twitter', 'youtube', 'facebook', 'reddit'];
const _allTones  = ['professional', 'witty', 'supportive', 'curious', 'contrarian'];

class _PanelView extends StatefulWidget {
  final String initialText;
  final VoidCallback onClose;
  const _PanelView({required this.initialText, required this.onClose});

  @override
  State<_PanelView> createState() => _PanelViewState();
}

class _PanelViewState extends State<_PanelView> {
  late final TextEditingController _controller;
  String _platform = 'linkedin';
  final List<String> _tones = ['professional'];
  List<Map<String, dynamic>> _suggestions = [];
  bool _loading = false;
  String _error = '';

  static const _baseUrl = String.fromEnvironment(
    'NEXT_API_URL',
    defaultValue: 'http://10.0.2.2:3000/api',
  );

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialText);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    if (_controller.text.trim().isEmpty || _tones.isEmpty) return;
    setState(() { _loading = true; _suggestions = []; _error = ''; });

    try {
      // Retrieve cached Firebase token stored by main app in shared prefs
      // For overlay we pass it directly via shared preferences key
      final token = await _getStoredToken();

      final response = await http.post(
        Uri.parse('$_baseUrl/generate-comments'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'postText': _controller.text.trim(),
          'platform': _platform,
          'tones': _tones,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = (data['suggestions'] as List)
            .cast<Map<String, dynamic>>();
        setState(() => _suggestions = list);
      } else {
        final body = jsonDecode(response.body);
        setState(() => _error = body['error'] ?? 'Failed (${response.statusCode})');
      }
    } catch (_) {
      setState(() => _error = 'Could not reach the server.');
    } finally {
      setState(() => _loading = false);
    }
  }

  /// Reads the Firebase ID token stored by the main app via SharedPreferences.
  Future<String?> _getStoredToken() async {
    const channel = MethodChannel('com.eatechnologies.comment_ai/prefs');
    try {
      return await channel.invokeMethod<String>('getToken');
    } catch (_) {
      return null;
    }
  }

  Future<void> _copy(String text) async {
    await Clipboard.setData(ClipboardData(text: text));
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      elevation: 8,
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: const BoxDecoration(
              color: Colors.deepPurple,
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              children: [
                const Text('💬  CommentAI',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                const Spacer(),
                GestureDetector(
                  onTap: widget.onClose,
                  child: const Icon(Icons.close, color: Colors.white, size: 20),
                ),
              ],
            ),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Post text — pre-filled from OCR
                  TextField(
                    controller: _controller,
                    maxLines: 3,
                    style: const TextStyle(fontSize: 12),
                    decoration: const InputDecoration(
                      hintText: 'Post text (edit if needed)...',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.all(8),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Platform chips
                  const Text('Platform', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _platforms.map((p) => Padding(
                        padding: const EdgeInsets.only(right: 4),
                        child: ChoiceChip(
                          label: Text(p, style: const TextStyle(fontSize: 10)),
                          selected: _platform == p,
                          onSelected: (_) => setState(() => _platform = p),
                          visualDensity: VisualDensity.compact,
                        ),
                      )).toList(),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Tone chips
                  const Text('Tone', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 4,
                    runSpacing: 2,
                    children: _allTones.map((t) {
                      final sel = _tones.contains(t);
                      return FilterChip(
                        label: Text(t, style: const TextStyle(fontSize: 10)),
                        selected: sel,
                        onSelected: (v) {
                          setState(() => v ? _tones.add(t) : _tones.remove(t));
                        },
                        visualDensity: VisualDensity.compact,
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 8),

                  // Generate button
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _loading ? null : _generate,
                      style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 10)),
                      child: _loading
                          ? const SizedBox(
                              height: 16, width: 16,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Generate Comments',
                              style: TextStyle(fontSize: 12)),
                    ),
                  ),

                  if (_error.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(_error,
                        style: const TextStyle(color: Colors.red, fontSize: 11)),
                  ],

                  // Suggestions
                  ..._suggestions.map((s) => _SuggestionTile(
                        tone: s['tone'] as String,
                        text: s['text'] as String,
                        charCount: s['characterCount'] as int,
                        onCopy: () => _copy(s['text'] as String),
                      )),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Suggestion tile
// ─────────────────────────────────────────────
class _SuggestionTile extends StatefulWidget {
  final String tone;
  final String text;
  final int charCount;
  final VoidCallback onCopy;

  const _SuggestionTile({
    required this.tone,
    required this.text,
    required this.charCount,
    required this.onCopy,
  });

  @override
  State<_SuggestionTile> createState() => _SuggestionTileState();
}

class _SuggestionTileState extends State<_SuggestionTile> {
  bool _copied = false;

  Future<void> _handleCopy() async {
    widget.onCopy();
    setState(() => _copied = true);
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _copied = false);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.deepPurple.withValues(alpha:0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(widget.tone,
                    style: const TextStyle(
                        fontSize: 9,
                        color: Colors.deepPurple,
                        fontWeight: FontWeight.bold)),
              ),
              const Spacer(),
              Text('${widget.charCount} chars',
                  style: TextStyle(fontSize: 9, color: Colors.grey[500])),
            ],
          ),
          const SizedBox(height: 6),
          Text(widget.text, style: const TextStyle(fontSize: 12)),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: _handleCopy,
              icon: Icon(
                _copied ? Icons.check : Icons.copy,
                size: 14,
                color: _copied ? Colors.green : Colors.deepPurple,
              ),
              label: Text(
                _copied ? 'Copied!' : 'Copy',
                style: TextStyle(
                  fontSize: 11,
                  color: _copied ? Colors.green : Colors.deepPurple,
                ),
              ),
              style: TextButton.styleFrom(
                minimumSize: Size.zero,
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

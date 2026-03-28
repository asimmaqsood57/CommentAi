import 'dart:convert';
import 'dart:io';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_overlay_window/flutter_overlay_window.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:comment_ai/core/services/screenshot_channel.dart';

// ─────────────────────────────────────────────
// Entry point — registered as a separate Flutter engine
// ─────────────────────────────────────────────
@pragma('vm:entry-point')
void overlayMain() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
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
  String _scannedText = '';

  Future<void> _onBubbleTap() async {
    setState(() => _mode = _OverlayState.loading);

    final path = await ScreenshotChannel.captureScreen();
    if (path != null) {
      final text = await _runOcr(path);
      _scannedText = text;
    } else {
      _scannedText = '';
    }

    await FlutterOverlayWindow.resizeOverlay(400, 560, true);
    setState(() => _mode = _OverlayState.panel);
  }

  /// Called from the panel when the user wants to upload an image.
  /// Writes a trigger file → MainApplication (FileObserver) starts PickerActivity →
  /// PickerActivity runs OCR and writes result file → we poll for it.
  Future<void> _onPickImage() async {
    setState(() => _mode = _OverlayState.loading);
    await FlutterOverlayWindow.resizeOverlay(72, 72, true);

    final dir = await getTemporaryDirectory();
    final requestFile = File('${dir.path}/pick_request');
    final resultFile = File('${dir.path}/pick_result');

    // Clear any stale result from a previous pick
    if (await resultFile.exists()) await resultFile.delete();

    // Signal native layer to open PickerActivity
    await requestFile.writeAsString('1');

    // Poll for result (PickerActivity writes pick_result when done)
    String text = '';
    final deadline = DateTime.now().add(const Duration(seconds: 60));
    while (DateTime.now().isBefore(deadline)) {
      await Future.delayed(const Duration(milliseconds: 500));
      if (await resultFile.exists()) {
        text = await resultFile.readAsString();
        await resultFile.delete();
        break;
      }
    }

    _scannedText = text;
    await FlutterOverlayWindow.resizeOverlay(400, 560, true);
    setState(() => _mode = _OverlayState.panel);
  }

  Future<String> _runOcr(String imagePath) async {
    try {
      const channel = MethodChannel('com.eatechnologies.comment_ai/screenshot');
      final result = await channel.invokeMethod<String>('runOcr', {'path': imagePath});
      return result ?? '';
    } catch (_) {
      return '';
    }
  }

  Future<void> _onClose() async {
    setState(() { _mode = _OverlayState.bubble; _scannedText = ''; });
    await FlutterOverlayWindow.resizeOverlay(72, 72, true);
  }

  @override
  Widget build(BuildContext context) {
    return switch (_mode) {
      _OverlayState.bubble  => _BubbleView(onTap: _onBubbleTap),
      _OverlayState.loading => const _LoadingView(),
      _OverlayState.panel   => _PanelView(
          initialText: _scannedText,
          onClose: _onClose,
          onPickImage: _onPickImage,
        ),
    };
  }
}

// ─────────────────────────────────────────────
// Loading — spinner while capturing + OCR
// ─────────────────────────────────────────────
class _LoadingView extends StatelessWidget {
  const _LoadingView();
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 72, height: 72,
      decoration: const BoxDecoration(color: Colors.deepPurple, shape: BoxShape.circle),
      child: const Center(
        child: SizedBox(
          width: 32, height: 32,
          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Bubble — 72×72 floating button
// ─────────────────────────────────────────────
class _BubbleView extends StatelessWidget {
  final VoidCallback onTap;
  const _BubbleView({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 72,
        height: 72,
        decoration: BoxDecoration(
          color: Colors.deepPurple,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Center(
          child: Text('💬', style: TextStyle(fontSize: 28)),
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
  final VoidCallback onPickImage;
  const _PanelView({required this.initialText, required this.onClose, required this.onPickImage});

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

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialText);
  }

  static const _baseUrl = String.fromEnvironment(
    'NEXT_API_URL',
    defaultValue: 'http://10.0.2.2:3000/api',
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    if (_controller.text.trim().isEmpty || _tones.isEmpty) return;
    setState(() { _loading = true; _suggestions = []; _error = ''; });

    try {
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
        setState(() => _suggestions = (data['suggestions'] as List).cast<Map<String, dynamic>>());
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

  Future<String?> _getStoredToken() async {
    try {
      return await FirebaseAuth.instance.currentUser?.getIdToken();
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
                  TextField(
                    controller: _controller,
                    maxLines: 3,
                    style: const TextStyle(fontSize: 12),
                    decoration: const InputDecoration(
                      hintText: 'Paste post text here...',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.all(8),
                    ),
                  ),
                  const SizedBox(height: 6),
                  OutlinedButton.icon(
                    onPressed: widget.onPickImage,
                    icon: const Icon(Icons.image_outlined, size: 14),
                    label: const Text('Upload Image to Extract Text',
                        style: TextStyle(fontSize: 11)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      visualDensity: VisualDensity.compact,
                    ),
                  ),
                  const SizedBox(height: 8),

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
                        onSelected: (v) => setState(() => v ? _tones.add(t) : _tones.remove(t)),
                        visualDensity: VisualDensity.compact,
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 8),

                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _loading ? null : _generate,
                      style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 10)),
                      child: _loading
                          ? const SizedBox(
                              height: 16, width: 16,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Generate Comments', style: TextStyle(fontSize: 12)),
                    ),
                  ),

                  if (_error.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(_error, style: const TextStyle(color: Colors.red, fontSize: 11)),
                  ],

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
                  color: Colors.deepPurple.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(widget.tone,
                    style: const TextStyle(
                        fontSize: 9, color: Colors.deepPurple, fontWeight: FontWeight.bold)),
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
                style: TextStyle(fontSize: 11, color: _copied ? Colors.green : Colors.deepPurple),
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

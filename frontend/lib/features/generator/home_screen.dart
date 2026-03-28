import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:comment_ai/core/api/api_client.dart';
import 'package:comment_ai/core/models/suggestion.dart';
import 'package:comment_ai/core/providers/user_provider.dart';
import 'widgets/platform_selector.dart';
import 'widgets/tone_selector.dart';
import 'widgets/suggestion_card.dart';
import 'widgets/usage_progress_bar.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _postController = TextEditingController();
  String _platform = 'linkedin';
  List<String> _tones = ['professional'];
  List<Suggestion> _suggestions = [];
  bool _loading = false;
  bool _scanning = false;

  Future<void> _generate() async {
    if (_postController.text.trim().isEmpty || _tones.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter post text and select at least one tone.')),
      );
      return;
    }

    setState(() { _loading = true; _suggestions = []; });

    try {
      final data = await ApiClient.instance.post('/generate-comments', {
        'postText': _postController.text.trim(),
        'platform': _platform,
        'tones': _tones,
      });

      final list = (data['suggestions'] as List)
          .map((s) => Suggestion.fromJson(s))
          .toList();

      setState(() => _suggestions = list);
      ref.invalidate(userProvider);
    } on ApiException catch (e) {
      if (e.statusCode == 429) {
        _showUpgradeSheet();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.error)),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _scanScreenshot() async {
    setState(() => _scanning = true);
    try {
      final picker = ImagePicker();
      final image = await picker.pickImage(source: ImageSource.gallery);
      if (image == null) return;

      final recognizer = TextRecognizer();
      final inputImage = InputImage.fromFilePath(image.path);
      final result = await recognizer.processImage(inputImage);
      recognizer.close();

      if (result.text.isNotEmpty) {
        _postController.text = result.text;
      }
    } finally {
      setState(() => _scanning = false);
    }
  }

  Future<void> _saveDraft() async {
    if (_suggestions.isEmpty) return;
    try {
      await ApiClient.instance.post('/drafts', {
        'title': _postController.text.substring(0, (_postController.text.length).clamp(0, 40)),
        'content': _suggestions.first.text,
        'platform': _platform,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Draft saved!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save draft: $e')),
        );
      }
    }
  }

  void _showUpgradeSheet() {
    showModalBottomSheet(
      context: context,
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Daily Limit Reached', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('Upgrade to Pro for unlimited generations.'),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () { Navigator.pop(context); context.go('/settings'); },
              child: const Text('Upgrade to Pro'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final userAsync = ref.watch(userProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('CommentAI'),
        actions: [
          IconButton(icon: const Icon(Icons.bookmark_border), onPressed: () => context.push('/drafts')),
          IconButton(icon: const Icon(Icons.settings), onPressed: () => context.push('/settings')),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            userAsync.when(
              data: (user) => user != null ? UsageProgressBar(user: user) : const SizedBox.shrink(),
              loading: () => const SizedBox.shrink(),
              error: (e, s) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _postController,
              maxLines: 5,
              decoration: InputDecoration(
                hintText: 'Paste post text here...',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  icon: _scanning
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.camera_alt_outlined),
                  onPressed: _scanning ? null : _scanScreenshot,
                  tooltip: 'Scan screenshot',
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Platform', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            PlatformSelector(selected: _platform, onSelect: (p) => setState(() => _platform = p)),
            const SizedBox(height: 16),
            const Text('Tone', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            ToneSelector(selected: _tones, onChanged: (t) => setState(() => _tones = t)),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _loading ? null : _generate,
              child: _loading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Generate Comments'),
            ),
            if (_suggestions.isNotEmpty) ...[
              const SizedBox(height: 24),
              const Text('Suggestions', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
              const SizedBox(height: 8),
              ..._suggestions.map((s) => SuggestionCard(suggestion: s)),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: _saveDraft,
                icon: const Icon(Icons.save_outlined),
                label: const Text('Save as Draft'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

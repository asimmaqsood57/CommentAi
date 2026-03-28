import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_overlay_window/flutter_overlay_window.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:comment_ai/core/providers/router.dart';
import 'package:comment_ai/core/services/screenshot_channel.dart';

// Overlay entry point — separate Flutter engine for the floating bubble
export 'package:comment_ai/features/overlay/overlay_entry.dart' show overlayMain;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  // Listen for messages from the overlay engine
  _listenForOverlayMessages();

  runApp(const ProviderScope(child: CommentAiApp()));
}

/// Handles screenshot + OCR requests coming from the overlay bubble.
/// Sends the extracted text back to the overlay.
void _listenForOverlayMessages() {
  FlutterOverlayWindow.overlayListener.listen((data) async {
    if (data is! Map) return;
    final action = data['action'] as String?;

    if (action == 'capture_screenshot') {
      final path = await ScreenshotChannel.captureScreen();
      if (path == null) {
        await FlutterOverlayWindow.shareData({'action': 'screenshot_error', 'message': 'Failed to capture screen.'});
        return;
      }
      final recognizer = TextRecognizer();
      try {
        final result = await recognizer.processImage(InputImage.fromFilePath(path));
        await FlutterOverlayWindow.shareData({'action': 'ocr_result', 'text': result.text});
      } catch (_) {
        await FlutterOverlayWindow.shareData({'action': 'screenshot_error', 'message': 'Could not read text.'});
      } finally {
        recognizer.close();
      }
    }

  });
}

class CommentAiApp extends ConsumerWidget {
  const CommentAiApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'CommentAI',
      theme: ThemeData(
        colorSchemeSeed: Colors.deepPurple,
        useMaterial3: true,
      ),
      routerConfig: router,
    );
  }
}

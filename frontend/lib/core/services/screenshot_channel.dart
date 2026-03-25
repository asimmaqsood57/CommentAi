import 'package:flutter/services.dart';

/// Bridges Flutter to the native ScreenshotService via a MethodChannel.
class ScreenshotChannel {
  static const _channel =
      MethodChannel('com.eatechnologies.comment_ai/screenshot');

  /// Shows the system MediaProjection permission dialog.
  /// Must be called once (from the main app, not the overlay).
  /// Returns true if permission was granted.
  static Future<bool> requestPermission() async {
    try {
      final granted =
          await _channel.invokeMethod<bool>('requestScreenshotPermission');
      return granted ?? false;
    } catch (_) {
      return false;
    }
  }

  /// Triggers the native ScreenshotService to capture the current screen.
  /// Returns the absolute file path of the saved JPEG, or null on failure.
  static Future<String?> captureScreen() async {
    try {
      return await _channel.invokeMethod<String>('captureScreen');
    } catch (_) {
      return null;
    }
  }
}

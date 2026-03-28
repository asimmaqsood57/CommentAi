import 'package:flutter/services.dart';

class ScreenshotChannel {
  static const _channel = MethodChannel('com.eatechnologies.comment_ai/screenshot');

  /// Returns true if the Accessibility Service is enabled and connected.
  static Future<bool> isAccessibilityEnabled() async {
    try {
      return await _channel.invokeMethod<bool>('isAccessibilityEnabled') ?? false;
    } catch (_) {
      return false;
    }
  }

  /// Opens Android Accessibility Settings so the user can enable the service.
  static Future<void> openAccessibilitySettings() async {
    try {
      await _channel.invokeMethod('openAccessibilitySettings');
    } catch (_) {}
  }

  /// Captures the screen via the Accessibility Service.
  /// Returns the JPEG file path, or null on failure.
  static Future<String?> captureScreen() async {
    try {
      return await _channel.invokeMethod<String>('captureScreen');
    } catch (_) {
      return null;
    }
  }
}

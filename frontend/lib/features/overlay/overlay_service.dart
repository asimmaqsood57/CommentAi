import 'package:flutter_overlay_window/flutter_overlay_window.dart';

class OverlayService {
  static const int _bubbleSize = 56;
  static const int _panelHeight = 520;
  // -1 is the match-parent sentinel value used by flutter_overlay_window
  static const int _panelWidth = -1;

  static Future<bool> hasPermission() =>
      FlutterOverlayWindow.isPermissionGranted();

  static Future<void> requestPermission() =>
      FlutterOverlayWindow.requestPermission();

  /// Show the floating bubble (initial 56×56 state).
  static Future<void> showBubble() async {
    final granted = await hasPermission();
    if (!granted) {
      await requestPermission();
      return;
    }

    if (await FlutterOverlayWindow.isActive()) return;

    await FlutterOverlayWindow.showOverlay(
      height: _bubbleSize,
      width: _bubbleSize,
      alignment: OverlayAlignment.centerRight,
      flag: OverlayFlag.defaultFlag,
      overlayTitle: 'CommentAI',
      overlayContent: 'Tap to capture & generate comments',
      enableDrag: true,
    );
  }

  /// Expand the overlay to the full comment panel.
  static Future<void> expandToPanel() =>
      FlutterOverlayWindow.resizeOverlay(_panelWidth, _panelHeight, true);

  /// Collapse back to the small draggable bubble.
  static Future<void> collapseToButton() =>
      FlutterOverlayWindow.resizeOverlay(_bubbleSize, _bubbleSize, true);

  static Future<void> closeOverlay() => FlutterOverlayWindow.closeOverlay();

  static Future<bool> isActive() => FlutterOverlayWindow.isActive();

  /// Send a message between the main engine and the overlay engine.
  static Future<void> send(Map<String, dynamic> data) =>
      FlutterOverlayWindow.shareData(data);
}

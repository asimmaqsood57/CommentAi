import 'package:flutter/material.dart';
import 'package:flutter_overlay_window/flutter_overlay_window.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:comment_ai/core/providers/auth_provider.dart';
import 'package:comment_ai/core/providers/user_provider.dart';
import 'package:comment_ai/core/services/screenshot_channel.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _overlayActive = false;
  bool _overlayLoading = false;

  @override
  void initState() {
    super.initState();
    _refreshOverlayState();
  }

  Future<void> _refreshOverlayState() async {
    final active = await FlutterOverlayWindow.isActive();
    if (mounted) setState(() => _overlayActive = active);
  }

  Future<void> _toggleOverlay(bool enable) async {
    setState(() => _overlayLoading = true);

    try {
      if (enable) {
        // Step 1 — SYSTEM_ALERT_WINDOW permission (draw over other apps)
        final overlayGranted = await FlutterOverlayWindow.isPermissionGranted();
        if (!overlayGranted) {
          await FlutterOverlayWindow.requestPermission();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Grant "Display over other apps", then toggle again.'),
                duration: Duration(seconds: 5),
              ),
            );
          }
          if (mounted) setState(() { _overlayLoading = false; _overlayActive = false; });
          return;
        }

        // Step 2 — Accessibility Service check (for screenshot on bubble tap)
        final accessibilityEnabled = await ScreenshotChannel.isAccessibilityEnabled();
        if (!accessibilityEnabled) {
          if (mounted) {
            await showDialog(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text('Enable Accessibility Service'),
                content: const Text(
                  'CommentAI needs the Accessibility Service to capture the screen '
                  'when you tap the bubble.\n\n'
                  'Tap "Open Settings", find CommentAI, and enable it.',
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Skip'),
                  ),
                  FilledButton(
                    onPressed: () async {
                      Navigator.pop(ctx);
                      await ScreenshotChannel.openAccessibilitySettings();
                    },
                    child: const Text('Open Settings'),
                  ),
                ],
              ),
            );
          }
        }

        // Step 3 — Show the floating bubble
        await FlutterOverlayWindow.showOverlay(
          height: 72,
          width: 72,
          alignment: OverlayAlignment.centerRight,
          flag: OverlayFlag.focusPointer,
          overlayTitle: 'CommentAI',
          overlayContent: 'Tap to capture & generate comments',
          enableDrag: true,
          positionGravity: PositionGravity.auto,
        );

        if (mounted) setState(() => _overlayActive = true);
      } else {
        await FlutterOverlayWindow.closeOverlay();
        if (mounted) setState(() => _overlayActive = false);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Overlay error: $e')),
        );
        setState(() => _overlayActive = false);
      }
    } finally {
      if (mounted) setState(() => _overlayLoading = false);
    }
  }

  Future<void> _signOut() async {
    await ref.read(authRepositoryProvider).signOut();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final userAsync = ref.watch(userProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          // ── User info / plan ──────────────────────────────────────
          userAsync.when(
            loading: () => const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (e, s) => const ListTile(
              leading: Icon(Icons.warning_amber_outlined),
              title: Text('Could not load profile'),
              subtitle: Text('Make sure the backend is running'),
            ),
            data: (user) {
              if (user == null) {
                return const ListTile(
                  leading: Icon(Icons.warning_amber_outlined),
                  title: Text('Profile unavailable'),
                  subtitle: Text('Make sure the backend is running'),
                );
              }
              return Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.person_outline),
                    title: const Text('Plan'),
                    trailing: Chip(label: Text(user.plan)),
                  ),
                  ListTile(
                    leading: const Icon(Icons.bar_chart),
                    title: const Text('Generations Today'),
                    trailing: Text(
                      user.generationsLimit != null
                          ? '${user.generationsToday} / ${user.generationsLimit}'
                          : '${user.generationsToday} (unlimited)',
                    ),
                  ),
                ],
              );
            },
          ),

          const Divider(),

          // ── Floating bubble toggle ────────────────────────────────
          SwitchListTile(
            title: const Text('Floating Bubble'),
            subtitle: const Text('Show CommentAI overlay on top of other apps'),
            secondary: _overlayLoading
                ? const SizedBox(
                    width: 24, height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.bubble_chart_outlined),
            value: _overlayActive,
            onChanged: _overlayLoading ? null : _toggleOverlay,
          ),

          const Divider(),

          // ── Navigation ────────────────────────────────────────────
          ListTile(
            title: const Text('My Voice Samples'),
            leading: const Icon(Icons.mic_none),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/voice'),
          ),

          const Divider(),

          // ── Sign Out ──────────────────────────────────────────────
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Sign Out', style: TextStyle(color: Colors.red)),
            onTap: _signOut,
          ),
        ],
      ),
    );
  }
}

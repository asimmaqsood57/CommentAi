import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:comment_ai/core/providers/auth_provider.dart';
import 'package:comment_ai/core/providers/user_provider.dart';
import 'package:comment_ai/features/overlay/overlay_service.dart';
import 'package:comment_ai/core/services/screenshot_channel.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _overlayActive = false;

  @override
  void initState() {
    super.initState();
    _checkOverlayStatus();
  }

  Future<void> _checkOverlayStatus() async {
    final active = await OverlayService.isActive();
    if (mounted) setState(() => _overlayActive = active);
  }

  Future<void> _toggleOverlay(bool enable) async {
    if (enable) {
      // Request MediaProjection permission (shows system dialog once)
      final granted = await ScreenshotChannel.requestPermission();
      if (!granted) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Screen capture permission is required for the overlay.'),
            ),
          );
        }
        return;
      }
      await OverlayService.showBubble();
    } else {
      await OverlayService.closeOverlay();
    }
    final active = await OverlayService.isActive();
    if (mounted) setState(() => _overlayActive = active);
  }

  Future<void> _showPaywall(BuildContext context) async {
    try {
      final offerings = await Purchases.getOfferings();
      final current = offerings.current;
      if (current == null || !context.mounted) return;
      context.go('/paywall');
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final userAsync = ref.watch(userProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: userAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Failed to load profile')),
        data: (user) {
          if (user == null) return const SizedBox.shrink();
          return ListView(
            children: [
              const SizedBox(height: 8),
              ListTile(
                title: const Text('Plan'),
                trailing: Chip(label: Text(user.plan)),
              ),
              ListTile(
                title: const Text('Generations Today'),
                trailing: Text(
                  user.generationsLimit != null
                      ? '${user.generationsToday} / ${user.generationsLimit}'
                      : '${user.generationsToday} (unlimited)',
                ),
              ),
              if (user.isFree)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: FilledButton(
                    onPressed: () => _showPaywall(context),
                    child: const Text('Upgrade to Pro'),
                  ),
                ),
              const Divider(),
              // Overlay toggle — PRO+ only
              SwitchListTile(
                title: const Text('Floating Bubble'),
                subtitle: Text(
                  user.isPro
                      ? 'Show CommentAI overlay on top of other apps'
                      : 'Available on Pro plan',
                ),
                secondary: const Icon(Icons.bubble_chart_outlined),
                value: _overlayActive,
                onChanged: user.isPro ? _toggleOverlay : null,
              ),
              const Divider(),
              ListTile(
                title: const Text('My Voice Samples'),
                leading: const Icon(Icons.mic_none),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go('/voice'),
              ),
              const Divider(),
              ListTile(
                title: const Text('Sign Out'),
                leading: const Icon(Icons.logout),
                onTap: () async {
                  await ref.read(authRepositoryProvider).signOut();
                  if (context.mounted) context.go('/login');
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:comment_ai/features/auth/login_screen.dart';
import 'package:comment_ai/features/generator/home_screen.dart';
import 'package:comment_ai/features/drafts/drafts_screen.dart';
import 'package:comment_ai/features/voice/voice_screen.dart';
import 'package:comment_ai/features/settings/settings_screen.dart';
import 'package:comment_ai/features/settings/paywall_screen.dart';
import 'package:comment_ai/core/providers/auth_provider.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isLoggedIn = authState.valueOrNull != null;
      final onLogin = state.matchedLocation == '/login';

      if (!isLoggedIn && !onLogin) return '/login';
      if (isLoggedIn && onLogin) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
      GoRoute(path: '/drafts', builder: (context, state) => const DraftsScreen()),
      GoRoute(path: '/voice', builder: (context, state) => const VoiceScreen()),
      GoRoute(path: '/settings', builder: (context, state) => const SettingsScreen()),
      GoRoute(path: '/paywall', builder: (context, state) => const PaywallScreen()),
    ],
  );
});

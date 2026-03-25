import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:comment_ai/core/api/api_client.dart';

final authStateProvider = StreamProvider<User?>((ref) {
  return FirebaseAuth.instance.authStateChanges();
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

class AuthRepository {
  final _auth = FirebaseAuth.instance;
  final _api = ApiClient.instance;

  Future<void> signInWithGoogle() async {
    final provider = GoogleAuthProvider();
    await _auth.signInWithPopup(provider);
    await _syncUser();
  }

  Future<void> signInWithEmail(String email, String password) async {
    await _auth.signInWithEmailAndPassword(email: email, password: password);
    await _syncUser();
  }

  Future<void> registerWithEmail(String email, String password, String name) async {
    final credential = await _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
    await credential.user?.updateDisplayName(name);
    await _syncUser();
  }

  Future<void> _syncUser() async {
    final user = _auth.currentUser!;
    // Link RevenueCat identity to Firebase UID so webhook events match the user
    await Purchases.logIn(user.uid);
    await _api.post('/users/sync', {
      'firebaseUid': user.uid,
      'email': user.email ?? '',
      'name': user.displayName ?? '',
    }, auth: false);
  }

  Future<void> signOut() async {
    await Purchases.logOut();
    await _auth.signOut();
  }
}

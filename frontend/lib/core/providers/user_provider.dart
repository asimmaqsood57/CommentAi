import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:comment_ai/core/api/api_client.dart';
import 'package:comment_ai/core/models/user.dart';

final userProvider = FutureProvider<UserModel?>((ref) async {
  try {
    final data = await ApiClient.instance.get('/users/me');
    return UserModel.fromJson(data);
  } catch (_) {
    return null;
  }
});

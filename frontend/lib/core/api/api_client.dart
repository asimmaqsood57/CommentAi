import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final int statusCode;
  final String error;
  final String code;

  const ApiException({
    required this.statusCode,
    required this.error,
    required this.code,
  });

  @override
  String toString() => 'ApiException($statusCode): $error [$code]';
}

class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  // Set via --dart-define=NEXT_API_URL=https://...
  static const String _baseUrl = String.fromEnvironment(
    'NEXT_API_URL',
    defaultValue: 'http://10.0.2.2:3000/api',
  );

  Future<String> _getToken() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw const ApiException(statusCode: 401, error: 'Not authenticated', code: 'AUTH_MISSING');
    return await user.getIdToken() ?? '';
  }

  Map<String, String> _headers(String token) => {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };

  Future<dynamic> get(String path) async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$_baseUrl$path'),
      headers: _headers(token),
    );
    return _handle(response);
  }

  Future<dynamic> post(String path, Map<String, dynamic> body, {bool auth = true}) async {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (auth) {
      final token = await _getToken();
      headers['Authorization'] = 'Bearer $token';
    }
    final response = await http.post(
      Uri.parse('$_baseUrl$path'),
      headers: headers,
      body: jsonEncode(body),
    );
    return _handle(response);
  }

  Future<dynamic> delete(String path) async {
    final token = await _getToken();
    final response = await http.delete(
      Uri.parse('$_baseUrl$path'),
      headers: _headers(token),
    );
    return _handle(response);
  }

  dynamic _handle(http.Response response) {
    final body = jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }

    final error = body['error'] ?? 'Unknown error';
    final code = body['code'] ?? 'UNKNOWN';

    throw ApiException(
      statusCode: response.statusCode,
      error: error,
      code: code,
    );
  }
}

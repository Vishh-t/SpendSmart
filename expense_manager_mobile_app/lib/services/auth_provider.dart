import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/api_client.dart';
import '../models/models.dart';

class AuthProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  User? _currentUser;
  bool _isAuthenticated = false;
  bool _isLoading = true;

  User? get currentUser => _currentUser;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;

  AuthProvider() {
    checkToken();
  }

  Future<void> checkToken() async {
    _isLoading = true;
    notifyListeners();
    try {
      final token = await _storage.read(key: 'token');
      if (token != null && token.isNotEmpty) {
        final res = await _apiClient.client.get('/users/');
        _currentUser = User.fromJson(res.data);
        _isAuthenticated = true;
      }
    } catch (_) {
      await _storage.deleteAll();
      _isAuthenticated = false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String username, String password) async {
    try {
      final res = await _apiClient.client.post('/users/login', data: {
        'username': username,
        'password': password,
      });
      final token = res.data['token'];
      await _storage.write(key: 'token', value: token);
      // fetch full user info since login response only returns token + username
      final userRes = await _apiClient.client.get('/users/');
      _currentUser = User.fromJson(userRes.data);
      _isAuthenticated = true;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Login failed: $e');
      return false;
    }
  }

  Future<bool> signUp(String username, String name, String email, String password, double budget) async {
    try {
      final res = await _apiClient.client.post('/users/signUp', data: {
        'username': username,
        'name': name,
        'email': email,
        'password': password,
        'monthlyBudget': budget,
      });
      final token = res.data['token'];
      await _storage.write(key: 'token', value: token);
      // fetch full user info since signup response only returns token + username
      final userRes = await _apiClient.client.get('/users/');
      _currentUser = User.fromJson(userRes.data);
      _isAuthenticated = true;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Sign up failed: $e');
      return false;
    }
  }

  Future<void> logout() async {
    await _storage.deleteAll();
    _currentUser = null;
    _isAuthenticated = false;
    notifyListeners();
  }
}
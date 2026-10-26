import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/flutterfire_auth_service.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _authService = FlutterFireAuthService();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _error;
  bool _isRegister = false;

  Future<void> _submit() async {
    if (_isRegister) {
      await _register();
    } else {
      await _signIn();
    }
  }

  Future<void> _signIn() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await _authService.signInWithEmail(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/');
    }

  Future<void> _register() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await _authService.signUpWithEmail(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/');
    } on FirebaseAuthException catch (e) {
      setState(() => _error = e.message ?? 'Registration failed');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }


  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text(_isRegister ? 'Staff Register' : 'Staff Sign In'),
        backgroundColor: const Color(0xFF7C3AED),
        centerTitle: true,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.local_hospital, size: 80, color: Color(0xFF8B5CF6)),
              const SizedBox(height: 20),
              const Text('Smart Hospital',
                  style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white)),
              const Text('Congestion Control AI',
                  style: TextStyle(fontSize: 18, color: Colors.tealAccent)),
              const SizedBox(height: 32),
              if (_error != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                ),
                const SizedBox(height: 12),
              ],
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.email, color: Colors.tealAccent),
                  labelStyle: TextStyle(color: Colors.white70),
                ),
                style: const TextStyle(color: Colors.white),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.lock, color: Colors.tealAccent),
                  labelStyle: TextStyle(color: Colors.white70),
                ),
                style: const TextStyle(color: Colors.white),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _submit,
                  icon: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Icon(_isRegister ? Icons.person_add : Icons.login),
                  label: Text(_isLoading
                      ? (_isRegister ? 'Registering...' : 'Signing in...')
                      : (_isRegister ? 'Register' : 'Sign In')),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
               const SizedBox(height: 12),
               TextButton(
                 onPressed: () => setState(() => _isRegister = !_isRegister),
                 child: Text(_isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register",
                     style: const TextStyle(color: Color(0xFFC084FC))),
               ),
               const SizedBox(height: 8),
               const Text('Staff emails end with @hospital.org',
                  style: TextStyle(fontSize: 12, color: Colors.white70)),
            ],
          ),
        ),
      ),
    );
  }
}

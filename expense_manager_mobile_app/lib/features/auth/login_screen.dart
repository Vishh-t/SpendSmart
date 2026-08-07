import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../services/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool isSignUp = false;
  final _formKey = GlobalKey<FormState>();

  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _budgetController = TextEditingController(text: '5000');
  bool _loading = false;

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    final auth = Provider.of<AuthProvider>(context, listen: false);
    bool success;

    if (isSignUp) {
      success = await auth.signUp(
        _usernameController.text.trim(),
        _nameController.text.trim(),
        _emailController.text.trim(),
        _passwordController.text,
        double.parse(_budgetController.text),
      );
    } else {
      success = await auth.login(
        _usernameController.text.trim(),
        _passwordController.text,
      );
    }

    setState(() => _loading = false);

    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(isSignUp ? 'Sign up failed' : 'Invalid credentials')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(Icons.account_balance_wallet, size: 64, color: AppTheme.primary),
                  const SizedBox(height: 12),
                  Text(
                    isSignUp ? 'Create Expenzo Account' : 'Welcome Back',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    isSignUp ? 'Track & optimize your financial flow' : 'Sign in to access your ledger',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppTheme.textSecondary),
                  ),
                  const SizedBox(height: 32),
                  TextFormField(
                    controller: _usernameController,
                    decoration: const InputDecoration(labelText: 'Username', prefixIcon: Icon(Icons.person_outline)),
                    validator: (v) => v!.isEmpty ? 'Enter username' : null,
                  ),
                  if (isSignUp) ...[
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.badge_outlined)),
                      validator: (v) => v!.isEmpty ? 'Enter name' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _emailController,
                      decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined)),
                      validator: (v) => v!.contains('@') ? null : 'Enter valid email',
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _budgetController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Monthly Budget (₹)', prefixIcon: Icon(Icons.currency_rupee)),
                      validator: (v) => v!.isEmpty ? 'Enter budget' : null,
                    ),
                  ],
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock_outline)),
                    validator: (v) => v!.length < 4 ? 'Min 4 chars' : null,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    child: _loading ? const CircularProgressIndicator(color: Colors.black) : Text(isSignUp ? 'Sign Up' : 'Sign In'),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => setState(() => isSignUp = !isSignUp),
                    child: Text(
                      isSignUp ? 'Already have an account? Sign In' : 'New to Expenzo? Create Account',
                      style: const TextStyle(color: AppTheme.primary),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../services/auth_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.currentUser;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile & Settings')),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Center(
              child: CircleAvatar(
                radius: 40,
                backgroundColor: AppTheme.primary,
                child: Icon(Icons.person, size: 50, color: Colors.black),
              ),
            ),
            const SizedBox(height: 16),
            Text(user?.name ?? 'User', textAlign: TextAlign.center, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            Text('@${user?.username}', textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.textSecondary)),
            const SizedBox(height: 32),
            Card(
              child: ListTile(
                leading: const Icon(Icons.account_balance_wallet, color: AppTheme.primary),
                title: const Text('Monthly Budget'),
                trailing: Text('₹${user?.monthlyBudget.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
            const Spacer(),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentRed, foregroundColor: Colors.white),
              onPressed: () => auth.logout(),
              child: const Text('Log Out'),
            ),
          ],
        ),
      ),
    );
  }
}
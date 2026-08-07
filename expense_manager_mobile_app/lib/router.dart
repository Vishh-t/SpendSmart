import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'services/auth_provider.dart';
import 'features/auth/login_screen.dart';
import 'features/dashboard/dashboard_screen.dart';
import 'features/expenses/expenses_screen.dart';
import 'features/categories/categories_screen.dart';
import 'features/insights/insights_screen.dart';
import 'features/profile/profile_screen.dart';

class AppShell extends StatelessWidget {
  final Widget child;
  const AppShell({Key? key, required this.child}) : super(key: key);

  int _calculateSelectedIndex(BuildContext context) {
    final String location = GoRouterState.of(context).uri.toString();
    if (location.startsWith('/dashboard')) return 0;
    if (location.startsWith('/expenses')) return 1;
    if (location.startsWith('/categories')) return 2;
    if (location.startsWith('/insights')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0: context.go('/dashboard'); break;
      case 1: context.go('/expenses'); break;
      case 2: context.go('/categories'); break;
      case 3: context.go('/insights'); break;
      case 4: context.go('/profile'); break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _calculateSelectedIndex(context),
        onDestinationSelected: (idx) => _onItemTapped(idx, context),
        backgroundColor: const Color(0xFF1E293B), // Fixed hex
        indicatorColor: const Color(0xFFF59E0B).withOpacity(0.2), // Fixed hex
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard, color: Color(0xFFF59E0B)), label: 'Dashboard'), // Fixed hex
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long, color: Color(0xFFF59E0B)), label: 'Expenses'), // Fixed hex
          NavigationDestination(icon: Icon(Icons.category_outlined), selectedIcon: Icon(Icons.category, color: Color(0xFFF59E0B)), label: 'Categories'), // Fixed hex
          NavigationDestination(icon: Icon(Icons.insights_outlined), selectedIcon: Icon(Icons.insights, color: Color(0xFFF59E0B)), label: 'Insights'), // Fixed hex
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person, color: Color(0xFFF59E0B)), label: 'Profile'), // Fixed hex
        ],
      ),
    );
  }
}

GoRouter createRouter(AuthProvider auth) {
  return GoRouter(
  initialLocation: '/dashboard',
  refreshListenable: auth,
  redirect: (context, state) {
    final isLoggingIn = state.uri.toString() == '/login';

    if (!auth.isAuthenticated && !isLoggingIn) return '/login';
    if (auth.isAuthenticated && isLoggingIn) return '/dashboard';
    return null;
  },
  routes: [
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    ShellRoute(
      builder: (context, state, child) => AppShell(child: child),
      routes: [
        GoRoute(path: '/dashboard', builder: (context, state) => const DashboardScreen()),
        GoRoute(path: '/expenses', builder: (context, state) => const ExpensesScreen()),
        GoRoute(path: '/categories', builder: (context, state) => const CategoriesScreen()),
        GoRoute(path: '/insights', builder: (context, state) => const InsightsScreen()),
        GoRoute(path: '/profile', builder: (context, state) => const ProfileScreen()),
      ],
    ),
  ],
  );
}
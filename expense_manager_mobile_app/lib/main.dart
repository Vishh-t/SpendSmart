import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/theme.dart';
import 'router.dart';
import 'services/auth_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final authProvider = AuthProvider();
  final appRouter = createRouter(authProvider);
  runApp(
    ChangeNotifierProvider.value(
      value: authProvider,
      child: ExpenzoApp(router: appRouter),
    ),
  );
}

class ExpenzoApp extends StatelessWidget {
  final GoRouter router;
  const ExpenzoApp({Key? key, required this.router}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    if (auth.isLoading) {
      return MaterialApp(
        theme: AppTheme.darkTheme,
        home: const Scaffold(
          body: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
        ),
      );
    }

    return MaterialApp.router(
      title: 'Expenzo',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: router,
    );
  }
}
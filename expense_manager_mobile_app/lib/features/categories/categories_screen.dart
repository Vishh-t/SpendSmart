import 'package:flutter/material.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({Key? key}) : super(key: key);

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _categories = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchCategories();
  }

  Future<void> _fetchCategories() async {
    try {
      final res = await _apiClient.client.get('/category/categoryBudgetSummary');
      setState(() {
        _categories = res.data ?? [];
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Category Budgets')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _categories.length,
        itemBuilder: (context, i) {
          final cat = _categories[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(cat['categoryName'] ?? 'Category', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      Text('Spent: ₹${cat['spentThisMonth']?.toStringAsFixed(0)}', style: const TextStyle(color: AppTheme.primary)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  LinearProgressIndicator(
                    value: ((cat['percentage'] as num? ?? 0) / 100).clamp(0.0, 1.0),
                    backgroundColor: AppTheme.surfaceLight,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      cat['status'] == 'EXCEEDED' ? AppTheme.accentRed
                      : cat['status'] == 'WARNING' ? Colors.orange
                      : AppTheme.primary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Budget: ₹${(cat['categoryBudget'] as num?)?.toStringAsFixed(0) ?? '0'}', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                      Text('Left: ₹${(cat['remaining'] as num?)?.toStringAsFixed(0) ?? '0'}', style: TextStyle(
                        color: cat['status'] == 'EXCEEDED' ? AppTheme.accentRed : AppTheme.accentGreen,
                        fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
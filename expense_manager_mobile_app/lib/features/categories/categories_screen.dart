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
      // fetch all categories for display, budget summary separately for budget info
      final allRes = await _apiClient.client.get('/category/');
      final budgetRes = await _apiClient.client.get('/category/categoryBudgetSummary');
      final List<dynamic> allCats = allRes.data ?? [];
      final List<dynamic> budgetCats = budgetRes.data ?? [];
      // merge budget info into all categories
      final budgetMap = {for (var b in budgetCats) b['categoryName']: b};
      final merged = allCats.map((cat) {
        final budget = budgetMap[cat['categoryName']];
        return {
          'categoryName': cat['categoryName'],
          'categoryId': cat['categoryId'],
          'spentThisMonth': budget?['spentThisMonth'] ?? 0,
          'percentage': budget?['percentage'] ?? 0,
          'categoryBudget': budget?['categoryBudget'],
          'remaining': budget?['remaining'],
          'status': budget?['status'] ?? 'NO_BUDGET',
        };
      }).toList();
      setState(() {
        _categories = merged;
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  void _showAddCategoryModal() {
    final nameCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 20, right: 20, top: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('New Category', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(
              controller: nameCtrl,
              autofocus: true,
              decoration: const InputDecoration(labelText: 'Category Name'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () async {
                if (nameCtrl.text.trim().isEmpty) return;
                try {
                  await _apiClient.client.post('/category/add', data: {'categoryName': nameCtrl.text.trim()});
                  await _fetchCategories();
                  if (ctx.mounted) Navigator.pop(ctx);
                } catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      const SnackBar(content: Text('Failed to create category. It may already exist.')),
                    );
                  }
                }
              },
              child: const Text('Create Category'),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Category Budgets'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: AppTheme.primary),
            onPressed: _showAddCategoryModal,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddCategoryModal,
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.black,
        child: const Icon(Icons.add),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _categories.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.category_outlined, size: 64, color: AppTheme.textSecondary),
                  const SizedBox(height: 16),
                  const Text('No categories yet', style: TextStyle(color: AppTheme.textSecondary, fontSize: 16)),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: _showAddCategoryModal,
                    icon: const Icon(Icons.add),
                    label: const Text('Create Category'),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _fetchCategories,
              color: AppTheme.primary,
              child: ListView.builder(
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
                              Text('Spent: ₹${(cat['spentThisMonth'] as num?)?.toStringAsFixed(0) ?? '0'}', style: const TextStyle(color: AppTheme.primary)),
                            ],
                          ),
                          if (cat['categoryBudget'] != null) ...[                          
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
                          ] else
                            const Padding(
                              padding: EdgeInsets.only(top: 8),
                              child: Text('No budget set', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                            ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
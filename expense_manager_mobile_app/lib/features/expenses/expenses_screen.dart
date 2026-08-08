import 'package:flutter/material.dart';
import 'dart:async';
import '../../core/api_client.dart';
import '../../core/theme.dart';

class ExpensesScreen extends StatefulWidget {
  const ExpensesScreen({Key? key}) : super(key: key);

  @override
  State<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends State<ExpensesScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _expenses = [];
  List<dynamic> _categories = [];
  bool _isLoading = true;
  String _searchQuery = '';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _fetchCategories();
    _fetchExpenses();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _fetchCategories() async {
    try {
      final res = await _apiClient.client.get('/category/');
      setState(() => _categories = res.data ?? []);
    } catch (_) {}
  }

  Future<void> _fetchExpenses() async {
    try {
      final res = await _apiClient.client.get('/expense/paginatedFiltered?size=50&search=$_searchQuery');
      setState(() {
        _expenses = res.data['content'] ?? [];
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  void _onSearchChanged(String val) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      _searchQuery = val;
      _fetchExpenses();
    });
  }

  void _showAddExpenseModal() {
    final amountCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    int? selectedCategoryId;

    Future<void> showCreateCategoryDialog(StateSetter setModalState) async {
      final nameCtrl = TextEditingController();
      await showDialog(
        context: context,
        builder: (dCtx) => AlertDialog(
          backgroundColor: AppTheme.surface,
          title: const Text('New Category'),
          content: TextField(
            controller: nameCtrl,
            autofocus: true,
            decoration: const InputDecoration(labelText: 'Category Name'),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(dCtx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                if (nameCtrl.text.trim().isEmpty) return;
                try {
                  final res = await _apiClient.client.post('/category/add', data: {'categoryName': nameCtrl.text.trim()});
                  final newCat = res.data;
                  if (dCtx.mounted) Navigator.pop(dCtx);
                  // refresh categories list and auto-select the new one
                  final catRes = await _apiClient.client.get('/category/');
                  setModalState(() {
                    _categories = catRes.data ?? [];
                    selectedCategoryId = newCat['categoryId'] as int?;
                  });
                } catch (_) {
                  if (dCtx.mounted) Navigator.pop(dCtx);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Category already exists or failed to create.')),
                    );
                  }
                }
              },
              child: const Text('Create'),
            ),
          ],
        ),
      );
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 20, right: 20, top: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Add New Expense', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextField(controller: amountCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Amount (₹)')),
              const SizedBox(height: 12),
              TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Description')),
              const SizedBox(height: 12),
              DropdownButtonFormField<int>(
                value: selectedCategoryId,
                decoration: const InputDecoration(labelText: 'Category'),
                dropdownColor: AppTheme.surface,
                items: [
                  ..._categories.map((cat) => DropdownMenuItem<int>(
                    value: cat['categoryId'] as int,
                    child: Text(cat['categoryName']),
                  )),
                  const DropdownMenuItem<int>(
                    value: -1,
                    child: Row(
                      children: [
                        Icon(Icons.add_circle_outline, size: 16, color: AppTheme.primary),
                        SizedBox(width: 8),
                        Text('Create new category', style: TextStyle(color: AppTheme.primary)),
                      ],
                    ),
                  ),
                ],
                onChanged: (val) async {
                  if (val == -1) {
                    await showCreateCategoryDialog(setModalState);
                  } else {
                    setModalState(() => selectedCategoryId = val);
                  }
                },
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () async {
                  if (amountCtrl.text.isEmpty || selectedCategoryId == null || selectedCategoryId == -1) return;
                  await _apiClient.client.post(
                    '/expense/?categoryId=$selectedCategoryId',
                    data: {
                      'amount': double.parse(amountCtrl.text),
                      'description': descCtrl.text,
                      'expenseDate': DateTime.now().toIso8601String().split('T')[0],
                    },
                  );
                  if (ctx.mounted) Navigator.pop(ctx);
                  _fetchExpenses();
                },
                child: const Text('Save Expense'),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Expenses'),
        actions: [
          IconButton(icon: const Icon(Icons.add, color: AppTheme.primary), onPressed: _showAddExpenseModal),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search expenses...',
                prefixIcon: Icon(Icons.search, color: AppTheme.textSecondary),
              ),
              onChanged: _onSearchChanged,
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : _expenses.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.receipt_long_outlined, size: 64, color: AppTheme.textSecondary),
                        SizedBox(height: 16),
                        Text('No expenses yet', style: TextStyle(color: AppTheme.textSecondary, fontSize: 16)),
                      ],
                    ),
                  )
                : ListView.builder(
              itemCount: _expenses.length,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemBuilder: (context, idx) {
                final exp = _expenses[idx];
                return Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: ListTile(
                    title: Text(exp['description'] ?? 'Expense', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(exp['expenseTimestamp']?.toString().split('T')[0] ?? ''),
                    trailing: Text(
                      '₹${exp['amount']?.toStringAsFixed(2)}',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary, fontSize: 16),
                    ),
                  ),
                );
              },
            ),
          )
        ],
      ),
    );
  }
}
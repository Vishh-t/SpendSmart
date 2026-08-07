import 'package:flutter/material.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../import/import_statement_modal.dart';
import 'widgets/category_donut.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiClient _apiClient = ApiClient();
  Map<String, dynamic>? _data;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchSummary();
  }

  Future<void> _fetchSummary() async {
    try {
      final res = await _apiClient.client.get('/expense/dashboardSummary?year=${DateTime.now().year}');
      setState(() {
        _data = res.data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppTheme.primary)));
    }

    final budget = _data?['budgetStatus'] ?? {};
    final recent = (_data?['recentExpenses'] as List?) ?? [];
    final categoryBreakdown = (_data?['financialSummary']?['categoryBreakdown'] as Map<String, dynamic>?) ?? {};

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.upload_file, color: AppTheme.primary),
            onPressed: () async {
              final result = await showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: AppTheme.surface,
                shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
                builder: (_) => const ImportStatementModal(),
              );
              // Refresh dashboard if import was successful
              if (result == true) {
                setState(() => _isLoading = true);
                _fetchSummary();
              }
            },
          )
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchSummary,
        color: AppTheme.primary,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Monthly Budget Card
              _buildBudgetCard(budget),

              const SizedBox(height: 24),

              // Category Donut Chart
              const Text('Spending Breakdown', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: CategoryDonut(
                    categoryBreakdown: categoryBreakdown,
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Recent Expenses List
              const Text('Recent Expenses', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 12),
              if (recent.isEmpty)
                const Padding(padding: EdgeInsets.all(20), child: Center(child: Text('No expenses recorded yet', style: TextStyle(color: AppTheme.textSecondary))))
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: recent.length,
                  itemBuilder: (context, i) {
                    final item = recent[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: const CircleAvatar(
                          backgroundColor: AppTheme.surfaceLight,
                          child: Icon(Icons.shopping_bag_outlined, color: AppTheme.primary),
                        ),
                        title: Text(item['description'] ?? 'Expense', style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(item['category']?['categoryName'] ?? 'General', style: const TextStyle(color: AppTheme.textSecondary)),
                        trailing: Text(
                          '- ₹${item['amount']?.toStringAsFixed(2)}',
                          style: const TextStyle(color: AppTheme.accentRed, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBudgetCard(Map<String, dynamic> budget) {
    final spent = (budget['spent'] as num?)?.toDouble() ?? 0;
    final total = (budget['budget'] as num?)?.toDouble() ?? 1;
    final remaining = (budget['remaining'] as num?)?.toDouble() ?? 0;
    final isWarning = budget['warning'] == true;
    final percentage = (spent / total).clamp(0.0, 1.0);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Monthly Spend', style: TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
            const SizedBox(height: 6),
            Text(
              '₹${spent.toStringAsFixed(2)}',
              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 16),
            LinearProgressIndicator(
              value: percentage,
              backgroundColor: AppTheme.surfaceLight,
              valueColor: AlwaysStoppedAnimation<Color>(
                isWarning ? AppTheme.accentRed : AppTheme.primary,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Budget: ₹${total.toStringAsFixed(0)}', style: const TextStyle(color: AppTheme.textSecondary)),
                Text('Left: ₹${remaining.toStringAsFixed(0)}', style: const TextStyle(color: AppTheme.accentGreen, fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
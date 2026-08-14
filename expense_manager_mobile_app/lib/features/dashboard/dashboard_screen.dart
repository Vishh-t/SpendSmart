import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api_client.dart';
import '../../core/format_currency.dart';
import '../../core/format_date.dart';
import '../../core/theme.dart';
import '../../services/refresh_signal.dart';
import '../import/import_statement_modal.dart';
import 'widgets/category_donut.dart';
import 'widgets/spending_chart_mobile.dart';
import 'widgets/stat_card_mobile.dart';

const _welcomeDismissedKey = 'welcomeBannerDismissed';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiClient _apiClient = ApiClient();
  Map<String, dynamic>? _data;
  bool _isLoading = true;
  String? _error;
  int _selectedYear = DateTime.now().year;
  bool _showWelcome = false;
  DateTime _lastUpdated = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loadWelcomeDismissedState();
    _fetchSummary();
  }

  Future<void> _loadWelcomeDismissedState() async {
    final prefs = await SharedPreferences.getInstance();
    final dismissed = prefs.getBool(_welcomeDismissedKey) ?? false;
    if (mounted) setState(() => _showWelcome = !dismissed);
  }

  Future<void> _dismissWelcome() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_welcomeDismissedKey, true);
    if (mounted) setState(() => _showWelcome = false);
  }

  Future<void> _fetchSummary() async {
    setState(() => _error = null);
    try {
      final res = await _apiClient.client.get('/expense/dashboardSummary?year=$_selectedYear');
      setState(() {
        _data = res.data;
        _isLoading = false;
        _lastUpdated = DateTime.now();
      });
    } catch (e) {
      debugPrint('Dashboard fetch failed: $e');
      setState(() {
        _isLoading = false;
        _error = 'Failed to load dashboard data. Pull down to retry.';
      });
    }
  }

  void _onYearChanged(int year) {
    setState(() {
      _selectedYear = year;
      _isLoading = true;
    });
    _fetchSummary();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppTheme.primary)));
    }

    final financialSummary = (_data?['financialSummary'] as Map<String, dynamic>?) ?? {};
    final budget = (_data?['budgetStatus'] as Map<String, dynamic>?) ?? {};
    final annualSummary = (_data?['annualSummary'] as Map<String, dynamic>?) ?? {};
    final monthlyBreakdown = (annualSummary['monthlyBreakdown'] as Map<String, dynamic>?) ?? {};
    final recent = (_data?['recentExpenses'] as List?) ?? [];
    final categoryBreakdown = (financialSummary['categoryBreakdown'] as Map<String, dynamic>?) ?? {};

    final totalSpent = (financialSummary['totalSpent'] as num?)?.toDouble() ?? 0;
    final transactionCount = financialSummary['transactionCount'] ?? 0;
    final avgExpense = (financialSummary['averageExpenseValue'] as num?)?.toDouble() ?? 0;
    final spent = (budget['spent'] as num?)?.toDouble() ?? 0;
    final total = (budget['budget'] as num?)?.toDouble() ?? 1;
    final remaining = (budget['remaining'] as num?)?.toDouble() ?? 0;
    final percentage = total > 0 ? (spent / total).clamp(0.0, 1.0) : 0.0;
    final isNewAccount = transactionCount == 0;

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
              if (result == true) {
                context.read<RefreshSignal>().ping();
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
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // "Updated: <time>" line
              Row(
                children: [
                  const Icon(Icons.access_time, size: 12, color: AppTheme.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    'Updated: ${_lastUpdated.hour.toString().padLeft(2, '0')}:${_lastUpdated.minute.toString().padLeft(2, '0')}',
                    style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Error banner with retry — replaces the old silent-failure behavior
              if (_error != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.accentRed.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.accentRed.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: AppTheme.accentRed, size: 18),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_error!, style: const TextStyle(color: Colors.white, fontSize: 12))),
                      TextButton(
                        onPressed: () { setState(() => _isLoading = true); _fetchSummary(); },
                        child: const Text('Retry', style: TextStyle(color: AppTheme.primary)),
                      ),
                    ],
                  ),
                ),

              // Welcome banner — new accounts only, dismissible, persisted
              if (isNewAccount && _showWelcome)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppTheme.primary.withValues(alpha: 0.12), AppTheme.accentGreen.withValues(alpha: 0.06)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.primary.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.auto_awesome, color: AppTheme.primary, size: 18),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Welcome to Expenzo!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                            const SizedBox(height: 4),
                            const Text(
                              'Start by creating a few categories, then add an expense or import a bank statement.',
                              style: TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      GestureDetector(
                        onTap: _dismissWelcome,
                        child: const Icon(Icons.close, color: AppTheme.textSecondary, size: 16),
                      ),
                    ],
                  ),
                ),

              // Budget alert banner — separate, explicit, matches web behavior
              if (budget['warning'] == true)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppTheme.accentRed.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: const Border(left: BorderSide(color: AppTheme.accentRed, width: 3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: AppTheme.accentRed, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Budget Alert — ${(percentage * 100).toStringAsFixed(1)}% of monthly budget used',
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),

              // 4 stat cards — horizontally scrollable, avoids cramming a grid onto phone width
              SizedBox(
                height: 92,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    StatCardMobile(
                      title: 'TOTAL SPENT',
                      value: formatCurrency(totalSpent),
                      subtitle: '$transactionCount transactions',
                    ),
                    const SizedBox(width: 10),
                    StatCardMobile(
                      title: 'THIS MONTH',
                      value: formatCurrency(spent),
                      subtitle: 'Current month',
                    ),
                    const SizedBox(width: 10),
                    StatCardMobile(
                      title: 'BUDGET LEFT',
                      value: formatCurrency(remaining),
                      valueColor: remaining < 0 ? AppTheme.accentRed : AppTheme.primary,
                      subtitle: '${(percentage * 100).toStringAsFixed(0)}% used',
                      trailing: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: percentage,
                          minHeight: 3,
                          backgroundColor: AppTheme.surfaceLight,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            percentage >= 1.0 ? AppTheme.accentRed : (percentage >= 0.8 ? AppTheme.primary : AppTheme.accentGreen),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    StatCardMobile(
                      title: 'TRANSACTIONS',
                      value: '$transactionCount',
                      subtitle: 'Avg ${formatCurrency(avgExpense)}',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Spending trend chart — annual + monthly day-wise drill-down
              SpendingChartMobile(
                monthlyBreakdown: monthlyBreakdown,
                selectedYear: _selectedYear,
                onYearChanged: _onYearChanged,
              ),

              const SizedBox(height: 20),

              // Category Donut
              const Text('Spending Breakdown', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.surfaceLight, width: 1),
                ),
                child: CategoryDonut(categoryBreakdown: categoryBreakdown),
              ),

              const SizedBox(height: 20),

              // Recent Expenses
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Recent Ledger Entries', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                  GestureDetector(
                    onTap: () => context.go('/expenses'),
                    child: const Text('View All →', style: TextStyle(color: AppTheme.primary, fontSize: 12)),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (recent.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(20),
                  child: Center(child: Text('No expenses yet. Add your first expense!', style: TextStyle(color: AppTheme.textSecondary))),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: recent.length,
                  itemBuilder: (context, i) {
                    final item = recent[i];
                    final categoryName = item['category']?['categoryName'] ?? 'General';
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.surfaceLight, width: 1),
                      ),
                      child: Row(
                        children: [
                          const CircleAvatar(
                            backgroundColor: AppTheme.surfaceLight,
                            child: Icon(Icons.shopping_bag_outlined, color: AppTheme.primary, size: 18),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item['description'] ?? 'Expense',
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 3),
                                Row(
                                  children: [
                                    GestureDetector(
                                      onTap: () => context.go('/categories'),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppTheme.background,
                                          borderRadius: BorderRadius.circular(20),
                                        ),
                                        child: Text(categoryName, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 10)),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      formatDate(item['expenseTimestamp']),
                                      style: const TextStyle(color: AppTheme.textSecondary, fontSize: 10),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Text(
                            '-${formatCurrency(item['amount'])}',
                            style: const TextStyle(color: AppTheme.accentRed, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ],
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
}

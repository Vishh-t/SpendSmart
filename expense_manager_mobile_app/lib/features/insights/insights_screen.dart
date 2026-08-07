import 'package:flutter/material.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';

class InsightsScreen extends StatefulWidget {
  const InsightsScreen({Key? key}) : super(key: key);

  @override
  State<InsightsScreen> createState() => _InsightsScreenState();
}

class _InsightsScreenState extends State<InsightsScreen> {
  final ApiClient _apiClient = ApiClient();
  Map<String, dynamic>? _insights;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchInsights();
  }

  Future<void> _fetchInsights() async {
    try {
      final res = await _apiClient.client.get('/insights/summary');
      setState(() {
        _insights = res.data;
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppTheme.primary)));

    final burnRate      = (_insights?['burnRate']      as Map<String, dynamic>?) ?? {};
    final anomalies     = (_insights?['anomalies']     as List?) ?? [];
    final merchants     = (_insights?['merchants']     as List?) ?? [];
    final subscriptions = (_insights?['subscriptions'] as List?) ?? [];
    final dna           = (_insights?['dna']           as List?) ?? [];
    final delta         = (_insights?['delta']         as List?) ?? [];

    return Scaffold(
      appBar: AppBar(title: const Text('AI Insights')),
      body: RefreshIndicator(
        onRefresh: _fetchInsights,
        color: AppTheme.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              // ── Burn Rate ─────────────────────────────────────────────
              _sectionTitle('Daily Burn Rate'),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '₹${(burnRate['dailyBurnRate'] as num?)?.toStringAsFixed(2) ?? '0.00'}/day',
                        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppTheme.primary),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Projected month end: ₹${(burnRate['projectedMonthEndSpend'] as num?)?.toStringAsFixed(0) ?? '0'}', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                          _statusChip(burnRate['status'] as String? ?? ''),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text('Budget remaining: ₹${(burnRate['budgetRemaining'] as num?)?.toStringAsFixed(0) ?? '0'} · ${burnRate['daysUntilBudgetExhausted'] ?? 0} days left', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // ── Anomalies ─────────────────────────────────────────────
              _sectionTitle('Spending Anomalies'),
              if (anomalies.isEmpty)
                _emptyCard('No anomalies detected this month.')
              else
                ...anomalies.where((a) => a['insufficientData'] != true).map((a) => Card(
                  color: AppTheme.accentRed.withValues(alpha: 0.08),
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: const Icon(Icons.warning_amber_rounded, color: AppTheme.accentRed),
                    title: Text(a['categoryName'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(a['message'] ?? '', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                    trailing: Text(a['severity'] ?? '', style: const TextStyle(color: AppTheme.accentRed, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                )),

              const SizedBox(height: 20),

              // ── Subscriptions ─────────────────────────────────────────
              _sectionTitle('Recurring Subscriptions'),
              if (subscriptions.isEmpty)
                _emptyCard('No recurring subscriptions detected.')
              else
                ...subscriptions.map((s) => Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: AppTheme.surfaceLight,
                      child: Icon(Icons.repeat, color: AppTheme.primary, size: 18),
                    ),
                    title: Text(s['keyword'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('Next: ${s['nextExpectedChargeDate'] ?? 'Unknown'} · Annual: ₹${(s['annualCost'] as num?)?.toStringAsFixed(0) ?? '0'}', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                    trailing: Text('₹${(s['averageAmount'] as num?)?.toStringAsFixed(0) ?? '0'}/mo', style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
                  ),
                )),

              const SizedBox(height: 20),

              // ── Top Merchants ─────────────────────────────────────────
              _sectionTitle('Top Merchants'),
              if (merchants.isEmpty)
                _emptyCard('No merchant data available.')
              else
                Card(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Column(
                      children: merchants.take(5).map<Widget>((m) => ListTile(
                        dense: true,
                        leading: CircleAvatar(
                          radius: 14,
                          backgroundColor: AppTheme.primary.withValues(alpha: 0.15),
                          child: Text('${m['rank']}', style: const TextStyle(color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                        title: Text(m['keyword'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text('${(m['percentage'] as num?)?.toStringAsFixed(1) ?? '0'}% of total', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
                        trailing: Text('₹${(m['totalSpent'] as num?)?.toStringAsFixed(0) ?? '0'}', style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
                      )).toList(),
                    ),
                  ),
                ),

              const SizedBox(height: 20),

              // ── Weekly DNA ────────────────────────────────────────────
              _sectionTitle('Weekly Spending DNA'),
              if (dna.isEmpty)
                _emptyCard('Not enough data for weekly patterns.')
              else
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: dna.map<Widget>((d) {
                        final avg = (d['averageSpend'] as num?)?.toDouble() ?? 0;
                        final maxAvg = dna.map((x) => (x['averageSpend'] as num?)?.toDouble() ?? 0).reduce((a, b) => a > b ? a : b);
                        final barWidth = maxAvg > 0 ? avg / maxAvg : 0.0;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Row(
                            children: [
                              SizedBox(width: 36, child: Text(_dayLabel(d['day']), style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12))),
                              Expanded(
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: LinearProgressIndicator(
                                    value: barWidth.toDouble(),
                                    minHeight: 10,
                                    backgroundColor: AppTheme.surfaceLight,
                                    valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text('₹${avg.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),

              const SizedBox(height: 20),

              // ── Monthly Delta ─────────────────────────────────────────
              _sectionTitle('Month-over-Month'),
              if (delta.isEmpty)
                _emptyCard('No comparison data available.')
              else
                Card(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Column(
                      children: delta.map<Widget>((d) {
                        final trend = d['trend'] as String? ?? '';
                        final delta_ = (d['deltaPercentage'] as num?)?.toDouble();
                        return ListTile(
                          dense: true,
                          title: Text(d['category'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text('₹${(d['lastMonthSpend'] as num?)?.toStringAsFixed(0) ?? '0'} → ₹${(d['currentMonthSpend'] as num?)?.toStringAsFixed(0) ?? '0'}', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(_trendIcon(trend), color: _trendColor(trend), size: 16),
                              const SizedBox(width: 4),
                              Text(
                                trend == 'NEW' ? 'NEW' : trend == 'GONE' ? 'GONE' : '${delta_?.abs().toStringAsFixed(1) ?? '0'}%',
                                style: TextStyle(color: _trendColor(trend), fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionTitle(String title) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white)),
  );

  Widget _emptyCard(String msg) => Card(
    margin: const EdgeInsets.only(bottom: 8),
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Text(msg, style: const TextStyle(color: AppTheme.textSecondary)),
    ),
  );

  Widget _statusChip(String status) {
    Color color;
    switch (status) {
      case 'EXCEEDED': color = AppTheme.accentRed; break;
      case 'WARNING':  color = Colors.orange; break;
      default:         color = AppTheme.accentGreen;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
      child: Text(status, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }

  String _dayLabel(dynamic day) {
    const map = {'MONDAY': 'Mon', 'TUESDAY': 'Tue', 'WEDNESDAY': 'Wed', 'THURSDAY': 'Thu', 'FRIDAY': 'Fri', 'SATURDAY': 'Sat', 'SUNDAY': 'Sun'};
    return map[day?.toString()] ?? day?.toString().substring(0, 3) ?? '?';
  }

  IconData _trendIcon(String trend) {
    switch (trend) {
      case 'UP':   return Icons.trending_up;
      case 'DOWN': return Icons.trending_down;
      case 'NEW':  return Icons.fiber_new_outlined;
      case 'GONE': return Icons.remove_circle_outline;
      default:     return Icons.trending_flat;
    }
  }

  Color _trendColor(String trend) {
    switch (trend) {
      case 'UP':   return AppTheme.accentRed;
      case 'DOWN': return AppTheme.accentGreen;
      case 'NEW':  return AppTheme.primary;
      case 'GONE': return AppTheme.textSecondary;
      default:     return Colors.white70;
    }
  }
}
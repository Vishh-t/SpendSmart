import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/api_client.dart';
import '../../../core/format_currency.dart';
import '../../../core/theme.dart';

const _monthsFull = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const _monthsShort = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/// Mobile spending trend chart — same underlying capability as the web
/// app's SpendingChart (annual bar view + monthly day-wise drill-down),
/// but condensed into a single compact header row instead of four
/// separate toggle groups, since phone width can't fit that comfortably.
class SpendingChartMobile extends StatefulWidget {
  final Map<String, dynamic> monthlyBreakdown; // from annualSummary
  final int selectedYear;
  final ValueChanged<int> onYearChanged;

  const SpendingChartMobile({
    Key? key,
    required this.monthlyBreakdown,
    required this.selectedYear,
    required this.onYearChanged,
  }) : super(key: key);

  @override
  State<SpendingChartMobile> createState() => _SpendingChartMobileState();
}

class _SpendingChartMobileState extends State<SpendingChartMobile> {
  final ApiClient _apiClient = ApiClient();
  bool _monthlyView = false;
  int _selectedMonth = DateTime.now().month;
  List<double> _dayWiseData = [];
  bool _isDayLoading = false;

  Future<void> _loadDayWise(int month, int year) async {
    setState(() => _isDayLoading = true);
    try {
      final res = await _apiClient.client.get('/expense/summary?month=$month&year=$year');
      final expenses = (res.data['expenses'] as List?) ?? [];
      final daysInMonth = DateTime(year, month + 1, 0).day;
      final days = List<double>.filled(daysInMonth, 0);
      for (final e in expenses) {
        final ts = DateTime.tryParse(e['expenseTimestamp'] ?? '');
        if (ts != null && ts.day - 1 < days.length) {
          days[ts.day - 1] += (e['amount'] as num?)?.toDouble() ?? 0;
        }
      }
      if (mounted) setState(() => _dayWiseData = days);
    } catch (_) {
      if (mounted) setState(() => _dayWiseData = []);
    } finally {
      if (mounted) setState(() => _isDayLoading = false);
    }
  }

  void _pickYear(BuildContext context) async {
    final currentYear = DateTime.now().year;
    final years = List.generate(5, (i) => currentYear - i);
    final picked = await showModalBottomSheet<int>(
      context: context,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: years.map((y) => ListTile(
            title: Text('$y', style: TextStyle(color: y == widget.selectedYear ? AppTheme.primary : Colors.white)),
            onTap: () => Navigator.pop(context, y),
          )).toList(),
        ),
      ),
    );
    if (picked != null) {
      widget.onYearChanged(picked);
      if (_monthlyView) _loadDayWise(_selectedMonth, picked);
    }
  }

  void _pickMonth(BuildContext context) async {
    final picked = await showModalBottomSheet<int>(
      context: context,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      isScrollControlled: true,
      builder: (_) => SafeArea(
        child: SizedBox(
          height: 320,
          child: ListView.builder(
            itemCount: 12,
            itemBuilder: (_, i) => ListTile(
              title: Text(_monthsFull[i], style: TextStyle(color: i + 1 == _selectedMonth ? AppTheme.primary : Colors.white)),
              onTap: () => Navigator.pop(context, i + 1),
            ),
          ),
        ),
      ),
    );
    if (picked != null) {
      setState(() => _selectedMonth = picked);
      _loadDayWise(picked, widget.selectedYear);
    }
  }

  void _toggleView() {
    setState(() => _monthlyView = !_monthlyView);
    if (_monthlyView && _dayWiseData.isEmpty) {
      _loadDayWise(_selectedMonth, widget.selectedYear);
    }
  }

  @override
  Widget build(BuildContext context) {
    final annualBars = List.generate(12, (i) {
      final key = _monthsFull[i];
      return (widget.monthlyBreakdown[key] as num?)?.toDouble() ?? 0.0;
    });

    final barData = _monthlyView ? _dayWiseData : annualBars;
    final maxVal = barData.isEmpty ? 1.0 : barData.reduce((a, b) => a > b ? a : b);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.surfaceLight, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Compact header: title + tap targets for month (if monthly) and year
          Row(
            children: [
              Expanded(
                child: Text(
                  _monthlyView
                      ? '${_monthsShort[_selectedMonth - 1]} ${widget.selectedYear}, Day-wise'
                      : 'Monthly Spending — ${widget.selectedYear}',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              // Annual/Monthly compact switch
              GestureDetector(
                onTap: _toggleView,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceLight,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _monthlyView ? Icons.calendar_view_day : Icons.calendar_view_month,
                        size: 13,
                        color: AppTheme.primary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _monthlyView ? 'Monthly' : 'Annual',
                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Second row: month picker (only when in monthly view) + year picker — tap chips
          Row(
            children: [
              if (_monthlyView) ...[
                GestureDetector(
                  onTap: () => _pickMonth(context),
                  child: _chip('${_monthsShort[_selectedMonth - 1]}', Icons.expand_more),
                ),
                const SizedBox(width: 8),
              ],
              GestureDetector(
                onTap: () => _pickYear(context),
                child: _chip('${widget.selectedYear}', Icons.expand_more),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 180,
            child: _isDayLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2))
                : barData.every((v) => v == 0)
                    ? const Center(child: Text('No spending data yet', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)))
                    : BarChart(
                        BarChartData(
                          alignment: BarChartAlignment.spaceAround,
                          maxY: maxVal * 1.2,
                          gridData: const FlGridData(show: false),
                          borderData: FlBorderData(show: false),
                          titlesData: FlTitlesData(
                            leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            bottomTitles: AxisTitles(
                              sideTitles: SideTitles(
                                showTitles: true,
                                reservedSize: 20,
                                interval: _monthlyView ? 5 : 1,
                                getTitlesWidget: (value, meta) {
                                  final i = value.toInt();
                                  final label = _monthlyView ? '${i + 1}' : _monthsShort[i % 12].substring(0, 1);
                                  return Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 9)),
                                  );
                                },
                              ),
                            ),
                          ),
                          barTouchData: BarTouchData(
                            touchTooltipData: BarTouchTooltipData(
                              getTooltipItem: (group, groupIndex, rod, rodIndex) {
                                return BarTooltipItem(
                                  formatCurrency(rod.toY),
                                  const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                );
                              },
                            ),
                          ),
                          barGroups: List.generate(barData.length, (i) {
                            return BarChartGroupData(
                              x: i,
                              barRods: [
                                BarChartRodData(
                                  toY: barData[i],
                                  color: AppTheme.primary,
                                  width: _monthlyView ? 4 : 14,
                                  borderRadius: BorderRadius.circular(3),
                                ),
                              ],
                            );
                          }),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppTheme.background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.surfaceLight),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
          Icon(icon, size: 13, color: AppTheme.textSecondary),
        ],
      ),
    );
  }
}

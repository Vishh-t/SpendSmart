import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/theme.dart';

class CategoryDonut extends StatelessWidget {
  final Map<String, dynamic> categoryBreakdown;

  const CategoryDonut({Key? key, required this.categoryBreakdown}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (categoryBreakdown.isEmpty) {
      return const SizedBox(
        height: 200,
        child: Center(child: Text('No spending data yet', style: TextStyle(color: AppTheme.textSecondary))),
      );
    }

    // Convert map to list and sort by amount descending
    final entries = categoryBreakdown.entries.toList()
      ..sort((a, b) => (b.value as num).compareTo(a.value as num));

    // Colors to match the Obsidian Amber theme palette variations
    final List<Color> colors = [
      AppTheme.primary,
      AppTheme.primaryLight,
      const Color(0xFFD97706),
      const Color(0xFFB45309),
      AppTheme.surfaceLight,
    ];

    return SizedBox(
      height: 220,
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: PieChart(
              PieChartData(
                sectionsSpace: 2,
                centerSpaceRadius: 40,
                sections: List.generate(entries.length, (i) {
                  final double value = (entries[i].value as num).toDouble();
                  return PieChartSectionData(
                    color: colors[i % colors.length],
                    value: value,
                    title: '',
                    radius: 25,
                  );
                }),
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: entries.length,
              itemBuilder: (context, i) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4.0),
                  child: Row(
                    children: [
                      Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: colors[i % colors.length],
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          entries[i].key,
                          style: const TextStyle(fontSize: 12, color: Colors.white),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        '₹${(entries[i].value as num).toStringAsFixed(0)}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
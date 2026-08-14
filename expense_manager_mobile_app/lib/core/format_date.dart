import 'package:intl/intl.dart';

/// Matches the web app's date display format: "08 Aug 2026"
final _dateFormat = DateFormat('dd MMM yyyy');

String formatDate(String? timestamp) {
  if (timestamp == null || timestamp.isEmpty) return '—';
  try {
    final dt = DateTime.parse(timestamp);
    return _dateFormat.format(dt);
  } catch (_) {
    return '—';
  }
}

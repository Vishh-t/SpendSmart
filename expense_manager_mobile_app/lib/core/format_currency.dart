import 'package:intl/intl.dart';

/// Matches the web app's Indian-numbering-system currency display
/// (₹45,000 not ₹45000.00). Use formatCurrency for whole-rupee display
/// (stat cards, list amounts) and formatCurrencyPrecise when paise matter.
final _indianFormat = NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 0,
);

final _indianFormatPrecise = NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 2,
);

String formatCurrency(num? value) {
  if (value == null) return '₹0';
  return _indianFormat.format(value);
}

String formatCurrencyPrecise(num? value) {
  if (value == null) return '₹0.00';
  return _indianFormatPrecise.format(value);
}

/// Compact form for constrained spaces (chart axis labels): ₹45k, ₹1.2L
String formatCurrencyCompact(num? value) {
  if (value == null) return '₹0';
  if (value >= 10000000) return '₹${(value / 10000000).toStringAsFixed(1)}Cr';
  if (value >= 100000) return '₹${(value / 100000).toStringAsFixed(1)}L';
  if (value >= 1000) return '₹${(value / 1000).toStringAsFixed(0)}k';
  return '₹${value.toStringAsFixed(0)}';
}

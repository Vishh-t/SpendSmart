import 'package:flutter/foundation.dart';

/// Cross-screen data-refresh signal — the Flutter equivalent of the web app's
/// DataContext/refreshKey pattern. Any screen that mutates data (adds/edits/
/// deletes an expense, imports a statement, changes a budget) calls
/// `context.read<RefreshSignal>().ping()`. Any screen that displays data
/// listens for changes and refetches when pinged, so navigating back to an
/// already-built screen shows fresh data instead of a stale cache.
class RefreshSignal extends ChangeNotifier {
  int _tick = 0;
  int get tick => _tick;

  void ping() {
    _tick++;
    notifyListeners();
  }
}

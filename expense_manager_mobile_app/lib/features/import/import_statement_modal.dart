import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';

class ImportStatementModal extends StatefulWidget {
  const ImportStatementModal({Key? key}) : super(key: key);

  @override
  State<ImportStatementModal> createState() => _ImportStatementModalState();
}

class _ImportStatementModalState extends State<ImportStatementModal> {
  final ApiClient _apiClient = ApiClient();

  // States: 'select', 'processing', 'preview'
  String _viewState = 'select';
  String _statusText = '';

  List<dynamic> _parsedTransactions = [];
  List<dynamic> _categories = [];

  @override
  void initState() {
    super.initState();
    _fetchCategories();
  }

  Future<void> _fetchCategories() async {
    try {
      final res = await _apiClient.client.get('/category/');
      setState(() {
        _categories = res.data;
      });
    } catch (e) {
      debugPrint('Failed to load categories');
    }
  }

  Future<void> _pickAndUploadPdf() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['pdf']);
    if (result == null || result.files.single.path == null) return;

    setState(() {
      _viewState = 'processing';
      _statusText = 'Uploading PDF statement...';
    });

    try {
      final filePath = result.files.single.path!;
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath, filename: 'statement.pdf'),
        'includeCredits': false,
      });

      final parseRes = await _apiClient.client.post('/import/parse', data: formData);
      final jobId = parseRes.data['jobId'];

      _pollStatus(jobId);
    } catch (e) {
      setState(() {
        _statusText = 'Error uploading statement. Please try again.';
      });
    }
  }

  Future<void> _pollStatus(String jobId) async {
    setState(() => _statusText = 'Parsing transactions via AI...');
    for (int i = 0; i < 80; i++) {
      await Future.delayed(const Duration(seconds: 3));
      try {
        final res = await _apiClient.client.get('/import/status/$jobId');
        final status = res.data['status'];

        if (status == 'DONE') {
          setState(() {
            _parsedTransactions = res.data['result'] ?? [];
            _viewState = 'preview';
          });
          return;
        } else if (status == 'FAILED') {
          setState(() {
            _statusText = 'Statement parsing failed: ${res.data['error']}';
          });
          return;
        }
      } catch (e) {
        debugPrint('Polling error: $e');
      }
    }
    setState(() => _statusText = 'Parsing timed out. Please try a smaller file.');
  }

  Future<void> _confirmAndSave() async {
    setState(() {
      _viewState = 'processing';
      _statusText = 'Saving transactions...';
    });

    try {
      // 1. Prepare Bulk Expenses Payload
      final expensesPayload = _parsedTransactions.where((t) => t['duplicate'] != true).map((t) {
        return {
          "amount": t['amount'],
          "description": t['description'],
          "categoryId": t['categoryId'],
          "dateTime": t['dateTime'],
          "keyword": t['keyword']
        };
      }).toList();

      if (expensesPayload.isNotEmpty) {
        await _apiClient.client.post('/expense/bulk', data: expensesPayload);
      }

      // 2. Prepare Bulk Keyword Mappings Payload
      final mappingsPayload = _parsedTransactions
          .where((t) => t['keyword'] != null && t['categoryId'] != null)
          .map((t) => {
        "keyword": t['keyword'],
        "categoryId": t['categoryId']
      })
          .toList();

      if (mappingsPayload.isNotEmpty) {
        await _apiClient.client.post('/import/saveMappingsBulk', data: mappingsPayload);
      }

      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      setState(() => _viewState = 'preview');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to save transactions.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _viewState == 'preview' ? 'Review Transactions' : 'Import Statement',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              )
            ],
          ),
          const SizedBox(height: 16),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildBody() {
    switch (_viewState) {
      case 'processing':
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(color: AppTheme.primary),
            const SizedBox(height: 24),
            Text(_statusText, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16)),
          ],
        );
      case 'preview':
        return _buildPreviewTable();
      case 'select':
      default:
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.document_scanner_outlined, size: 80, color: AppTheme.primary),
            const SizedBox(height: 16),
            const Text(
              'Upload your bank statement (PDF) to let our AI automatically extract and categorize your spending.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              icon: const Icon(Icons.upload_file),
              label: const Text('Select PDF File'),
              onPressed: _pickAndUploadPdf,
            ),
          ],
        );
    }
  }

  Widget _buildPreviewTable() {
    if (_parsedTransactions.isEmpty) {
      return const Center(child: Text('No transactions found in this document.'));
    }

    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            itemCount: _parsedTransactions.length,
            itemBuilder: (context, index) {
              final tx = _parsedTransactions[index];
              final isDuplicate = tx['duplicate'] == true;

              return Card(
                color: isDuplicate ? AppTheme.surfaceLight.withOpacity(0.5) : AppTheme.surface,
                margin: const EdgeInsets.only(bottom: 8),
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              tx['description'] ?? 'Unknown',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                decoration: isDuplicate ? TextDecoration.lineThrough : null,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            '₹${tx['amount']?.toStringAsFixed(2)}',
                            style: TextStyle(
                              color: isDuplicate ? AppTheme.textSecondary : AppTheme.accentRed,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Text(
                            tx['dateTime']?.toString().split('T')[0] ?? '',
                            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                          ),
                          const Spacer(),
                          if (!isDuplicate)
                            _buildCategoryDropdown(index, tx['categoryId']),
                          if (isDuplicate)
                            const Text('DUPLICATE', style: TextStyle(color: AppTheme.accentRed, fontSize: 12, fontWeight: FontWeight.bold))
                        ],
                      )
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: _confirmAndSave,
          child: Text('Confirm & Save ${_parsedTransactions.where((t) => t['duplicate'] != true).length} Transactions'),
        )
      ],
    );
  }

  Widget _buildCategoryDropdown(int txIndex, int? currentCategoryId) {
    return Container(
      height: 30,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLight,
        borderRadius: BorderRadius.circular(6),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<int>(
          value: currentCategoryId,
          hint: const Text('Select Category', style: TextStyle(fontSize: 12)),
          icon: const Icon(Icons.arrow_drop_down, size: 16),
          style: const TextStyle(fontSize: 12, color: Colors.white),
          dropdownColor: AppTheme.surface,
          items: _categories.map((cat) {
            return DropdownMenuItem<int>(
              value: cat['categoryId'],
              child: Text(cat['categoryName']),
            );
          }).toList(),
          onChanged: (newId) {
            setState(() {
              _parsedTransactions[txIndex]['categoryId'] = newId;
            });
          },
        ),
      ),
    );
  }
}
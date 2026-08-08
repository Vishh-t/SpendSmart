class User {
  final int? userId;
  final String username;
  final String name;
  final String email;
  final double? monthlyBudget;

  User({this.userId, required this.username, required this.name, required this.email, this.monthlyBudget});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      userId: json['userId'],
      username: json['username'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      monthlyBudget: (json['monthlyBudget'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class Category {
  final int categoryId;
  final String categoryName;
  final double? monthlyBudget;

  Category({required this.categoryId, required this.categoryName, this.monthlyBudget});

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      categoryId: json['categoryId'],
      categoryName: json['categoryName'] ?? 'Uncategorized',
      monthlyBudget: (json['monthlyBudget'] as num?)?.toDouble(),
    );
  }
}

class Expense {
  final int expenseId;
  final double amount;
  final String? description;
  final String expenseTimestamp;
  final String? keyword;
  final Category? category;

  Expense({
    required this.expenseId,
    required this.amount,
    this.description,
    required this.expenseTimestamp,
    this.keyword,
    this.category,
  });

  factory Expense.fromJson(Map<String, dynamic> json) {
    return Expense(
      expenseId: json['expenseId'],
      amount: (json['amount'] as num).toDouble(),
      description: json['description'],
      expenseTimestamp: json['expenseTimestamp'] ?? '',
      keyword: json['keyword'],
      category: json['category'] != null ? Category.fromJson(json['category']) : null,
    );
  }
}
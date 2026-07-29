package org.example.expense_manager.Service;

import lombok.RequiredArgsConstructor;
import org.example.expense_manager.DTO.ControllerDTOs.BulkExpenseItemDTO;
import org.example.expense_manager.DTO.ServiceDTOs.*;
import org.example.expense_manager.Entity.Category;
import org.example.expense_manager.Entity.Expense;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Exceptions.InvalidFieldNameException;
import org.example.expense_manager.Exceptions.NotFoundException;
import org.example.expense_manager.Exceptions.UnauthorizedUserException;
import org.example.expense_manager.Repository.CategoryRepo;
import org.example.expense_manager.Repository.ExpenseRepo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService
{
    private final ExpenseRepo repo;
    private final CategoryRepo categoryRepo;
    private final SummaryService summaryService;

    private ExpenseResponseDTO convertToResponse(Expense expense)
    {
        ExpenseResponseDTO response = new ExpenseResponseDTO();
        CategorySummaryDTO category = new CategorySummaryDTO();
        category.setCategoryId(expense.getCategory().getCategoryId());
        category.setCategoryName(expense.getCategory().getCategoryName());
        response.setExpenseId(expense.getExpenseId());
        response.setKeyword(expense.getKeyword());
        response.setDescription(expense.getDescription());
        response.setAmount(expense.getAmount());
        response.setCategory(category);
        response.setExpenseTimestamp(expense.getExpenseTimestamp());
        return response;
    }

    public ExpenseResponseDTO addExpense(User user, int categoryId, Expense expense)
    {
        Category category = categoryRepo.findById(categoryId).orElseThrow(() -> new NotFoundException("Category not found"));
        expense.setUser(user);
        expense.setCategory(category);
        if (expense.getExpenseTimestamp() == null) expense.setExpenseTimestamp(LocalDateTime.now());
        repo.save(expense);
        summaryService.evictUserCaches(user.getUserId());
        return convertToResponse(expense);
    }

    public List<ExpenseResponseDTO> getExpensesByUser(User user)
    {
        List<Expense> expenses = repo.findAllByUser(user);
        List<ExpenseResponseDTO> responses = new ArrayList<>();
        for (var expense : expenses)
        {
            responses.add(convertToResponse(expense));
        }
        return responses;
    }

    public ExpenseResponseDTO getExpenseById(int expenseId, User user)
    {
        Expense expense = repo.findById(expenseId).orElseThrow(() -> new NotFoundException("Expense not found"));
        if (expense.getUser().equals(user))
        {
            return convertToResponse(expense);
        } else
        {
            throw new UnauthorizedUserException("cannot access other user's expenses");
        }
    }

    public ExpenseResponseDTO updateExpense(User user, int expenseId, Integer categoryId, Expense expense)
    {
        Expense storedExpense = repo.findById(expenseId).orElseThrow(() -> new NotFoundException("Expense not found "));
        if (categoryId != null)
        {
            Category category = categoryRepo.findById(categoryId).orElseThrow(() -> new NotFoundException("Category not found"));
            storedExpense.setCategory(category);
        }
        if (storedExpense.getUser().getUserId().equals(user.getUserId()))
        {
            if (expense.getAmount() != null && expense.getAmount().compareTo(BigDecimal.ZERO) > 0)
            {
                storedExpense.setAmount(expense.getAmount());
            }
            if (expense.getDescription() != null)
            {
                storedExpense.setDescription(expense.getDescription());
            }
            if (expense.getExpenseTimestamp() != null)
            {
                storedExpense.setExpenseTimestamp(expense.getExpenseTimestamp());
            }
            repo.save(storedExpense);
            summaryService.evictUserCaches(user.getUserId());
            return convertToResponse(storedExpense);
        } else
        {
            throw new UnauthorizedUserException("not allowed to change other user's expenses ");
        }
    }

    public ExpenseResponseDTO deleteExpense(User user, int expenseId)
    {
        Expense expense = repo.findById(expenseId).orElseThrow(() -> new NotFoundException("Expense not found"));
        if (expense.getUser().equals(user))
        {
            repo.deleteById(expenseId);
            summaryService.evictUserCaches(user.getUserId());
            return convertToResponse(expense);
        } else
        {
            throw new UnauthorizedUserException("Cannot delete other user's Expenses");
        }
    }

    public List<ExpenseResponseDTO> getExpensesByCategory(int categoryId, User user)
    {
        Category category = categoryRepo.findById(categoryId).orElseThrow(() -> new NotFoundException("Category not found"));
        List<Expense> requiredExpenses = repo.findAllByUserAndCategory(user, category);
        List<ExpenseResponseDTO> responses = new ArrayList<>();
        for (var expense : requiredExpenses)
        {
            responses.add(convertToResponse(expense));
        }
        return responses;
    }

    public List<ExpenseResponseDTO> getExpensesByDateRange(User user, LocalDate startDay, LocalDate endDay)
    {
        LocalDateTime start = startDay.atStartOfDay();
        LocalDateTime end = endDay.atTime(LocalTime.MAX);
        List<Expense> expenses = repo.findAllByUserAndExpenseTimestampBetween(user, start, end);
        if (expenses.isEmpty())
        {
            throw new NotFoundException("No Expense found");
        }
        List<ExpenseResponseDTO> responses = new ArrayList<>();
        for (var expense : expenses)
        {
            responses.add(convertToResponse(expense));
        }
        return responses;
    }

    public List<ExpenseResponseDTO> getSortedExpenses(User user, String sortBy, String order)
    {
        Sort.Direction direction;
        if (order.equalsIgnoreCase("asc"))
        {
            direction = Sort.Direction.ASC;
        } else
        {
            direction = Sort.Direction.DESC;
        }

        if (sortBy.equalsIgnoreCase("amount"))
        {
            sortBy = "amount";
        } else if (sortBy.equalsIgnoreCase("expenseTimestamp"))
        {
            sortBy = "expenseTimestamp";
        } else
        {
            throw new InvalidFieldNameException("Field does not exist ");
        }

        Sort sort = Sort.by(direction, sortBy);
        List<Expense> expenses = repo.findAllByUser(user, sort);
        List<ExpenseResponseDTO> responses = new ArrayList<>();
        for (var expense : expenses)
        {
            responses.add(convertToResponse(expense));
        }
        return responses;
    }

    public MonthlySummaryDTO monthlySummary(User user, int month, int year)
    {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        LocalDateTime startDate = start.atStartOfDay();
        LocalDateTime endDate = end.atTime(LocalTime.MAX);

        List<Expense> expenses = repo.findAllByUserAndExpenseTimestampBetween(user, startDate, endDate);
        List<ExpenseResponseDTO> responses = new ArrayList<>();

        for (var expense : expenses)
        {
            responses.add(convertToResponse(expense));
        }

        int transactionCount = expenses.size();
        BigDecimal totalSpent = BigDecimal.ZERO;
        Map<String, BigDecimal> categoryBreakdown = new HashMap<>();
        BigDecimal budget = user.getMonthlyBudget();

        for (Expense expense : expenses)
        {
            totalSpent = totalSpent.add(expense.getAmount());
            String categoryName = expense.getCategory().getCategoryName();
            BigDecimal current = categoryBreakdown.getOrDefault(categoryName, BigDecimal.ZERO);
            categoryBreakdown.put(categoryName, current.add(expense.getAmount()));
        }

        BigDecimal remaining = budget.subtract(totalSpent);

        Expense highestExpense = expenses.stream().max(Comparator.comparing(Expense::getAmount)).orElse(null);
        Expense lowestExpense = expenses.stream().min(Comparator.comparing(Expense::getAmount)).orElse(null);
        BigDecimal averageExpenseValue = expenses.isEmpty() ? BigDecimal.ZERO : totalSpent.divide(BigDecimal.valueOf(expenses.size()), 2, RoundingMode.HALF_UP);

        Map<String, BigDecimal> categoryPercentage = new HashMap<>();
        final BigDecimal finalTotalSpent = totalSpent;

        categoryBreakdown.forEach((category, amount) ->
        {
            if (finalTotalSpent.compareTo(BigDecimal.ZERO) == 0) return;
            BigDecimal percentage = amount.divide(finalTotalSpent, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
            categoryPercentage.put(category, percentage);
        });

        MonthlySummaryDTO summaryDTO = new MonthlySummaryDTO();
        summaryDTO.setMonth(month);
        summaryDTO.setYear(year);
        summaryDTO.setExpenses(responses);
        summaryDTO.setBudget(budget);
        summaryDTO.setTransactionCount(transactionCount);
        summaryDTO.setRemaining(remaining);
        summaryDTO.setCategoryBreakdown(categoryBreakdown);
        summaryDTO.setTotalSpent(totalSpent);
        summaryDTO.setHighestExpense(convertToResponse(Objects.requireNonNull(highestExpense)));
        summaryDTO.setLowestExpense(convertToResponse(lowestExpense));
        summaryDTO.setAverageExpenseValue(averageExpenseValue);
        summaryDTO.setCategoryPercentage(categoryPercentage);

        return summaryDTO;
    }

    public String clearDescription(User user, int expenseId)
    {
        Expense expense = repo.findById(expenseId).orElseThrow(() -> new NotFoundException("Expense not found"));
        String oldDesc = expense.getDescription();
        if (expense.getUser().getUserId().equals(user.getUserId()))
        {
            expense.setDescription(null);
            repo.save(expense);
        } else
        {
            throw new UnauthorizedUserException("Cannot access other's expenses");
        }
        return oldDesc;
    }

    public AnnualSummaryDTO annualSummary(User user, int year)
    {
        return summaryService.annualSummary(user, year);
    }

    public BudgetStatusDTO checkBudgetStatus(User user)
    {
        return summaryService.checkBudgetStatus(user);
    }

    public FinancialSummaryDTO financialSummary(User user)
    {
        return summaryService.financialSummary(user);
    }

    public List<ExpenseResponseDTO> addBulkExpenses(User user, List<BulkExpenseItemDTO> items)
    {
        // fetch ALL needed categories in one query instead of N queries
        List<Integer> categoryIds = items.stream()
                .map(BulkExpenseItemDTO::getCategoryId)
                .distinct()
                .collect(Collectors.toList());

        Map<Integer, Category> categoryMap = categoryRepo.findAllById(categoryIds)
                .stream()
                .collect(Collectors.toMap(Category::getCategoryId, c -> c));

        List<Expense> expenses = new ArrayList<>();
        List<ExpenseResponseDTO> responses = new ArrayList<>();

        for (var item : items)
        {
            Category category = categoryMap.get(item.getCategoryId());
            if (category == null) throw new NotFoundException("Category not found: " + item.getCategoryId());

            Expense expense = new Expense();
            expense.setCategory(category);
            expense.setDescription(item.getDescription());
            expense.setAmount(item.getAmount());
            expense.setKeyword(item.getKeyword());
            expense.setUser(user);
            expense.setExpenseTimestamp(item.getDateTime() != null ? item.getDateTime() : LocalDateTime.now());
            expenses.add(expense);
            responses.add(convertToResponse(expense));
        }

        repo.saveAll(expenses);
        summaryService.evictUserCaches(user.getUserId());
        return responses;
    }

    public String renameKeyword(User user, String oldKeyword, String newKeyword)
    {
        List<Expense> expenses = repo.findAllByUserAndKeyword(user, oldKeyword);
        if (expenses.isEmpty()) throw new NotFoundException("No expenses found with keyword: " + oldKeyword);
        for (Expense expense : expenses)
        {
            expense.setKeyword(newKeyword);
        }
        repo.saveAll(expenses);
        summaryService.evictUserCaches(user.getUserId());
        return newKeyword;
    }

    public List<ExpenseResponseDTO> getExpensesByKeyword(User user, String keyword)
    {
        List<Expense> expenses = repo.findAllByUserAndKeyword(user, keyword);
        if (expenses.isEmpty()) throw new NotFoundException("No expenses found for keyword: " + keyword);
        List<ExpenseResponseDTO> responses = new ArrayList<>();
        for (var expense : expenses)
        {
            responses.add(convertToResponse(expense));
        }
        return responses;
    }

    public Page<ExpenseResponseDTO> getPaginatedExpenses(User user, int page, int size, String sortBy, String direction)
    {
        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return repo.findAllByUser(user, pageable).map(this::convertToResponse);
    }

    public Page<ExpenseResponseDTO> getFilteredPaginatedExpenses(User user, int page, int size, String sortBy, String direction, Integer categoryId, String search)
    {
        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        String trimmedSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        return repo.findFilteredExpenses(user, categoryId, trimmedSearch, pageable).map(this::convertToResponse);
    }

    public DashboardSummaryDTO getDashboardSummary(User user, int year)
    {
        return summaryService.getDashboardSummary(user, year);
    }
}

package org.example.expense_manager.Service;

import lombok.RequiredArgsConstructor;
import org.example.expense_manager.DTO.ServiceDTOs.AnnualSummaryDTO;
import org.example.expense_manager.DTO.ServiceDTOs.BudgetStatusDTO;
import org.example.expense_manager.DTO.ServiceDTOs.FinancialSummaryDTO;
import org.example.expense_manager.DTO.ServiceDTOs.MonthlySummaryDTO;
import org.example.expense_manager.Entity.Category;
import org.example.expense_manager.Entity.Expense;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Exceptions.InvalidFieldNameException;
import org.example.expense_manager.Exceptions.NotFoundException;
import org.example.expense_manager.Exceptions.UnauthorizedUserException;
import org.example.expense_manager.Repository.CategoryRepo;
import org.example.expense_manager.Repository.ExpenseRepo;
import org.example.expense_manager.Repository.UserRepo;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;


import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Month;
import java.util.*;

import static java.lang.Boolean.TRUE;

@Service
@RequiredArgsConstructor
public class ExpenseService
{
    private final ExpenseRepo repo;
    private final CategoryRepo categoryRepo;


    public Boolean addExpense(User user, int categoryId, Expense expense)
    {

        Category category = categoryRepo.findById(categoryId).orElseThrow(() -> new NotFoundException("Category not found"));
        expense.setUser(user);
        expense.setCategory(category);

        if (expense.getExpenseTimestamp() == null)
            expense.setExpenseTimestamp(LocalDateTime.now());

        repo.save(expense);
        return TRUE;

    }

    public List<Expense> getExpensesByUser(User user)
    {

        return repo.findAllByUser(user);

    }

    public Expense getExpenseById(int expenseId, User user)
    {

        Expense expense = repo.findById(expenseId).orElseThrow(() -> new NotFoundException("Expense not found"));

        if (expense.getUser().equals(user))
        {
            return expense;
        } else
        {
            throw new UnauthorizedUserException("cannot access other user's expenses");
        }
    }

    public Boolean updateExpense(User user, int expenseId, Integer categoryId, Expense expense)
    {
        Expense storedExpense = repo.findById(expenseId).orElseThrow(() -> new NotFoundException("Expense not found "));
        if (categoryId != null)
        {
            Category category = categoryRepo.findById(categoryId)
                    .orElseThrow(() -> new NotFoundException("Category not found"));
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
            return TRUE;

        } else
        {
            throw new UnauthorizedUserException("not allowed to change other user's expenses ");
        }
    }

    public Boolean deleteExpense(User user, int expenseId)
    {

        Expense expense = repo.findById(expenseId).orElseThrow(() -> new NotFoundException("Expense not found"));
        if (expense.getUser().equals(user))
        {
            repo.deleteById(expenseId);
            return TRUE;
        } else
        {
            throw new UnauthorizedUserException("Cannot delete other user's Expenses");
        }
    }

    public List<Expense> getExpensesByCategory(int categoryId, User user)
    {

        Category category = categoryRepo.findById(categoryId).orElseThrow(() -> new NotFoundException("Category not found"));
        List<Expense> requiredExpense = repo.findAllByUserAndCategory(user, category);

        if (requiredExpense.isEmpty())
        {
            throw new NotFoundException("No Expense found");
        }

        return requiredExpense;

    }

    public List<Expense> getExpensesByDateRange(User user, LocalDate startDay, LocalDate endDay)
    {

        LocalDateTime start = startDay.atStartOfDay();
        LocalDateTime end = endDay.atTime(LocalTime.MAX);

        List<Expense> expenses = repo.findAllByUserAndExpenseTimestampBetween(user, start, end);
        if (expenses.isEmpty())
        {
            throw new NotFoundException("No Expense found");
        }
        return expenses;
    }

    public List<Expense> getSortedExpenses(User user, String sortBy, String order)
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

        return expenses;
    }

    public MonthlySummaryDTO monthlySummary(User user, int month, int year)
    {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        LocalDateTime startDate = start.atStartOfDay();
        LocalDateTime endDate = end.atTime(LocalTime.MAX);

        List<Expense> expenses = repo.findAllByUserAndExpenseTimestampBetween(user, startDate, endDate);


        int transactionCount = expenses.size();
        BigDecimal totalSpent = BigDecimal.ZERO;
        Map<String, BigDecimal> categoryBreakdown = new HashMap<>();

        BigDecimal budget = user.getMonthlyBudget();

        for (Expense expense : expenses)
        {
            // calculating total sum
            totalSpent = totalSpent.add(expense.getAmount());

            // grouping
            String categoryName = expense.getCategory().getCategoryName();
            BigDecimal current = categoryBreakdown.getOrDefault(categoryName, BigDecimal.ZERO);
            categoryBreakdown.put(categoryName, current.add(expense.getAmount()));
        }


        BigDecimal remaining = budget.subtract(totalSpent);

        Expense highestExpense = expenses.stream().max(Comparator.comparing(Expense::getAmount)).orElse(null);
        Expense lowestExpense = expenses.stream().min(Comparator.comparing(Expense::getAmount)).orElse(null);
        BigDecimal averageExpenseValue = expenses.isEmpty() ? BigDecimal.ZERO
                : totalSpent.divide(BigDecimal.valueOf(expenses.size()), 2, RoundingMode.HALF_UP);

        Map<String, BigDecimal> categoryPercentage = new HashMap<>();

        final BigDecimal finalTotalSpent = totalSpent;

        categoryBreakdown.forEach((category, amount) ->
        {
            if (finalTotalSpent.compareTo(BigDecimal.ZERO) == 0) return;

            BigDecimal percentage = amount.divide(finalTotalSpent, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
            categoryPercentage.put(category, percentage);
        });

        MonthlySummaryDTO summaryDTO = new MonthlySummaryDTO();
        summaryDTO.setMonth(month);
        summaryDTO.setYear(year);
        summaryDTO.setExpenses(expenses);
        summaryDTO.setBudget(budget);
        summaryDTO.setTransactionCount(transactionCount);
        summaryDTO.setRemaining(remaining);
        summaryDTO.setCategoryBreakdown(categoryBreakdown);
        summaryDTO.setTotalSpent(totalSpent);
        summaryDTO.setHighestExpense(highestExpense);
        summaryDTO.setLowestExpense(lowestExpense);
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
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);

        LocalDateTime startDate = start.atStartOfDay();
        LocalDateTime endDate = end.atTime(LocalTime.MAX);

        List<Expense> expenses = repo.findAllByUserAndExpenseTimestampBetween(user, startDate, endDate);
        BigDecimal totalSpent = BigDecimal.ZERO;

        Map<String, BigDecimal> monthlyBreakdown = new LinkedHashMap<>();
        for (var m : Month.values())
        {
            monthlyBreakdown.put(m.name(), BigDecimal.ZERO);
        }

        for (var expense : expenses)
        {

            // calculating total spent
            totalSpent = totalSpent.add(expense.getAmount());

            // monthly Breakdown
            String month = expense.getExpenseTimestamp().getMonth().name();
            BigDecimal current = monthlyBreakdown.get(month);
            monthlyBreakdown.put(month, current.add(expense.getAmount()));

        }

        Expense highestExpense = expenses.stream().max(Comparator.comparing(Expense::getAmount)).orElse(null);
        Expense lowestExpense = expenses.stream().min(Comparator.comparing(Expense::getAmount)).orElse(null);
        BigDecimal averageExpenseValue = expenses.isEmpty() ? BigDecimal.ZERO
                : totalSpent.divide(BigDecimal.valueOf(expenses.size()), 2, RoundingMode.HALF_UP);

        Map<String, BigDecimal> monthlyPercentage = new HashMap<>();

        final BigDecimal finalTotalSpent = totalSpent;

        monthlyBreakdown.forEach((category, amount) ->
        {
            if (finalTotalSpent.compareTo(BigDecimal.ZERO) == 0) return;

            BigDecimal percentage = amount.divide(finalTotalSpent, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
            monthlyPercentage.put(category, percentage);
        });

        AnnualSummaryDTO summaryDTO = new AnnualSummaryDTO();
        summaryDTO.setTotalSpent(totalSpent);
        summaryDTO.setTransactionCount(expenses.size());
        summaryDTO.setMonthlyBreakdown(monthlyBreakdown);
        summaryDTO.setHighestExpense(highestExpense);
        summaryDTO.setLowestExpense(lowestExpense);
        summaryDTO.setAverageExpenseValue(averageExpenseValue);
        summaryDTO.setMonthlyPercentage(monthlyPercentage);

        return summaryDTO;
    }

    public BudgetStatusDTO checkBudgetStatus(User user)
    {

        BigDecimal budget = user.getMonthlyBudget();

        Month month = LocalDate.now().getMonth();
        int year = LocalDate.now().getYear();

        LocalDate start = LocalDate.of(year, month, 1);

        LocalDateTime startDate = start.atStartOfDay();
        LocalDateTime today = LocalDateTime.now();

        List<Expense> expenses = repo.findAllByUserAndExpenseTimestampBetween(user, startDate, today);
        BigDecimal spent = BigDecimal.ZERO;

        for (var expense : expenses)
        {

            // total spent
            spent = spent.add(expense.getAmount());

        }

        BigDecimal remaining = budget.subtract(spent);

        boolean warning = false;
        if (spent.compareTo(budget.multiply(new BigDecimal("0.8"))) >= 0)
        {
            warning = true;
        }

        BudgetStatusDTO budgetSummary = new BudgetStatusDTO();
        budgetSummary.setBudget(budget);
        budgetSummary.setRemaining(remaining);
        budgetSummary.setSpent(spent);
        budgetSummary.setWarning(warning);

        return budgetSummary;

    }

    public FinancialSummaryDTO financialSummary(User user)
    {

        List<Expense> expenses = repo.findAllByUser(user);

        int transactionCount = expenses.size();
        BigDecimal totalSpent = BigDecimal.ZERO;
        Map<String, BigDecimal> categoryBreakdown = new HashMap<>();

        for (Expense expense : expenses)
        {
            // calculating total sum
            totalSpent = totalSpent.add(expense.getAmount());

            // grouping
            String categoryName = expense.getCategory().getCategoryName();
            BigDecimal current = categoryBreakdown.getOrDefault(categoryName, BigDecimal.ZERO);
            categoryBreakdown.put(categoryName, current.add(expense.getAmount()));
        }

        final BigDecimal finalTotalSpent = totalSpent;

        Map<String, BigDecimal> categoryPercentage = new HashMap<>();

        categoryBreakdown.forEach((category, amount) ->
        {
            if (finalTotalSpent.compareTo(BigDecimal.ZERO) == 0) return;

            BigDecimal percentage = amount.divide(finalTotalSpent, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
            categoryPercentage.put(category, percentage);
        });


        Expense highestExpense = expenses.stream().max(Comparator.comparing(Expense::getAmount)).orElse(null);
        Expense lowestExpense = expenses.stream().min(Comparator.comparing(Expense::getAmount)).orElse(null);
        BigDecimal averageExpenseValue = expenses.isEmpty() ? BigDecimal.ZERO
                : totalSpent.divide(BigDecimal.valueOf(expenses.size()), 2, RoundingMode.HALF_UP);

        FinancialSummaryDTO summaryDTO = new FinancialSummaryDTO();
        summaryDTO.setTransactionCount(transactionCount);
        summaryDTO.setCategoryBreakdown(categoryBreakdown);
        summaryDTO.setTotalSpent(totalSpent);
        summaryDTO.setHighestExpense(highestExpense);
        summaryDTO.setLowestExpense(lowestExpense);
        summaryDTO.setAverageExpenseValue(averageExpenseValue);
        summaryDTO.setCategoryPercentage(categoryPercentage);

        return summaryDTO;
    }


}

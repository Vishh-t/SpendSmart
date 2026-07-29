package org.example.expense_manager.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.expense_manager.DTO.ServiceDTOs.*;
import org.example.expense_manager.Entity.Expense;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Repository.ExpenseRepo;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Month;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SummaryService
{
    private final ExpenseRepo repo;

    ExpenseResponseDTO convertToResponse(Expense expense)
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

    @Cacheable(value = "financialSummary", key = "#user.userId")
    public FinancialSummaryDTO financialSummary(User user)
    {
        log.info("[CACHE MISS] financialSummary — hitting DB for userId={}", user.getUserId());
        List<Expense> expenses = repo.findAllByUser(user);
        int transactionCount = expenses.size();
        BigDecimal totalSpent = BigDecimal.ZERO;
        Map<String, BigDecimal> categoryBreakdown = new HashMap<>();
        for (Expense expense : expenses)
        {
            totalSpent = totalSpent.add(expense.getAmount());
            categoryBreakdown.merge(expense.getCategory().getCategoryName(), expense.getAmount(), BigDecimal::add);
        }
        final BigDecimal finalTotalSpent = totalSpent;
        Map<String, BigDecimal> categoryPercentage = new HashMap<>();
        categoryBreakdown.forEach((cat, amount) -> {
            if (finalTotalSpent.compareTo(BigDecimal.ZERO) == 0) return;
            categoryPercentage.put(cat, amount.divide(finalTotalSpent, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")));
        });
        Expense highest = expenses.stream().max(Comparator.comparing(Expense::getAmount)).orElse(null);
        Expense lowest  = expenses.stream().min(Comparator.comparing(Expense::getAmount)).orElse(null);
        BigDecimal avg  = expenses.isEmpty() ? BigDecimal.ZERO : totalSpent.divide(BigDecimal.valueOf(expenses.size()), 2, RoundingMode.HALF_UP);
        BigDecimal avgMonthly = BigDecimal.ZERO;
        if (!expenses.isEmpty())
        {
            Expense first = repo.findFirstByUserOrderByExpenseTimestampAsc(user);
            Expense last  = repo.findFirstByUserOrderByExpenseTimestampDesc(user);
            if (first != null && last != null)
            {
                long months = java.time.temporal.ChronoUnit.MONTHS.between(
                        first.getExpenseTimestamp().toLocalDate().withDayOfMonth(1),
                        last.getExpenseTimestamp().toLocalDate().withDayOfMonth(1)) + 1;
                avgMonthly = totalSpent.divide(BigDecimal.valueOf(months), 2, RoundingMode.HALF_UP);
            }
        }
        FinancialSummaryDTO dto = new FinancialSummaryDTO();
        dto.setTransactionCount(transactionCount);
        dto.setCategoryBreakdown(categoryBreakdown);
        dto.setTotalSpent(totalSpent);
        dto.setHighestExpense(highest != null ? convertToResponse(highest) : null);
        dto.setLowestExpense(lowest   != null ? convertToResponse(lowest)  : null);
        dto.setAverageExpenseValue(avg);
        dto.setAverageMonthlySpend(avgMonthly);
        dto.setCategoryPercentage(categoryPercentage);
        return dto;
    }

    @Cacheable(value = "budgetStatus", key = "#user.userId")
    public BudgetStatusDTO checkBudgetStatus(User user)
    {
        log.info("[CACHE MISS] budgetStatus — hitting DB for userId={}", user.getUserId());
        BigDecimal budget = user.getMonthlyBudget();
        LocalDateTime startDate = LocalDate.of(LocalDate.now().getYear(), LocalDate.now().getMonth(), 1).atStartOfDay();
        List<Expense> expenses = repo.findAllByUserAndExpenseTimestampBetween(user, startDate, LocalDateTime.now());
        BigDecimal spent = BigDecimal.ZERO;
        for (var e : expenses) spent = spent.add(e.getAmount());
        BudgetStatusDTO dto = new BudgetStatusDTO();
        dto.setBudget(budget);
        dto.setRemaining(budget.subtract(spent));
        dto.setSpent(spent);
        dto.setWarning(spent.compareTo(budget.multiply(new BigDecimal("0.8"))) >= 0);
        return dto;
    }

    @Cacheable(value = "annualSummary", key = "#user.userId + '-' + #year")
    public AnnualSummaryDTO annualSummary(User user, int year)
    {
        log.info("[CACHE MISS] annualSummary — hitting DB for userId={} year={}", user.getUserId(), year);
        List<Expense> expenses = repo.findAllByUserAndExpenseTimestampBetween(user,
                LocalDate.of(year, 1, 1).atStartOfDay(), LocalDate.of(year, 12, 31).atTime(LocalTime.MAX));
        BigDecimal totalSpent = BigDecimal.ZERO;
        Map<String, BigDecimal> monthlyBreakdown = new LinkedHashMap<>();
        for (var m : Month.values()) monthlyBreakdown.put(m.name(), BigDecimal.ZERO);
        for (var e : expenses)
        {
            totalSpent = totalSpent.add(e.getAmount());
            String m = e.getExpenseTimestamp().getMonth().name();
            monthlyBreakdown.put(m, monthlyBreakdown.get(m).add(e.getAmount()));
        }
        final BigDecimal fts = totalSpent;
        Map<String, BigDecimal> monthlyPct = new HashMap<>();
        monthlyBreakdown.forEach((m, amt) -> {
            if (fts.compareTo(BigDecimal.ZERO) == 0) return;
            monthlyPct.put(m, amt.divide(fts, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")));
        });
        Expense highest = expenses.stream().max(Comparator.comparing(Expense::getAmount)).orElse(null);
        Expense lowest  = expenses.stream().min(Comparator.comparing(Expense::getAmount)).orElse(null);
        AnnualSummaryDTO dto = new AnnualSummaryDTO();
        dto.setTotalSpent(totalSpent);
        dto.setTransactionCount(expenses.size());
        dto.setMonthlyBreakdown(monthlyBreakdown);
        dto.setHighestExpense(highest != null ? convertToResponse(highest) : null);
        dto.setLowestExpense(lowest   != null ? convertToResponse(lowest)  : null);
        dto.setAverageExpenseValue(expenses.isEmpty() ? BigDecimal.ZERO : totalSpent.divide(BigDecimal.valueOf(expenses.size()), 2, RoundingMode.HALF_UP));
        dto.setMonthlyPercentage(monthlyPct);
        return dto;
    }

    @Cacheable(value = "dashboardSummary", key = "#user.userId + '-' + #year")
    public DashboardSummaryDTO getDashboardSummary(User user, int year)
    {
        log.info("[CACHE MISS] dashboardSummary — building for userId={} year={}", user.getUserId(), year);
        FinancialSummaryDTO financial = financialSummary(user);
        AnnualSummaryDTO    annual    = annualSummary(user, year);
        BudgetStatusDTO     budget    = checkBudgetStatus(user);
        Pageable recentPageable = PageRequest.of(0, 5, Sort.by("expenseTimestamp").descending());
        List<ExpenseResponseDTO> recent = repo.findAllByUser(user, recentPageable).map(this::convertToResponse).getContent();
        return new DashboardSummaryDTO(financial, budget, annual, recent);
    }

    @CacheEvict(value = {"financialSummary", "budgetStatus", "annualSummary", "dashboardSummary"}, key = "#userId")
    public void evictUserCaches(Integer userId)
    {
        log.info("[CACHE EVICT] all summary caches evicted for userId={}", userId);
    }
}
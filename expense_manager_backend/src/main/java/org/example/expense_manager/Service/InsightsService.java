package org.example.expense_manager.Service;

import lombok.RequiredArgsConstructor;
import org.example.expense_manager.DTO.ServiceDTOs.AnomalyDTO;
import org.example.expense_manager.DTO.ServiceDTOs.MerchantDTO;
import org.example.expense_manager.DTO.ServiceDTOs.RecurringExpenseDTO;
import org.example.expense_manager.Entity.Expense;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Repository.ExpenseRepo;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InsightsService
{
    private final ExpenseRepo expenseRepo;


    public List<AnomalyDTO> anomalyDetector(User user, Integer month, Integer year)
    {
        List<Expense> expenses = expenseRepo.findAllByUser(user);

        YearMonth targetMonth = (month == null || year == null)
                ? YearMonth.now()
                : YearMonth.of(year, month);

        Map<String, Map<YearMonth, BigDecimal>> categoryMonthlySpent = new HashMap<>();

        for (var expense : expenses)
        {
            String category = expense.getCategory().getCategoryName();
            categoryMonthlySpent
                    .computeIfAbsent(category, k -> new HashMap<>())
                    .merge(YearMonth.from(expense.getExpenseTimestamp()), expense.getAmount(), BigDecimal::add);
        }

        List<AnomalyDTO> anomalies = new ArrayList<>();

        for (Map.Entry<String, Map<YearMonth, BigDecimal>> entry : categoryMonthlySpent.entrySet())
        {
            String categoryName = entry.getKey();
            Map<YearMonth, BigDecimal> monthlySpend = entry.getValue();

            BigDecimal currentSpend = monthlySpend.get(targetMonth);
            if (currentSpend == null) continue;

            List<BigDecimal> historical = new ArrayList<>();
            for (Map.Entry<YearMonth, BigDecimal> m : monthlySpend.entrySet())
            {
                if (!m.getKey().equals(targetMonth))
                    historical.add(m.getValue());
            }

            if (historical.size() < 2) continue;

            BigDecimal sum = historical.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal mean = sum.divide(BigDecimal.valueOf(historical.size()), 4, RoundingMode.HALF_UP);

            BigDecimal variance = BigDecimal.ZERO;
            for (BigDecimal val : historical)
            {
                BigDecimal diff = val.subtract(mean);
                variance = variance.add(diff.multiply(diff));
            }
            variance = variance.divide(BigDecimal.valueOf(historical.size()), 4, RoundingMode.HALF_UP);
            BigDecimal stdDev = variance.sqrt(new MathContext(10, RoundingMode.HALF_UP));

            BigDecimal threshold = mean.add(stdDev.multiply(new BigDecimal("2")));
            if (currentSpend.compareTo(threshold) <= 0) continue;

            BigDecimal deviationMultiple = currentSpend.subtract(mean)
                    .divide(stdDev, 2, RoundingMode.HALF_UP);

            String severity;
            String opener;
            if (deviationMultiple.compareTo(new BigDecimal("3")) >= 0)
            {
                severity = "Unusual";
                opener = "Unusual spike —";
            } else if (deviationMultiple.compareTo(new BigDecimal("2.5")) >= 0)
            {
                severity = "Very High";
                opener = "Very high —";
            } else
            {
                severity = "High";
                opener = "Heads up —";
            }

            String message = String.format(
                    "%s your %s spending spiked this month — ₹%.0f vs your usual ₹%.0f",
                    opener, categoryName, currentSpend, mean
            );

            anomalies.add(new AnomalyDTO(categoryName, currentSpend, mean, stdDev, deviationMultiple, severity, message));
        }

        return anomalies;
    }

    public List<MerchantDTO> merchantLeaderboard(User user)
    {
        List<Expense> expenses = expenseRepo.findAllByUser(user);
        Map<String, BigDecimal> spentPerMerchant = new HashMap<>();

        for (var expense : expenses)
        {
            if (expense.getKeyword() == null || expense.getKeyword().isBlank()) continue;
            spentPerMerchant.merge(expense.getKeyword(), expense.getAmount(), BigDecimal::add);
        }

        Map<String, BigDecimal> sortedMerchants = spentPerMerchant.entrySet()
                .stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));

        return getMerchantDTOS(sortedMerchants);
    }

    private List<MerchantDTO> getMerchantDTOS(Map<String, BigDecimal> sortedMerchants)
    {
        List<MerchantDTO> merchants = new ArrayList<>();
        int rank = 1;
        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<String, BigDecimal> entry : sortedMerchants.entrySet())
        {
            BigDecimal amount = entry.getValue();
            total = total.add(amount);
        }

        for (Map.Entry<String, BigDecimal> entry : sortedMerchants.entrySet())
        {
            String merchant = entry.getKey();
            BigDecimal amount = entry.getValue();
            MerchantDTO merch = new MerchantDTO();
            merch.setKeyword(merchant);
            merch.setRank(rank);
            merch.setTotalSpent(amount);
            BigDecimal percent = amount.divide(total, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
            merch.setPercentage(percent);
            rank++;
            merchants.add(merch);
        }
        return merchants;
    }

    public List<RecurringExpenseDTO> subscriptionTracker(User user)
    {
        List<Expense> expenses = expenseRepo.findAllByUser(user);

        Map<String, List<Expense>> merchantWiseExpenses = new HashMap<>();

        List<RecurringExpenseDTO> recurringExpenses = new ArrayList<>();

        for (var expense : expenses)
        {

            if (expense.getKeyword() == null || expense.getKeyword().isBlank()) continue;

            merchantWiseExpenses.computeIfAbsent(expense.getKeyword(), k -> new ArrayList<>()).add(expense);

        }

        for (Map.Entry<String, List<Expense>> entry : merchantWiseExpenses.entrySet())
        {
            List<Expense> spends = entry.getValue();
            if (spends.size() < 2)
            {
                continue;
            }

            spends.sort(Comparator.comparing(Expense::getExpenseTimestamp));
            long averageGap = 0;

            for (int i = 0; i < spends.size() - 1; i++)
            {
                long gap = ChronoUnit.DAYS.between(
                        spends.get(i).getExpenseTimestamp().toLocalDate(),
                        spends.get(i + 1).getExpenseTimestamp().toLocalDate());
                averageGap += gap;

            }

            averageGap /= (spends.size() - 1);

            if (averageGap >= 25 && averageGap <= 35)
            {
                RecurringExpenseDTO recurringExpense = new RecurringExpenseDTO();
                BigDecimal averageAmount = BigDecimal.ZERO;
                for (Expense spend : spends)
                {
                    averageAmount = averageAmount.add(spend.getAmount());
                }
                averageAmount = averageAmount.divide(new BigDecimal(spends.size()), 4, RoundingMode.HALF_UP);
                recurringExpense.setKeyword(entry.getKey());
                recurringExpense.setAverageAmount(averageAmount);
                recurringExpense.setAverageGap(averageGap);
                recurringExpense.setLastChargedDate(spends.getLast().getExpenseTimestamp().toLocalDate());
                recurringExpense.setNextExpectedChargeDate(spends.getLast().getExpenseTimestamp().toLocalDate().plusDays(averageGap));
                recurringExpense.setAnnualCost(averageAmount.divide(new BigDecimal(averageGap), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal(Year.of(LocalDateTime.now().getYear()).length())));

                recurringExpenses.add(recurringExpense);
            }
        }

        return recurringExpenses;
    }
}


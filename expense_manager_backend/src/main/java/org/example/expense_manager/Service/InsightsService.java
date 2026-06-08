package org.example.expense_manager.Service;

import lombok.RequiredArgsConstructor;
import org.example.expense_manager.DTO.ServiceDTOs.*;
import org.example.expense_manager.Entity.Expense;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Repository.ExpenseRepo;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.*;
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

    public List<WeeklyDNADTO> weeklyDNA(User user, Integer months)
    {
        LocalDateTime start = (months != null) ? LocalDateTime.now().minusMonths(months) : LocalDateTime.MIN;
        LocalDateTime end = LocalDateTime.now();
        List<Expense> expenses = expenseRepo.findAllByUserAndExpenseTimestampBetween(user, start, end);

        Map<DayOfWeek, List<Expense>> dayWiseData = new HashMap<>();

        List<WeeklyDNADTO> result = new ArrayList<>();

        for (var expense : expenses)
        {
            dayWiseData.computeIfAbsent(expense.getExpenseTimestamp().getDayOfWeek(), k -> new ArrayList<>()).add(expense);
        }

        Map<DayOfWeek, Set<LocalDate>> distinctDates = new HashMap<>();

        for (Map.Entry<DayOfWeek, List<Expense>> entry : dayWiseData.entrySet())
        {

            List<Expense> dayWiseExpenses = entry.getValue();

            WeeklyDNADTO dto = new WeeklyDNADTO();

            BigDecimal totalSpent = BigDecimal.ZERO;
            BigDecimal averageSpent;
            int transactionCount = dayWiseExpenses.size();

            for (var expense : dayWiseExpenses)
            {
                totalSpent = totalSpent.add(expense.getAmount());
                distinctDates.computeIfAbsent(
                        entry.getKey(), k -> new HashSet<>()).add(expense.getExpenseTimestamp().toLocalDate());

            }

            int numOfDays = distinctDates.getOrDefault(entry.getKey(), new HashSet<>()).size();

            averageSpent = totalSpent.divide(new BigDecimal(numOfDays), 4, RoundingMode.HALF_UP);

            dto.setDay(entry.getKey());
            dto.setAverageSpend(averageSpent);
            dto.setTotalSpend(totalSpent);
            dto.setTransactionCount(transactionCount);

            result.add(dto);

        }
        result.sort(Comparator.comparing(dto -> dto.getDay().getValue()));
        return result;
    }

    public BurnRateDTO dailyBurnRate(User user)
    {

        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = YearMonth.now().atDay(1).atStartOfDay();

        List<Expense> expenses = expenseRepo.findAllByUserAndExpenseTimestampBetween(user, start, end);

        Map<LocalDate, BigDecimal> track = new HashMap<>();

        for (var expense : expenses)
        {
            track.merge(expense.getExpenseTimestamp().toLocalDate(), expense.getAmount(), BigDecimal::add);
        }

        BigDecimal alpha = new BigDecimal("0.3");
        BigDecimal prevEwa = BigDecimal.ZERO;
        BigDecimal ewa = BigDecimal.ZERO;
        BigDecimal totalSpentThisMonth = BigDecimal.ZERO;

        List<LocalDate> sortedDays = new ArrayList<>(track.keySet());
        Collections.sort(sortedDays);

        for (LocalDate date : sortedDays)
        {
            BigDecimal daySpend = track.get(date);
            ewa = alpha.multiply(daySpend).add(BigDecimal.ONE.subtract(alpha).multiply(prevEwa));
            prevEwa = ewa;
            totalSpentThisMonth = totalSpentThisMonth.add(daySpend);
        }

        BurnRateDTO dto = new BurnRateDTO();
        BigDecimal dailyBurnRate = ewa;
        BigDecimal budgetRemaining = user.getMonthlyBudget().subtract(totalSpentThisMonth);
        BigDecimal projectedMonthEndSpend = totalSpentThisMonth.add(dailyBurnRate.multiply(new BigDecimal(YearMonth.now().lengthOfMonth() - LocalDate.now().getDayOfMonth())));

        int daysUntilBudgetExhausted;
        if (budgetRemaining.compareTo(BigDecimal.ZERO) <= 0 || dailyBurnRate.compareTo(BigDecimal.ZERO) == 0)
        {
            daysUntilBudgetExhausted = 0;
        } else
        {
            daysUntilBudgetExhausted = budgetRemaining.divide(dailyBurnRate, 0, RoundingMode.FLOOR).intValue();
        }

        BigDecimal projectedSurplus = user.getMonthlyBudget().subtract(projectedMonthEndSpend);

        String status;

        if (budgetRemaining.compareTo(BigDecimal.ZERO) < 0)
        {
            status = "EXCEEDED";
        } else if (projectedMonthEndSpend.compareTo(user.getMonthlyBudget()) > 0)
        {
            status = "WARNING";
        } else
        {
            status = "ON_TRACK";
        }

        dto.setDailyBurnRate(dailyBurnRate);
        dto.setStatus(status);
        dto.setBudgetRemaining(budgetRemaining);
        dto.setProjectedSurplus(projectedSurplus);
        dto.setProjectedMonthEndSpend(projectedMonthEndSpend);
        dto.setDaysUntilBudgetExhausted(daysUntilBudgetExhausted);

        return dto;
    }

    public List<MonthlyDeltaDTO> monthlyDelta(User user, Integer month1, Integer year1, Integer month2, Integer year2)
    {
        YearMonth target = YearMonth.now();
        YearMonth previous = target.minusMonths(1);

        if (month1 != null && month2 != null && year1 != null && year2 != null)
        {
            target = YearMonth.of(year1, month1);
            previous = YearMonth.of(year2, month2);
        } else if (month1 != null && year1 != null && month2 == null && year2 == null)
        {
            target = YearMonth.of(year1, month1);
        } else if (month1 == null && year1 == null && month2 != null && year2 != null)
        {
            previous = YearMonth.of(year2, month2);
        }

        List<Expense> targetMonthExpenses = expenseRepo.findAllByUserAndExpenseTimestampBetween(user,
                target.atDay(1).atStartOfDay(), target.atEndOfMonth().atTime(LocalTime.MAX));

        List<Expense> prevMonthExpenses = expenseRepo.findAllByUserAndExpenseTimestampBetween(user,
                previous.atDay(1).atStartOfDay(), previous.atEndOfMonth().atTime(LocalTime.MAX));

        Map<String, BigDecimal> targetMonthSpend = new HashMap<>();
        Map<String, BigDecimal> previousMonthSpend = new HashMap<>();

        for (var expense : targetMonthExpenses)
        {
            targetMonthSpend.merge(expense.getCategory().getCategoryName(), expense.getAmount(), BigDecimal::add);
        }

        for (var expense : prevMonthExpenses)
        {
            previousMonthSpend.merge(expense.getCategory().getCategoryName(), expense.getAmount(), BigDecimal::add);
        }

        Set<String> allCategories = new HashSet<>();
        allCategories.addAll(targetMonthSpend.keySet());
        allCategories.addAll(previousMonthSpend.keySet());

        List<MonthlyDeltaDTO> results = new ArrayList<>();

        for (var category : allCategories)
        {
            BigDecimal targetAmount = targetMonthSpend.getOrDefault(category, BigDecimal.ZERO);
            BigDecimal previousAmount = previousMonthSpend.getOrDefault(category, BigDecimal.ZERO);

            MonthlyDeltaDTO dto = getMonthlyDeltaDTO(category, targetAmount, previousAmount);
            results.add(dto);
        }

        return results;

    }

    private static @NonNull MonthlyDeltaDTO getMonthlyDeltaDTO(String category, BigDecimal targetAmount, BigDecimal previousAmount)
    {
        MonthlyDeltaDTO dto = new MonthlyDeltaDTO();
        BigDecimal delta = ((targetAmount.subtract(previousAmount)).divide(previousAmount, 4, RoundingMode.HALF_UP)).multiply(new BigDecimal("100"));
        String trend;
        if (previousAmount.compareTo(BigDecimal.ZERO) == 0)
        {
            trend = "NEW";
        } else if (targetAmount.compareTo(BigDecimal.ZERO) == 0)
        {
            trend = "GONE";
        } else if (targetAmount.compareTo(previousAmount) > 0)
        {
            trend = "UP";
        } else if (previousAmount.compareTo(targetAmount) > 0)
        {
            trend = "DOWN";
        } else
        {
            trend = "CONSISTENT";
        }

        dto.setCategory(category);
        dto.setDeltaPercentage(delta);
        dto.setTrend(trend);
        dto.setLastMonthSpend(previousAmount);
        dto.setCurrentMonthSpend(targetAmount);
        return dto;
    }


}


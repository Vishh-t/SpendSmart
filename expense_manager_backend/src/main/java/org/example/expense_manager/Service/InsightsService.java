package org.example.expense_manager.Service;

import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.example.expense_manager.DTO.ServiceDTOs.AnomalyDTO;
import org.example.expense_manager.Entity.Expense;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Repository.ExpenseRepo;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InsightsService
{
    private final ExpenseRepo repo;


    public List<AnomalyDTO> anomalyDetector(User user, Integer month, Integer year)
    {
        List<Expense> expenses = repo.findAllByUser(user);

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
                opener   = " Unusual spike —";
            }
            else if (deviationMultiple.compareTo(new BigDecimal("2.5")) >= 0)
            {
                severity = "Very High";
                opener   = " Very high —";
            }
            else
            {
                severity = "High";
                opener   = " Heads up —";
            }

            String message = String.format(
                    "%s your %s spending spiked this month — ₹%.0f vs your usual ₹%.0f",
                    opener, categoryName, currentSpend, mean
            );

            anomalies.add(new AnomalyDTO(categoryName, currentSpend, mean, stdDev, deviationMultiple, severity, message));
        }

        return anomalies;
    }
}

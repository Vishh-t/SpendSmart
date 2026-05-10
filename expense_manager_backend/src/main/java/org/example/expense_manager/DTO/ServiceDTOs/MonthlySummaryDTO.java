package org.example.expense_manager.DTO.ServiceDTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.expense_manager.Entity.Expense;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MonthlySummaryDTO
{
    private int month;
    private int year;
    private List<Expense> expenses;
    private BigDecimal totalSpent;
    private int transactionCount;
    private Map<String, BigDecimal> categoryBreakdown;
    private BigDecimal budget;
    private BigDecimal remaining;
    private Expense highestExpense;
    private Expense lowestExpense;
    private BigDecimal averageExpenseValue;
    private Map<String, BigDecimal> categoryPercentage;
}

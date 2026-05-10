package org.example.expense_manager.DTO.ServiceDTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.expense_manager.Entity.Expense;

import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinancialSummaryDTO
{
    private Expense highestExpense;
    private Expense lowestExpense;
    private BigDecimal averageExpenseValue;
    private BigDecimal totalSpent;
    private int transactionCount;
    private Map<String, BigDecimal> categoryBreakdown;
    private Map<String, BigDecimal> categoryPercentage;

}

package org.example.expense_manager.DTO.ServiceDTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private List<ExpenseResponseDTO> expenses;
    private BigDecimal totalSpent;
    private int transactionCount;
    private Map<String, BigDecimal> categoryBreakdown;
    private BigDecimal budget;
    private BigDecimal remaining;
    private ExpenseResponseDTO highestExpense;
    private ExpenseResponseDTO lowestExpense;
    private BigDecimal averageExpenseValue;
    private Map<String, BigDecimal> categoryPercentage;
}

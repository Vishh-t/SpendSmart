package org.example.expense_manager.DTO.ServiceDTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnualSummaryDTO
{
     private int transactionCount;
     private Map<String, BigDecimal> monthlyBreakdown;
     private BigDecimal totalSpent;
     private ExpenseResponseDTO highestExpense;
     private ExpenseResponseDTO lowestExpense;
     private BigDecimal averageExpenseValue;
     private Map<String, BigDecimal> monthlyPercentage;

}

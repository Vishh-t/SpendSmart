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
public class AnnualSummaryDTO
{
     private int transactionCount;
     private Map<String, BigDecimal> monthlyBreakdown;
     private BigDecimal totalSpent;
     private Expense highestExpense;
     private Expense lowestExpense;
     private BigDecimal averageExpenseValue;
     private Map<String, BigDecimal> monthlyPercentage;

}

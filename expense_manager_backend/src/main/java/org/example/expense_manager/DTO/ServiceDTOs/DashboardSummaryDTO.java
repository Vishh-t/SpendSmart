package org.example.expense_manager.DTO.ServiceDTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDTO
{
    private FinancialSummaryDTO financialSummary;
    private BudgetStatusDTO budgetStatus;
    private AnnualSummaryDTO annualSummary;
    private List<ExpenseResponseDTO> recentExpenses;
}

package org.example.expense_manager.DTO.ServiceDTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BurnRateDTO
{
    BigDecimal dailyBurnRate;

    BigDecimal projectedMonthEndSpend;

    int daysUntilBudgetExhausted;

    BigDecimal budgetRemaining;

    BigDecimal projectedSurplus;

    String status;

}

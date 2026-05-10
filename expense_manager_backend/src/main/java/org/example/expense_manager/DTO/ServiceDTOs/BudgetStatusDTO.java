package org.example.expense_manager.DTO.ServiceDTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BudgetStatusDTO
{
    private BigDecimal budget;
    private BigDecimal spent;
    private BigDecimal remaining;
    private boolean warning; // will be set true if spent more than 80% of the monthly budget
}

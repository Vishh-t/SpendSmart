package org.example.expense_manager.DTO.ServiceDTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CategoryBudgetStatusDTO
{
    String categoryName;

    BigDecimal categoryBudget;

    BigDecimal remaining;

    BigDecimal spentThisMonth;

    BigDecimal percentage;

    String status;
}

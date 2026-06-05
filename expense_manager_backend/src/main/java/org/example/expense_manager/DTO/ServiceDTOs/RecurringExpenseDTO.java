package org.example.expense_manager.DTO.ServiceDTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecurringExpenseDTO
{
    String keyword;

    LocalDate lastChargedDate;

    LocalDate nextExpectedChargeDate;

    BigDecimal averageAmount;

    long averageGap;

    BigDecimal annualCost;

}

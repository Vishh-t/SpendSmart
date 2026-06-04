package org.example.expense_manager.DTO.ServiceDTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyDTO
{
    String categoryName;

    BigDecimal currentMonthSpend;

    BigDecimal historicalMean;

    BigDecimal historicalStdDeviation;

    BigDecimal deviationMultiple;

    String message;

    String severity;

}

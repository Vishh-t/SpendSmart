package org.example.expense_manager.DTO.ServiceDTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MonthlyDeltaDTO
{
    String category ;

    BigDecimal currentMonthSpend;

    BigDecimal lastMonthSpend;

    BigDecimal deltaPercentage;

    String trend;

}

package org.example.expense_manager.DTO.ServiceDTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.DayOfWeek;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyDNADTO
{
    DayOfWeek day;

    BigDecimal averageSpend;

    BigDecimal TotalSpend;

    int transactionCount;
}

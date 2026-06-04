package org.example.expense_manager.DTO.ServiceDTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseResponseDTO
{

    Integer expenseId;

    BigDecimal amount;

    String description;

    LocalDateTime expenseTimestamp;

    CategorySummaryDTO category;

}

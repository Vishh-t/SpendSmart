package org.example.expense_manager.DTO.ControllerDTOs;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AddExpenseDTO
{
    private LocalDate expenseDate;

    @NotNull
    @Min(1)
    private BigDecimal amount;

    private String description;
}

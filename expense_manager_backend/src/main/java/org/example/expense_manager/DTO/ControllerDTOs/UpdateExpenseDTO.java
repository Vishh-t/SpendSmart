package org.example.expense_manager.DTO.ControllerDTOs;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.example.expense_manager.Entity.Category;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@RequiredArgsConstructor
public class UpdateExpenseDTO
{
    private LocalDate expenseDate;

    @Min(1)
    private BigDecimal amount;

    private String description;


    private Integer categoryId;
}

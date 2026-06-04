package org.example.expense_manager.DTO.ControllerDTOs;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class BulkExpenseItemDTO
{
    @NotNull
    @Min(1)
    private BigDecimal amount;

    private String description;

    @NotNull
    private Integer categoryId;

    private LocalDateTime dateTime;

    private String keyword;


}

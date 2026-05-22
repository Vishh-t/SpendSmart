package org.example.expense_manager.DTO.ServiceDTOs;


import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ParsedTransactionDTO
{


    private BigDecimal amount;

    private LocalDate date;

    private String description;


    private String keyword;


    private Integer categoryId;

    private String categoryName;


    private Double confidenceScore;

    private boolean isDuplicate;


}

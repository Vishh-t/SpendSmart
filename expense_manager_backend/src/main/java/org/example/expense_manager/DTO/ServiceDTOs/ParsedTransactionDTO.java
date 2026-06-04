package org.example.expense_manager.DTO.ServiceDTOs;


import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ParsedTransactionDTO
{


    private BigDecimal amount;

    private LocalDateTime dateTime;

    private String description;


    private String keyword;


    private Integer categoryId;

    private String categoryName;


    private Double confidenceScore;

    private boolean isDuplicate;


}

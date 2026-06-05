package org.example.expense_manager.DTO.ServiceDTOs;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@RequiredArgsConstructor
public class MerchantDTO
{
    String keyword;

    BigDecimal totalSpent;

    Integer rank;

    BigDecimal percentage;

}

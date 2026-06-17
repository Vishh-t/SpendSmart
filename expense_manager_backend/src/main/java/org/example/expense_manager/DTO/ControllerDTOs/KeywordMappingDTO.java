package org.example.expense_manager.DTO.ControllerDTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class KeywordMappingDTO
{
    private String keyword;
    private Integer categoryId;
}

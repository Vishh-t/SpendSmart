package org.example.expense_manager.DTO.ServiceDTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportJobStatusDTO
{
    private String status; // PROCESSING, DONE, FAILED
    private List<ParsedTransactionDTO> result;
    private String error;
}

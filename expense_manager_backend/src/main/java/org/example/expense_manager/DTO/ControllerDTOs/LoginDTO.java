package org.example.expense_manager.DTO.ControllerDTOs;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

@Data
public class LoginDTO
{
    @NotBlank
    @Size(min = 8, max = 25)
    private String username;

    @NotBlank
    private String password;

}

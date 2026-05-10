package org.example.expense_manager.DTO.ControllerDTOs;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class SignUpDTO
{
    @NotBlank
    @Size(min = 8, max = 25)
    private String username;

    @NotBlank
    private String name;

    @NotBlank
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @NotBlank
    @Email
    private String email;

    private BigDecimal monthlyBudget;

}

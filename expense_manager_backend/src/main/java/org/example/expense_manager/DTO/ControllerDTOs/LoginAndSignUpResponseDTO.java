package org.example.expense_manager.DTO.ControllerDTOs;

import lombok.Data;

@Data
public class LoginAndSignUpResponseDTO
{
    private String token;
    private Integer userId;
    private String username;

}

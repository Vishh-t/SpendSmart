package org.example.expense_manager.Service;

import org.example.expense_manager.DTO.ControllerDTOs.SignUpDTO;
import org.example.expense_manager.Exceptions.AlreadyExistsException;
import org.example.expense_manager.Repository.UserRepo;
import org.example.expense_manager.Security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest
{
    @Mock
    private UserRepo repo;

    @Mock
    private PasswordEncoder encoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private UserService userService;

    @Test
    void signup_throwsWhenUserAlreadyExists()
    {

        SignUpDTO dto = new SignUpDTO();
        dto.setUsername("vishesh0626");
        dto.setEmail("test@test.com");
        dto.setPassword("password123");

        when(repo.existsByUsername("vishesh0626")).thenReturn(true);

        // ACT + ASSERT
        assertThrows(AlreadyExistsException.class, () -> userService.signUp(dto));

    }


}

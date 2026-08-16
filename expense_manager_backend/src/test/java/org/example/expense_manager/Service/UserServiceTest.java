package org.example.expense_manager.Service;

import org.example.expense_manager.DTO.ControllerDTOs.LoginAndSignUpResponseDTO;
import org.example.expense_manager.DTO.ControllerDTOs.SignUpDTO;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Exceptions.AlreadyExistsException;
import org.example.expense_manager.Exceptions.InvalidCredentialsException;
import org.example.expense_manager.Repository.UserRepo;
import org.example.expense_manager.Security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepo userRepo;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepo, passwordEncoder, jwtUtil);
    }

    // ============================================================
    // SIGN UP TESTS
    // ============================================================

    @Test
    void signUp_whenUsernameExists_throwsAlreadyExistsException() {
        SignUpDTO dto = new SignUpDTO();
        dto.setUsername("existinguser");
        dto.setEmail("new@email.com");
        dto.setPassword("password123");
        dto.setName("Test User");

        when(userRepo.existsByUsername("existinguser")).thenReturn(true);

        assertThatThrownBy(() -> userService.signUp(dto))
            .isInstanceOf(AlreadyExistsException.class)
            .hasMessageContaining("Username already exists");

        verify(userRepo).existsByUsername("existinguser");
        verify(userRepo, never()).save(any());
    }

    @Test
    void signUp_whenEmailExists_throwsAlreadyExistsException() {
        SignUpDTO dto = new SignUpDTO();
        dto.setUsername("newuser");
        dto.setEmail("existing@email.com");
        dto.setPassword("password123");
        dto.setName("Test User");

        when(userRepo.existsByUsername("newuser")).thenReturn(false);
        when(userRepo.existsByEmail("existing@email.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.signUp(dto))
            .isInstanceOf(AlreadyExistsException.class)
            .hasMessageContaining("Email already exists");

        verify(userRepo).existsByUsername("newuser");
        verify(userRepo).existsByEmail("existing@email.com");
        verify(userRepo, never()).save(any());
    }

    @Test
    void signUp_whenValid_createsUserAndReturnsResponse() {
        SignUpDTO dto = new SignUpDTO();
        dto.setUsername("newuser");
        dto.setEmail("test@email.com");
        dto.setPassword("password123");
        dto.setName("Test User");
        dto.setMonthlyBudget(BigDecimal.valueOf(10000));

        when(userRepo.existsByUsername("newuser")).thenReturn(false);
        when(userRepo.existsByEmail("test@email.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepo.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setUserId(1);
            return u;
        });
        when(jwtUtil.generateToken("newuser")).thenReturn("jwt-token-123");

        LoginAndSignUpResponseDTO response = userService.signUp(dto);

        assertThat(response.getUserId()).isEqualTo(1);
        assertThat(response.getUsername()).isEqualTo("newuser");
        assertThat(response.getToken()).isEqualTo("jwt-token-123");

        verify(userRepo).save(argThat(u -> 
            u.getUsername().equals("newuser") &&
            u.getEmail().equals("test@email.com") &&
            u.getName().equals("Test User") &&
            u.getPassword().equals("encodedPassword") &&
            u.getMonthlyBudget().compareTo(BigDecimal.valueOf(10000)) == 0
        ));
        verify(jwtUtil).generateToken("newuser");
    }

    @Test
    void signUp_whenMonthlyBudgetNull_defaultsTo5000() {
        SignUpDTO dto = new SignUpDTO();
        dto.setUsername("newuser");
        dto.setEmail("test@email.com");
        dto.setPassword("password123");
        dto.setName("Test User");
        dto.setMonthlyBudget(null);

        when(userRepo.existsByUsername("newuser")).thenReturn(false);
        when(userRepo.existsByEmail("test@email.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepo.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setUserId(1);
            return u;
        });
        when(jwtUtil.generateToken("newuser")).thenReturn("jwt-token-123");

        userService.signUp(dto);

        verify(userRepo).save(argThat(u -> u.getMonthlyBudget().compareTo(BigDecimal.valueOf(5000)) == 0));
    }

    // ============================================================
    // LOGIN TESTS
    // ============================================================

    @Test
    void login_whenUserNotFound_throwsInvalidCredentialsException() {
        when(userRepo.findByUsername("nonexistent")).thenReturn(null);

        assertThatThrownBy(() -> userService.login("nonexistent", "password123"))
            .isInstanceOf(InvalidCredentialsException.class)
            .hasMessageContaining("Invalid username or password");
    }

    @Test
    void login_whenPasswordNull_throwsInvalidCredentialsException() {
        User user = new User();
        user.setUsername("testuser");
        user.setPassword(null);

        when(userRepo.findByUsername("testuser")).thenReturn(user);

        assertThatThrownBy(() -> userService.login("testuser", "password123"))
            .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_whenPasswordMismatch_throwsInvalidCredentialsException() {
        User user = new User();
        user.setUsername("testuser");
        user.setPassword("encodedPassword");

        when(userRepo.findByUsername("testuser")).thenReturn(user);
        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        assertThatThrownBy(() -> userService.login("testuser", "wrongPassword"))
            .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_whenValid_returnsResponse() {
        User user = new User();
        user.setUserId(1);
        user.setUsername("testuser");
        user.setPassword("encodedPassword");

        when(userRepo.findByUsername("testuser")).thenReturn(user);
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(jwtUtil.generateToken("testuser")).thenReturn("jwt-token-123");

        LoginAndSignUpResponseDTO response = userService.login("testuser", "password123");

        assertThat(response.getUserId()).isEqualTo(1);
        assertThat(response.getUsername()).isEqualTo("testuser");
        assertThat(response.getToken()).isEqualTo("jwt-token-123");
        verify(jwtUtil).generateToken("testuser");
    }

    // ============================================================
    // UPDATE MONTHLY BUDGET TESTS
    // ============================================================

    @Test
    void updateMonthlyBudget_updatesAndSaves() {
        User user = new User();
        user.setUserId(1);
        user.setMonthlyBudget(BigDecimal.valueOf(5000));

        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.updateMonthlyBudget(BigDecimal.valueOf(10000), user);

        assertThat(result.getMonthlyBudget()).isEqualByComparingTo("10000");
        verify(userRepo).save(argThat(u -> u.getMonthlyBudget().compareTo(BigDecimal.valueOf(10000)) == 0));
    }

    // ============================================================
    // GET USER INFO TESTS
    // ============================================================

    @Test
    void getUserInfo_returnsSameUser() {
        User user = new User();
        user.setUserId(1);
        user.setUsername("testuser");

        User result = userService.getUserInfo(user);

        assertThat(result).isSameAs(user);
    }

    // ============================================================
    // DELETE USER TESTS
    // ============================================================

    @Test
    void deleteUser_deletesAndReturnsUser() {
        User user = new User();
        user.setUserId(1);

        userService.deleteUser(user);

        verify(userRepo).delete(user);
    }
}
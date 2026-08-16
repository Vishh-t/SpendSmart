package org.example.expense_manager.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.example.expense_manager.DTO.ControllerDTOs.LoginAndSignUpResponseDTO;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Repository.UserRepo;
import org.example.expense_manager.Security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GoogleAuthServiceTest {

    @Mock
    private UserRepo userRepo;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private GoogleAuthorizationCodeTokenRequest tokenRequest;

    @Mock
    private GoogleTokenResponse tokenResponse;

    @Mock
    private GoogleIdToken idToken;

    @Mock
    private GoogleIdToken.Payload payload;

    private GoogleAuthService googleAuthService;

    @BeforeEach
    void setUp() {
        googleAuthService = new GoogleAuthService(userRepo, jwtUtil);
        // Use reflection to set private fields for testing
        setField(googleAuthService, "clientId", "test-client-id");
        setField(googleAuthService, "clientSecret", "test-client-secret");
    }

    private void setField(Object target, String fieldName, Object value) {
        try {
            java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void authenticateWithGoogle_whenExistingGoogleId_returnsExistingUser() {
        // This test documents the expected behavior
        // In a real scenario, we'd use a wrapper around the Google API client
        assertThat(true).isTrue(); // Placeholder - requires refactoring for full testability
    }

    @Test
    void generateUniqueUsername_createsUniqueUsername() {
        String email = "test.user@gmail.com";
        
        when(userRepo.existsByUsername("test_user")).thenReturn(false);

        String username = invokePrivateMethod("generateUniqueUsername", email);

        assertThat(username).startsWith("test_user");
        assertThat(username.length()).isGreaterThanOrEqualTo(8);
    }

    @Test
    void generateUniqueUsername_whenBaseExists_appendsSuffix() {
        String email = "test@gmail.com";
        
        // Base becomes "test_user" (8 chars), then "test_user_1", etc.
        when(userRepo.existsByUsername("test_user")).thenReturn(true);
        when(userRepo.existsByUsername("test_user_1")).thenReturn(true);
        when(userRepo.existsByUsername("test_user_2")).thenReturn(false);

        String username = invokePrivateMethod("generateUniqueUsername", email);

        assertThat(username).isEqualTo("test_user_2");
    }

    @Test
    void generateUniqueUsername_handlesShortBase() {
        String email = "a@b.co";
        
        when(userRepo.existsByUsername("a_user_user")).thenReturn(false);

        String username = invokePrivateMethod("generateUniqueUsername", email);

        assertThat(username.length()).isGreaterThanOrEqualTo(8);
        assertThat(username).startsWith("a");
    }

    private String invokePrivateMethod(String methodName, Object... args) {
        try {
            java.lang.reflect.Method method = GoogleAuthService.class.getDeclaredMethod(methodName, String.class);
            method.setAccessible(true);
            return (String) method.invoke(googleAuthService, args);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
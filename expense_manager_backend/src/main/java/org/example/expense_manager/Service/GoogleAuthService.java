package org.example.expense_manager.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import org.example.expense_manager.DTO.ControllerDTOs.LoginAndSignUpResponseDTO;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Repository.UserRepo;
import org.example.expense_manager.Security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAuthService.class);

    private final UserRepo userRepo;
    private final JwtUtil jwtUtil;

    @Value("${google.client.id}")
    private String clientId;

    @Value("${google.client.secret}")
    private String clientSecret;

    public LoginAndSignUpResponseDTO authenticateWithGoogle(String authCode, String redirectUri) throws IOException {


        GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                clientId,
                clientSecret,
                authCode,
                redirectUri
        ).execute();


        GoogleIdToken idToken = tokenResponse.parseIdToken();
        GoogleIdToken.Payload payload = idToken.getPayload();

        String googleId = payload.getSubject();
        String email    = payload.getEmail();
        String name     = (String) payload.get("name");


        Optional<User> existingByGoogleId = userRepo.findByGoogleId(googleId);

        User user;
        if (existingByGoogleId.isPresent()) {

            user = existingByGoogleId.get();
            log.info("Google login — existing linked account: username={}", user.getUsername());
        } else {

            Optional<User> existingByEmail = userRepo.findByEmail(email);
            if (existingByEmail.isPresent()) {

                user = existingByEmail.get();
                user.setGoogleId(googleId);
                user = userRepo.save(user);
                log.info("Google account linked to existing manual account: username={}, email={}", user.getUsername(), email);
            } else {

                user = new User();
                user.setGoogleId(googleId);
                user.setEmail(email);
                user.setName(name != null ? name : email);
                user.setUsername(generateUniqueUsername(email));
                user.setPassword(null);
                user.setMonthlyBudget(BigDecimal.valueOf(5000));
                user = userRepo.save(user);
                log.info("New user created via Google sign-in: username={}, email={}", user.getUsername(), email);
            }
        }


        String jwt = jwtUtil.generateToken(user.getUsername());

        LoginAndSignUpResponseDTO response = new LoginAndSignUpResponseDTO();
        response.setUserId(user.getUserId());
        response.setUsername(user.getUsername());
        response.setToken(jwt);
        return response;
    }

    private String generateUniqueUsername(String email) {

        String base = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "_");

        while (base.length() < 8) base = base + "_user";

        String candidate = base;
        int suffix = 1;
        while (userRepo.existsByUsername(candidate)) {
            candidate = base + "_" + suffix++;
        }
        return candidate;
    }
}

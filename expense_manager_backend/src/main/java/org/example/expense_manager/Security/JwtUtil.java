package org.example.expense_manager.Security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil
{
    @Value("${jwt.secret}")
    private String secret;

    private SecretKey getSigningKey()
    {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(String username)
    {
        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24 * 7))
                .signWith(getSigningKey()).compact();

    }

    public String extractUsername(String token)
    {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean isTokenValid(String token)
    {
        try
        {
            extractUsername(token);
            return true;
        } catch (Exception ex)
        {
            return false;
        }
    }
}

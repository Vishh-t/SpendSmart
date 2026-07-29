package org.example.expense_manager.Security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limits login/signup attempts per client IP to prevent brute-force / spam-signup abuse.
 * This is intentionally separate from the import quota system (ImportService) which
 * limits Gemini API usage per user, not per IP — the two guard different things.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter
{
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private Bucket newBucket()
    {
        Bandwidth limit = Bandwidth.classic(MAX_ATTEMPTS, Refill.greedy(MAX_ATTEMPTS, WINDOW));
        return Bucket.builder().addLimit(limit).build();
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException
    {
        String path = request.getRequestURI();
        boolean isGuarded = path.equals("/users/login") || path.equals("/users/signUp");

        if (!isGuarded)
        {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isBlank())
        {
            clientIp = request.getRemoteAddr();
        }
        else
        {
            clientIp = clientIp.split(",")[0].trim(); // first hop is the real client when behind Nginx
        }

        Bucket bucket = buckets.computeIfAbsent(clientIp, ip -> newBucket());

        if (bucket.tryConsume(1))
        {
            filterChain.doFilter(request, response);
        }
        else
        {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many attempts. Please wait a minute and try again.\"}");
        }
    }
}

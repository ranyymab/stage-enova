package com.enovarobotics.pguard.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Limiteur de débit "maison", en mémoire, sans dépendance externe.
 * Protège les routes sensibles (/api/auth/**) contre le brute-force
 * (deviner un mot de passe ou un code OTP) et l'abus d'envoi d'e-mails.
 *
 * Fenêtre glissante simplifiée : par clé (IP + route), on compte les
 * requêtes dans la fenêtre courante ; au-delà de la limite, on renvoie
 * HTTP 429 Too Many Requests jusqu'à la fenêtre suivante.
 *
 * Limite : ceci suffit pour une seule instance de l'application. Pour un
 * déploiement multi-instance derrière un load-balancer, remplacer ce
 * composant par un compteur partagé (Redis) — voir tests/security/README.md.
 */
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private record Bucket(AtomicInteger count, long windowStartMillis) {}

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    // route -> [limite de requêtes, durée de fenêtre en ms]
    private static final Map<String, int[]> LIMITS = Map.of(
            "/api/auth/login", new int[]{10, 60_000},
            "/api/auth/register", new int[]{5, 60_000},
            "/api/auth/verify-email", new int[]{10, 60_000},
            "/api/auth/resend-code", new int[]{3, 60_000},
            "/api/auth/google", new int[]{10, 60_000}
    );

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        int[] limit = LIMITS.get(path);

        if (limit == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientKey = clientIp(request) + "|" + path;
        long now = Instant.now().toEpochMilli();
        int maxRequests = limit[0];
        long windowMs = limit[1];

        Bucket bucket = buckets.compute(clientKey, (key, existing) -> {
            if (existing == null || now - existing.windowStartMillis() > windowMs) {
                return new Bucket(new AtomicInteger(1), now);
            }
            existing.count().incrementAndGet();
            return existing;
        });

        if (bucket.count().get() > maxRequests) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Trop de requêtes, veuillez réessayer plus tard.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

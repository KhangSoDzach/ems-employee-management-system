package com.company.ems.backend.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, SimpleRateLimiter> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (request.getRequestURI().startsWith("/api/v1/auth/login")) {
            String ip = clientIp(request);
            SimpleRateLimiter limiter = buckets.computeIfAbsent(ip,
                    k -> SimpleRateLimiter.create(5, Duration.ofMinutes(1)));
            if (!limiter.tryAcquire()) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"message\":\"Too many requests\"}");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        return com.company.ems.backend.common.utils.IpUtils.getClientIpAddress(request);
    }
}

package com.company.ems.backend.auth.security;

import java.time.Duration;
import java.time.Instant;

public class SimpleRateLimiter {
    private final int maxTokens;
    private final long refillPeriodMillis;
    private int tokens;
    private Instant nextRefill;

    private SimpleRateLimiter(int maxTokens, Duration refillPeriod) {
        this.maxTokens = maxTokens;
        this.refillPeriodMillis = refillPeriod.toMillis();
        this.tokens = maxTokens;
        this.nextRefill = Instant.now().plusMillis(refillPeriodMillis);
    }

    public static SimpleRateLimiter create(int maxTokens, Duration refillPeriod) {
        return new SimpleRateLimiter(maxTokens, refillPeriod);
    }

    public synchronized boolean tryAcquire() {
        refillIfNeeded();
        if (tokens > 0) {
            tokens--;
            return true;
        }
        return false;
    }

    private void refillIfNeeded() {
        Instant now = Instant.now();
        if (now.isAfter(nextRefill)) {
            tokens = maxTokens;
            nextRefill = now.plusMillis(refillPeriodMillis);
        }
    }
}

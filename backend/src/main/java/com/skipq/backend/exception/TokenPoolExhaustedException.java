package com.skipq.backend.exception;

/**
 * Thrown when a college has no free token available for allocation —
 * i.e. all 999 tokens (1-999) currently belong to an active order
 * (PLACED, PREPARING, or READY).
 */
public class TokenPoolExhaustedException extends RuntimeException {

    public TokenPoolExhaustedException(String message) {
        super(message);
    }
}

package com.skipq.backend.exception;

/**
 * Thrown when a resend (or a fresh OTP request that overlaps an existing
 * live OTP) is attempted before the 60-second cooldown has elapsed.
 * Mapped to 429 Too Many Requests in {@link GlobalExceptionHandler}, as
 * distinct from the 400s used for wrong/expired OTPs.
 */
public class OtpCooldownException extends RuntimeException {

    private final long secondsRemaining;

    public OtpCooldownException(long secondsRemaining) {
        super("Please wait " + secondsRemaining + " seconds before requesting another OTP.");
        this.secondsRemaining = secondsRemaining;
    }

    public long getSecondsRemaining() {
        return secondsRemaining;
    }
}
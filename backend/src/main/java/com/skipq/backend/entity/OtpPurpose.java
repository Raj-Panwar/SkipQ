package com.skipq.backend.entity;

/**
 * What an OTP row was issued for. Kept as a plain enum (not a channel-
 * specific type) so a future SMS OTP channel can reuse the same purposes
 * against the same {@link OtpVerification} table without a schema change.
 */
public enum OtpPurpose {
    REGISTER,
    RESET_PASSWORD
}
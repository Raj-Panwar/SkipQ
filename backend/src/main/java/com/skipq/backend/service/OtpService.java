package com.skipq.backend.service;

import com.skipq.backend.entity.College;
import com.skipq.backend.entity.OtpPurpose;
import com.skipq.backend.entity.OtpVerification;
import com.skipq.backend.exception.OtpCooldownException;
import com.skipq.backend.repository.OtpVerificationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Generates, sends, and verifies 6-digit email OTPs for both the
 * registration and password-reset flows.
 *
 * Every OTP row is keyed by (email, college, purpose) via the unique
 * constraint on {@link OtpVerification} — generating or resending an OTP
 * always overwrites the previous row for that key in place, which is what
 * makes "resend instantly invalidates the old code" fall out naturally
 * rather than needing an explicit invalidation step.
 */
@Service
public class OtpService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final OtpVerificationRepository otpVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private final int expiryMinutes;
    private final int maxAttempts;
    private final int resendCooldownSeconds;

    public OtpService(
            OtpVerificationRepository otpVerificationRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            @Value("${otp.expiry-minutes}") int expiryMinutes,
            @Value("${otp.max-attempts}") int maxAttempts,
            @Value("${otp.resend-cooldown-seconds}") int resendCooldownSeconds) {

        this.otpVerificationRepository = otpVerificationRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.expiryMinutes = expiryMinutes;
        this.maxAttempts = maxAttempts;
        this.resendCooldownSeconds = resendCooldownSeconds;
    }

    /**
     * Starts a fresh verification for registration. The password must
     * already be BCrypt-hashed by the caller — this class never sees or
     * stores a plaintext password.
     */
    @Transactional
    public void generateForRegistration(
            String email, College college, String fullName, String phoneNumber, String passwordHash) {
        email = email.trim().toLowerCase();

        OtpVerification otp = otpVerificationRepository
                .findByEmailAndCollegeAndPurpose(email, college, OtpPurpose.REGISTER)
                .orElseGet(OtpVerification::new);

        enforceCooldown(otp);

        otp.setEmail(email);
        otp.setCollege(college);
        otp.setPurpose(OtpPurpose.REGISTER);
        otp.setPendingFullName(fullName);
        otp.setPendingPhoneNumber(phoneNumber);
        otp.setPendingPasswordHash(passwordHash);

        issueAndSend(otp);
    }

    /**
     * Starts a fresh verification for a password reset. No pending fields involved.
     */
    @Transactional
    public void generateForPasswordReset(String email, College college) {
        email = email.trim().toLowerCase();

        OtpVerification otp = otpVerificationRepository
                .findByEmailAndCollegeAndPurpose(email, college, OtpPurpose.RESET_PASSWORD)
                .orElseGet(OtpVerification::new);

        enforceCooldown(otp);

        otp.setEmail(email);
        otp.setCollege(college);
        otp.setPurpose(OtpPurpose.RESET_PASSWORD);

        issueAndSend(otp);
    }

    /**
     * Resends an OTP for an already-started flow, reusing whatever pending
     * registration data (if any) is already on the row — the resend
     * request itself carries no form data.
     *
     * @throws IllegalArgumentException if there's no prior OTP request to resend
     */
    @Transactional
    public void resend(String email, College college, OtpPurpose purpose) {
        email = email.trim().toLowerCase();

        OtpVerification otp = otpVerificationRepository
                .findByEmailAndCollegeAndPurpose(email, college, purpose)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No pending verification found. Please start again."));

        enforceCooldown(otp);

        issueAndSend(otp);
    }

    /**
     * Verifies the OTP and, on success, marks it consumed immediately.
     * Used by registration (the account is created in the same
     * transaction right after this returns) and by the final
     * reset-password step.
     *
     * @return the verified row, so the caller can read pending
     *         registration fields before deleting it
     */
    @Transactional
    public OtpVerification verifyAndConsume(String email, College college, OtpPurpose purpose, String rawOtp) {
        email = email.trim().toLowerCase();
        OtpVerification otp = verify(email, college, purpose, rawOtp);
        otp.setConsumed(true);
        return otpVerificationRepository.save(otp);
    }

    /**
     * Verifies the OTP without consuming it, so a later verifyAndConsume
     * call (e.g. the actual reset-password submission) can still use it.
     * Used for the "Verify OTP" gate screen in the password-reset flow.
     */
    @Transactional
    public void verifyOnly(String email, College college, OtpPurpose purpose, String rawOtp) {
        email = email.trim().toLowerCase();
        verify(email, college, purpose, rawOtp);
    }

    /**
     * Deletes the OTP row once a flow has fully completed (e.g. account created).
     */
    @Transactional
    public void delete(String email, College college, OtpPurpose purpose) {
        email = email.trim().toLowerCase();
        otpVerificationRepository.deleteByEmailAndCollegeAndPurpose(email, college, purpose);
    }

    // ---- internals ----------------------------------------------------

    private OtpVerification verify(String email, College college, OtpPurpose purpose, String rawOtp) {
        OtpVerification otp = otpVerificationRepository
                .findByEmailAndCollegeAndPurpose(email, college, purpose)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No OTP was requested for this email. Please request a new one."));

        if (otp.isConsumed()) {
            throw new IllegalArgumentException("This OTP has already been used. Please request a new one.");
        }

        if (otp.isExpired()) {
            throw new IllegalArgumentException("This OTP has expired. Please request a new one.");
        }

        if (otp.getAttemptCount() >= maxAttempts) {
            otpVerificationRepository.delete(otp);
            throw new IllegalArgumentException(
                    "Too many incorrect attempts. Please request a new OTP.");
        }

        if (!passwordEncoder.matches(rawOtp, otp.getOtpHash())) {
            otp.setAttemptCount(otp.getAttemptCount() + 1);
            int remaining = maxAttempts - otp.getAttemptCount();

            if (remaining <= 0) {
                otpVerificationRepository.delete(otp);
                throw new IllegalArgumentException(
                        "Too many incorrect attempts. Please request a new OTP.");
            }

            otpVerificationRepository.save(otp);
            throw new IllegalArgumentException(
                    "Incorrect OTP. " + remaining + " attempt(s) remaining.");
        }

        return otp;
    }

    private void enforceCooldown(OtpVerification otp) {
        if (otp.getId() == null || otp.getCreatedAt() == null) {
            return;
        }

        long secondsSinceCreated = ChronoUnit.SECONDS.between(otp.getCreatedAt(), LocalDateTime.now());
        long secondsRemaining = resendCooldownSeconds - secondsSinceCreated;

        if (secondsRemaining > 0) {
            throw new OtpCooldownException(secondsRemaining);
        }
    }

    private void issueAndSend(OtpVerification otp) {
        String code = generateSixDigitCode();

        LocalDateTime now = LocalDateTime.now();
        otp.setOtpHash(passwordEncoder.encode(code));

        otp.setCreatedAt(now);
        otp.setExpiresAt(now.plusMinutes(expiryMinutes));
        otp.setAttemptCount(0);
        otp.setConsumed(false);

        otpVerificationRepository.save(otp);

        emailService.sendOtp(otp.getEmail(), code, otp.getPurpose(), expiryMinutes);
    }

    private String generateSixDigitCode() {
        int code = 100000 + SECURE_RANDOM.nextInt(900000);
        return String.valueOf(code);
    }

    public int getExpiryMinutes() {
        return expiryMinutes;
    }

    public int getResendCooldownSeconds() {
        return resendCooldownSeconds;
    }
}
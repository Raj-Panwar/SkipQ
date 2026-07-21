package com.skipq.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * A single OTP verification attempt, scoped to (email, college, purpose).
 *
 * The UNIQUE(email, college_id, purpose) constraint means there is at most
 * one live row per key: generating or resending an OTP overwrites the
 * previous row in place, which is what makes "old OTP invalidated
 * immediately on resend" and per-college isolation both fall out for free
 * — a student with the same email at two different colleges gets two
 * independent rows, and a resend for one never touches the other.
 *
 * For {@link OtpPurpose#REGISTER}, the account is NOT created until the
 * OTP is verified. The submitted registration fields are held here
 * (password already BCrypt-hashed — never plaintext) and only copied into
 * a real {@code Student} row on successful verification. For
 * {@link OtpPurpose#RESET_PASSWORD} these pending fields stay null.
 */
@Entity
@Table(name = "otp_verification", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "email", "college_id", "purpose" })
})
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "college_id", nullable = false)
    private College college;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OtpPurpose purpose;

    @Column(name = "otp_hash", nullable = false)
    private String otpHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;

    @Column(nullable = false)
    private boolean consumed = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // REGISTER-only pending account fields. Null for RESET_PASSWORD rows.
    @Column(name = "pending_full_name")
    private String pendingFullName;

    @Column(name = "pending_phone_number")
    private String pendingPhoneNumber;

    // Already BCrypt-hashed by the time it lands here — never plaintext.
    @Column(name = "pending_password_hash")
    private String pendingPasswordHash;

    public OtpVerification() {
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email == null ? null : email.trim().toLowerCase();
    }

    public College getCollege() {
        return college;
    }

    public void setCollege(College college) {
        this.college = college;
    }

    public OtpPurpose getPurpose() {
        return purpose;
    }

    public void setPurpose(OtpPurpose purpose) {
        this.purpose = purpose;
    }

    public String getOtpHash() {
        return otpHash;
    }

    public void setOtpHash(String otpHash) {
        this.otpHash = otpHash;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public int getAttemptCount() {
        return attemptCount;
    }

    public void setAttemptCount(int attemptCount) {
        this.attemptCount = attemptCount;
    }

    public boolean isConsumed() {
        return consumed;
    }

    public void setConsumed(boolean consumed) {
        this.consumed = consumed;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getPendingFullName() {
        return pendingFullName;
    }

    public void setPendingFullName(String pendingFullName) {
        this.pendingFullName = pendingFullName;
    }

    public String getPendingPhoneNumber() {
        return pendingPhoneNumber;
    }

    public void setPendingPhoneNumber(String pendingPhoneNumber) {
        this.pendingPhoneNumber = pendingPhoneNumber;
    }

    public String getPendingPasswordHash() {
        return pendingPasswordHash;
    }

    public void setPendingPasswordHash(String pendingPasswordHash) {
        this.pendingPasswordHash = pendingPasswordHash;
    }

    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
}
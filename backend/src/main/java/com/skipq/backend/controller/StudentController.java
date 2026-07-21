package com.skipq.backend.controller;

import com.skipq.backend.dto.LoginRequest;
import com.skipq.backend.dto.LoginResponse;
import com.skipq.backend.dto.student.EmailCollegeRequest;
import com.skipq.backend.dto.student.ProfileResponse;
import com.skipq.backend.dto.student.RegisterRequest;
import com.skipq.backend.dto.student.ResetPasswordRequest;
import com.skipq.backend.dto.student.UpdateProfileRequest;
import com.skipq.backend.dto.student.VerifyOtpRequest;
import com.skipq.backend.security.AppUserPrincipal;
import com.skipq.backend.service.OtpService;
import com.skipq.backend.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentService studentService;
    private final OtpService otpService;

    public StudentController(StudentService studentService, OtpService otpService) {
        this.studentService = studentService;
        this.otpService = otpService;
    }

    /**
     * POST /api/students/register
     *
     * Step 1 of registration. Validates the submitted details and emails
     * a 6-digit OTP; the account is NOT created yet — see
     * /register/verify-otp.
     *
     * Request body:
     * {
     * "fullName": "Raj Kumar",
     * "email": "raj@college.edu",
     * "phoneNumber": "9876543210",
     * "password": "secret123",
     * "collegeCode": "ABC"
     * }
     *
     * Responses:
     * 200 OK — { message, expiresInSeconds }
     * 400 Bad Request — validation error, duplicate email/phone, or invalid college code
     * 429 Too Many Requests — an OTP was already sent recently (cooldown)
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request) {

        try {
            studentService.initiateRegistration(request);
            return ResponseEntity.ok(otpSentResponse());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    /**
     * POST /api/students/register/verify-otp
     *
     * Step 2 of registration. Verifies the OTP and, only on success,
     * creates the Student account. Does NOT return a token — the
     * student is redirected to log in separately.
     *
     * Request body:
     * { "email": "raj@college.edu", "collegeCode": "ABC", "otp": "123456" }
     *
     * Responses:
     * 201 Created — { id, fullName, email, phoneNumber, collegeCode }
     * 400 Bad Request — invalid/expired/exhausted OTP, invalid college code, or email/phone taken
     */
    @PostMapping("/register/verify-otp")
    public ResponseEntity<?> verifyRegistrationOtp(
            @Valid @RequestBody VerifyOtpRequest request) {

        try {
            LoginResponse response = studentService.completeRegistration(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    /**
     * POST /api/students/register/resend-otp
     *
     * Resends the OTP for a registration already in progress, reusing
     * the originally submitted details.
     *
     * Request body:
     * { "email": "raj@college.edu", "collegeCode": "ABC" }
     *
     * Responses:
     * 200 OK — { message, expiresInSeconds }
     * 400 Bad Request — no pending registration found
     * 429 Too Many Requests — cooldown not yet elapsed
     */
    @PostMapping("/register/resend-otp")
    public ResponseEntity<?> resendRegistrationOtp(
            @Valid @RequestBody EmailCollegeRequest request) {

        try {
            studentService.resendRegistrationOtp(request);
            return ResponseEntity.ok(otpSentResponse());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    /**
     * POST /api/students/forgot-password
     *
     * Starts a password reset. Always responds with the same generic
     * success message, whether or not an account exists for the given
     * email/college — an OTP is only actually sent when it does, so this
     * endpoint can't be used to enumerate registered emails.
     *
     * Request body:
     * { "email": "raj@college.edu", "collegeCode": "ABC" }
     *
     * Responses:
     * 200 OK — { message }
     * 400 Bad Request — invalid college code
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @Valid @RequestBody EmailCollegeRequest request) {

        try {
            studentService.initiatePasswordReset(request);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", ex.getMessage()));
        }

        return ResponseEntity.ok(Map.of(
                "message", "If an account exists for this email, an OTP has been sent."));
    }

    /**
     * POST /api/students/forgot-password/resend-otp
     *
     * Resends the OTP for a password reset already in progress.
     *
     * Request body:
     * { "email": "raj@college.edu", "collegeCode": "ABC" }
     *
     * Responses:
     * 200 OK — { message, expiresInSeconds }
     * 400 Bad Request — no pending reset found
     * 429 Too Many Requests — cooldown not yet elapsed
     */
    @PostMapping("/forgot-password/resend-otp")
    public ResponseEntity<?> resendPasswordResetOtp(
            @Valid @RequestBody EmailCollegeRequest request) {

        try {
            studentService.resendPasswordResetOtp(request);
            return ResponseEntity.ok(otpSentResponse());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    /**
     * POST /api/students/forgot-password/verify-otp
     *
     * Verifies a password-reset OTP WITHOUT consuming it, so the
     * frontend can reveal the "new password" screen. The OTP is still
     * required, and re-validated, at the final /reset-password step.
     *
     * Request body:
     * { "email": "raj@college.edu", "collegeCode": "ABC", "otp": "123456" }
     *
     * Responses:
     * 200 OK — { message }
     * 400 Bad Request — invalid/expired/exhausted OTP
     */
    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<?> verifyPasswordResetOtp(
            @Valid @RequestBody VerifyOtpRequest request) {

        try {
            studentService.verifyPasswordResetOtp(request);
            return ResponseEntity.ok(Map.of("message", "OTP verified."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    /**
     * POST /api/students/reset-password
     *
     * Final step of password reset: re-validates the OTP and, atomically
     * with that check, consumes it and updates the password.
     *
     * Request body:
     * { "email": "raj@college.edu", "collegeCode": "ABC", "otp": "123456", "newPassword": "newSecret123" }
     *
     * Responses:
     * 200 OK — { message }
     * 400 Bad Request — invalid/expired/exhausted OTP or no matching account
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        try {
            studentService.resetPassword(request);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    private Map<String, Object> otpSentResponse() {
        return Map.of(
                "message", "OTP sent to your email.",
                "expiresInSeconds", otpService.getExpiryMinutes() * 60);
    }

    /**
     * POST /api/students/login
     *
     * Authenticates a student and returns a JWT access token, valid for
     * 2 hours, to be sent as "Authorization: Bearer <token>" on
     * subsequent requests.
     *
     * Request body:
     * {
     * "collegeCode": "ABC",
     * "email": "raj@college.edu",
     * "password": "secret123"
     * }
     *
     * Responses:
     * 200 OK — { id, fullName, email, phoneNumber, collegeCode, token }
     * 401 Unauthorized — wrong college/email/password
     * 400 Bad Request — validation error
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request) {

        try {
            LoginResponse response = studentService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    /**
     * GET /api/students/me
     *
     * Fetches the authenticated student's own profile.
     *
     * Responses:
     * 200 OK — { id, fullName, email, phoneNumber, collegeName, collegeCode,
     * memberSince }
     */
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/me")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal AppUserPrincipal student) {
        try {
            ProfileResponse response = studentService.getProfile(student.getId());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    /**
     * PUT /api/students/me
     *
     * Updates the editable profile fields (full name, phone number) for
     * the authenticated student. Email, college, and password cannot be
     * changed through this endpoint.
     *
     * Request body:
     * {
     * "fullName": "Raj Kumar",
     * "phoneNumber": "9876543210"
     * }
     *
     * Responses:
     * 200 OK — updated profile
     * 400 Bad Request — validation error or phone number already taken
     */
    @PreAuthorize("hasRole('STUDENT')")
    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal AppUserPrincipal student,
            @Valid @RequestBody UpdateProfileRequest request) {

        try {
            ProfileResponse response = studentService.updateProfile(student.getId(), request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            HttpStatus status = ex.getMessage() != null && ex.getMessage().contains("not found")
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of("message", ex.getMessage()));
        }
    }
}
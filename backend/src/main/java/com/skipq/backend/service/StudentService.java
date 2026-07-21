package com.skipq.backend.service;

import com.skipq.backend.dto.LoginRequest;
import com.skipq.backend.dto.LoginResponse;
import com.skipq.backend.dto.student.EmailCollegeRequest;
import com.skipq.backend.dto.student.ResetPasswordRequest;
import com.skipq.backend.dto.student.VerifyOtpRequest;
import com.skipq.backend.dto.student.RegisterRequest;
import com.skipq.backend.entity.College;
import com.skipq.backend.entity.OtpPurpose;
import com.skipq.backend.entity.OtpVerification;
import com.skipq.backend.entity.Student;
import com.skipq.backend.repository.StudentRepository;
import com.skipq.backend.security.AppUserPrincipal;
import com.skipq.backend.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.skipq.backend.repository.CollegeRepository;
import com.skipq.backend.dto.student.ProfileResponse;

import com.skipq.backend.dto.student.UpdateProfileRequest;
@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final CollegeRepository collegeRepository;

    // Declared as a field so there is exactly one BCryptPasswordEncoder
    // instance for the lifetime of this bean — no need to expose it as
    // a Spring @Bean since only this service uses it.
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;

    public StudentService(
            StudentRepository studentRepository,
            CollegeRepository collegeRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            OtpService otpService) {

        this.studentRepository = studentRepository;
        this.collegeRepository = collegeRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.otpService = otpService;
    }

    /**
     * Step 1 of registration: validates the submitted details, then
     * generates and emails an OTP. No Student row is created here — the
     * password is BCrypt-hashed and held on the OTP row (never
     * plaintext) until {@link #completeRegistration} succeeds.
     *
     * @throws IllegalArgumentException if email/phone is already taken or the college code is invalid
     */
    @Transactional
    public void initiateRegistration(RegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();
        String phoneNumber = request.getPhoneNumber().trim();

        if (studentRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "An account with this email already exists.");
        }

        if (studentRepository.existsByPhoneNumber(phoneNumber)) {
            throw new IllegalArgumentException(
                    "An account with this phone number already exists.");
        }

        College college = collegeRepository
                .findByCodeIgnoreCase(request.getCollegeCode().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid college code."));

        String passwordHash = passwordEncoder.encode(request.getPassword());

        otpService.generateForRegistration(
                email, college, request.getFullName().trim(), phoneNumber, passwordHash);
    }

    /**
     * Step 2 of registration: verifies the OTP and, only on success,
     * creates the Student account from the pending data held on the OTP
     * row. Returns the created profile WITHOUT a token — per product
     * decision, registration does not auto-login the student; they're
     * redirected to the login page instead.
     *
     * Re-checks email/phone uniqueness at this point too, since another
     * registration could have taken the same email/phone during the
     * OTP window.
     *
     * @throws IllegalArgumentException if the OTP is invalid/expired/exhausted,
     *         the college code is invalid, or the email/phone was taken in the meantime
     */
    @Transactional
    public LoginResponse completeRegistration(VerifyOtpRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        College college = collegeRepository
                .findByCodeIgnoreCase(request.getCollegeCode().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid college code."));

        OtpVerification otp = otpService.verifyAndConsume(
                email, college, OtpPurpose.REGISTER, request.getOtp());

        if (studentRepository.existsByEmail(email)) {
            otpService.delete(email, college, OtpPurpose.REGISTER);
            throw new IllegalArgumentException(
                    "An account with this email already exists.");
        }

        if (studentRepository.existsByPhoneNumber(otp.getPendingPhoneNumber())) {
            otpService.delete(email, college, OtpPurpose.REGISTER);
            throw new IllegalArgumentException(
                    "An account with this phone number already exists.");
        }

        Student student = new Student();
        student.setFullName(otp.getPendingFullName());
        student.setEmail(email);
        student.setPhoneNumber(otp.getPendingPhoneNumber());
        student.setPassword(otp.getPendingPasswordHash());
        student.setCollege(college);

        Student saved = studentRepository.save(student);

        otpService.delete(email, college, OtpPurpose.REGISTER);

        return LoginResponse.from(saved);
    }

    /** Resends the OTP for a registration already in progress. */
    @Transactional
    public void resendRegistrationOtp(EmailCollegeRequest request) {
        College college = resolveCollege(request.getCollegeCode());
        otpService.resend(request.getEmail().trim().toLowerCase(), college, OtpPurpose.REGISTER);
    }

    /**
     * Starts a password reset. Always succeeds from the caller's point of
     * view (see controller) — an OTP is only actually sent if a matching
     * account exists, so this can't be used to enumerate registered emails.
     */
    @Transactional
    public void initiatePasswordReset(EmailCollegeRequest request) {
        College college = resolveCollege(request.getCollegeCode());
        String email = request.getEmail().trim().toLowerCase();

        studentRepository.findByEmailAndCollege(email, college)
                .ifPresent(student -> otpService.generateForPasswordReset(email, college));
    }

    /** Resends the OTP for a password reset already in progress. */
    @Transactional
    public void resendPasswordResetOtp(EmailCollegeRequest request) {
        College college = resolveCollege(request.getCollegeCode());
        otpService.resend(request.getEmail().trim().toLowerCase(), college, OtpPurpose.RESET_PASSWORD);
    }

    /**
     * Verifies a password-reset OTP without consuming it, so the
     * frontend can reveal the "new password" screen. The real,
     * consuming verification happens in {@link #resetPassword}.
     *
     * @throws IllegalArgumentException if the OTP is invalid/expired/exhausted
     */
    @Transactional
    public void verifyPasswordResetOtp(VerifyOtpRequest request) {
        College college = resolveCollege(request.getCollegeCode());
        otpService.verifyOnly(
                request.getEmail().trim().toLowerCase(), college, OtpPurpose.RESET_PASSWORD, request.getOtp());
    }

    /**
     * Final step of password reset: re-validates the OTP and, atomically
     * with that same check, consumes it and updates the password.
     *
     * @throws IllegalArgumentException if the OTP is invalid/expired/exhausted
     *         or no account exists for this email/college
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        College college = resolveCollege(request.getCollegeCode());
        String email = request.getEmail().trim().toLowerCase();

        otpService.verifyAndConsume(email, college, OtpPurpose.RESET_PASSWORD, request.getOtp());

        Student student = studentRepository.findByEmailAndCollege(email, college)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or college."));

        student.setPassword(passwordEncoder.encode(request.getNewPassword()));
        studentRepository.save(student);

        otpService.delete(email, college, OtpPurpose.RESET_PASSWORD);
    }

    private College resolveCollege(String collegeCode) {
        return collegeRepository
                .findByCodeIgnoreCase(collegeCode.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid college code."));
    }

    /**
     * Authenticates a student by email and password.
     *
     * Returns a LoginResponse (safe fields only) on success.
     * Throws IllegalArgumentException with a generic message on failure
     * so the caller cannot distinguish between "no such email" and
     * "wrong password" — intentional, to prevent account enumeration.
     *
     * @throws IllegalArgumentException on invalid credentials
     */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {

        String username = AppUserPrincipal.composeUsername(
                request.getEmail(), request.getCollegeCode());

        AppUserPrincipal principal;
        try {
            principal = (AppUserPrincipal) authenticationManager
                    .authenticate(new UsernamePasswordAuthenticationToken(
                            username, request.getPassword()))
                    .getPrincipal();
        } catch (UsernameNotFoundException ex) {
            // StudentUserDetailsService distinguishes "no such college" from
            // "no such student in that college" via the exception message —
            // preserve that distinction for the caller.
            throw new IllegalArgumentException(ex.getMessage());
        } catch (AuthenticationException ex) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        Student student = studentRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        String token = jwtUtil.generateToken(principal);
        return LoginResponse.from(student, token);
    }
    /**
     * Fetches a student's profile for display on the Profile page.
     *
     * @throws IllegalArgumentException if no student exists with the given id
     */
    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        return ProfileResponse.from(student);
    }

    /**
     * Updates the editable profile fields (full name, phone number) for a
     * student. Email, college, and password are intentionally untouched —
     * this endpoint only ever writes the two fields the Profile page's
     * "Save Changes" form exposes.
     *
     * @throws IllegalArgumentException if the student doesn't exist, or the
     *         new phone number is already used by a different account
     */
    @Transactional
    public ProfileResponse updateProfile(Long id, UpdateProfileRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        String newPhoneNumber = request.getPhoneNumber().trim();

        if (studentRepository.existsByPhoneNumberAndIdNot(newPhoneNumber, id)) {
            throw new IllegalArgumentException(
                    "An account with this phone number already exists.");
        }

        student.setFullName(request.getFullName().trim());
        student.setPhoneNumber(newPhoneNumber);

        Student saved = studentRepository.save(student);
        return ProfileResponse.from(saved);
    }
}
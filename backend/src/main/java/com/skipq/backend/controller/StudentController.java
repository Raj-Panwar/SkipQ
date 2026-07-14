package com.skipq.backend.controller;

import com.skipq.backend.dto.LoginRequest;
import com.skipq.backend.dto.LoginResponse;
import com.skipq.backend.dto.student.ProfileResponse;
import com.skipq.backend.dto.student.RegisterRequest;
import com.skipq.backend.dto.student.UpdateProfileRequest;
import com.skipq.backend.security.AppUserPrincipal;
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

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    /**
     * POST /api/students/register
     *
     * Registers a new student account.
     *
     * Request body:
     * {
     * "fullName": "Raj Kumar",
     * "email": "raj@college.edu",
     * "phoneNumber": "9876543210",
     * "password": "secret123"
     * }
     *
     * Responses:
     * 201 Created — { id, fullName, email, phoneNumber }
     * 400 Bad Request — validation error or duplicate email/phone
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request) {

        try {
            LoginResponse response = studentService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", ex.getMessage()));
        }
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
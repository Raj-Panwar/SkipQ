package com.skipq.backend.controller;

import com.skipq.backend.dto.LoginRequest;
import com.skipq.backend.dto.LoginResponse;
import com.skipq.backend.dto.student.ProfileResponse;
import com.skipq.backend.dto.student.RegisterRequest;
import com.skipq.backend.dto.student.UpdateProfileRequest;
import com.skipq.backend.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
     * Authenticates a student. No JWT is issued — the frontend stores
     * the returned student object in sessionStorage and uses the id for
     * subsequent requests.
     *
     * Request body:
     * {
     * "email": "raj@college.edu",
     * "password": "secret123"
     * }
     *
     * Responses:
     * 200 OK — { id, fullName, email, phoneNumber }
     * 401 Unauthorized — wrong email or password
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
     * GET /api/students/{id}
     *
     * Fetches a student's profile for the Profile page.
     *
     * Responses:
     * 200 OK — { id, fullName, email, phoneNumber, collegeName, collegeCode,
     * memberSince }
     * 404 Not Found — no student with this id
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getProfile(@PathVariable Long id) {
        try {
            ProfileResponse response = studentService.getProfile(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    /**
     * PUT /api/students/{id}
     *
     * Updates the editable profile fields (full name, phone number).
     * Email, college, and password cannot be changed through this endpoint.
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
     * 404 Not Found — no student with this id
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProfileRequest request) {

        try {
            ProfileResponse response = studentService.updateProfile(id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            HttpStatus status = ex.getMessage() != null && ex.getMessage().contains("not found")
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of("message", ex.getMessage()));
        }
    }
}
package com.skipq.backend.controller;

import com.skipq.backend.dto.admin.AdminLoginRequest;
import com.skipq.backend.dto.admin.AdminLoginResponse;
import com.skipq.backend.dto.admin.AdminRegisterRequest;
import com.skipq.backend.service.AdminService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admins")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /**
     * Creating a new admin account is itself an admin-management action,
     * so it requires an existing admin's token — there's no public
     * self-service admin signup. (SecurityConfig also enforces this at
     * the URL level for /api/admins/**, this annotation makes the
     * requirement explicit at the endpoint too.)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/register")
    public ResponseEntity<AdminLoginResponse> register(
            @Valid @RequestBody AdminRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AdminLoginResponse> login(
            @Valid @RequestBody AdminLoginRequest request) {
        return ResponseEntity.ok(adminService.login(request));
    }
}
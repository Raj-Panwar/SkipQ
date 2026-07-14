package com.skipq.backend.service;

import com.skipq.backend.dto.admin.AdminLoginRequest;
import com.skipq.backend.dto.admin.AdminLoginResponse;
import com.skipq.backend.dto.admin.AdminRegisterRequest;
import com.skipq.backend.entity.Admin;
import com.skipq.backend.entity.College;
import com.skipq.backend.exception.InvalidCredentialsException;
import com.skipq.backend.repository.AdminRepository;
import com.skipq.backend.repository.CollegeRepository;
import com.skipq.backend.security.AppUserPrincipal;
import com.skipq.backend.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@Transactional
public class AdminService {

    private final AdminRepository adminRepository;
    private final CollegeRepository collegeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AdminService(AdminRepository adminRepository,
                        CollegeRepository collegeRepository,
                        PasswordEncoder passwordEncoder,
                        AuthenticationManager authenticationManager,
                        JwtUtil jwtUtil) {
        this.adminRepository = adminRepository;
        this.collegeRepository = collegeRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    public AdminLoginResponse register(AdminRegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();
        String collegeCode = request.getCollegeCode().trim().toUpperCase();
        String fullName = request.getFullName().trim();

        College college = collegeRepository.findByCodeIgnoreCase(collegeCode)
                .orElseThrow(() ->
                        new NoSuchElementException("College not found with code: " + collegeCode));

        if (adminRepository.existsByEmailAndCollege(email, college)) {
            throw new IllegalArgumentException(
                    "Admin with this email already exists for college: " + collegeCode);
        }

        Admin admin = new Admin();
        admin.setFullName(fullName);
        admin.setEmail(email);
        admin.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        admin.setCollege(college);

        Admin saved = adminRepository.save(admin);

        return toLoginResponse(saved, college.getCode());
    }

    @Transactional(readOnly = true)
    public AdminLoginResponse login(AdminLoginRequest request) {

        String username = AppUserPrincipal.composeUsername(
                request.getEmail(), request.getCollegeCode());

        AppUserPrincipal principal;
        try {
            principal = (AppUserPrincipal) authenticationManager
                    .authenticate(new UsernamePasswordAuthenticationToken(
                            username, request.getPassword()))
                    .getPrincipal();
        } catch (AuthenticationException ex) {
            throw new InvalidCredentialsException("Invalid credentials");
        }

        Admin admin = adminRepository.findById(principal.getId())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid credentials"));

        String token = jwtUtil.generateToken(principal);
        return toLoginResponse(admin, principal.getCollegeCode(), token);
    }

    @Transactional(readOnly = true)
    public AdminLoginResponse findById(Long id) {

        Admin admin = adminRepository.findById(id)
                .orElseThrow(() ->
                        new NoSuchElementException("Admin not found: " + id));

        return toLoginResponse(admin, admin.getCollege().getCode());
    }

    private AdminLoginResponse toLoginResponse(Admin admin, String collegeCode) {
        return toLoginResponse(admin, collegeCode, null);
    }

    private AdminLoginResponse toLoginResponse(Admin admin, String collegeCode, String token) {
        return new AdminLoginResponse(
                admin.getId(),
                admin.getFullName(),
                admin.getEmail(),
                collegeCode,
                token
        );
    }
    public Admin getById(Long id) {
    return adminRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Admin not found"));
}
@Transactional(readOnly = true)
public Admin getAdminById(Long adminId) {

    return adminRepository.findById(adminId)
            .orElseThrow(() ->
                    new RuntimeException("Admin not found"));
}
}
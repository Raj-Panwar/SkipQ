package com.skipq.backend.service;

import com.skipq.backend.dto.admin.AdminLoginRequest;
import com.skipq.backend.dto.admin.AdminLoginResponse;
import com.skipq.backend.dto.admin.AdminRegisterRequest;
import com.skipq.backend.entity.Admin;
import com.skipq.backend.entity.College;
import com.skipq.backend.exception.InvalidCredentialsException;
import com.skipq.backend.repository.AdminRepository;
import com.skipq.backend.repository.CollegeRepository;
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

    public AdminService(AdminRepository adminRepository,
                        CollegeRepository collegeRepository,
                        PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.collegeRepository = collegeRepository;
        this.passwordEncoder = passwordEncoder;
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

        String email = request.getEmail().trim().toLowerCase();
        String collegeCode = request.getCollegeCode().trim().toUpperCase();

        College college = collegeRepository.findByCodeIgnoreCase(collegeCode)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid credentials"));

        Admin admin = adminRepository.findByEmailAndCollege(email, college)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid credentials");
        }

        return toLoginResponse(admin, college.getCode());
    }

    @Transactional(readOnly = true)
    public AdminLoginResponse findById(Long id) {

        Admin admin = adminRepository.findById(id)
                .orElseThrow(() ->
                        new NoSuchElementException("Admin not found: " + id));

        return toLoginResponse(admin, admin.getCollege().getCode());
    }

    private AdminLoginResponse toLoginResponse(Admin admin, String collegeCode) {
        return new AdminLoginResponse(
                admin.getId(),
                admin.getFullName(),
                admin.getEmail(),
                collegeCode
        );
    }
    public Admin getById(Long id) {
    return adminRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Admin not found"));
}
}
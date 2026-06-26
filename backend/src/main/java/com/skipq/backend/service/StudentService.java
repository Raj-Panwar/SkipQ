package com.skipq.backend.service;

import com.skipq.backend.dto.LoginRequest;
import com.skipq.backend.dto.LoginResponse;
import com.skipq.backend.dto.RegisterRequest;
import com.skipq.backend.entity.Student;
import com.skipq.backend.repository.StudentRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentService {

    private final StudentRepository studentRepository;

    // Declared as a field so there is exactly one BCryptPasswordEncoder
    // instance for the lifetime of this bean — no need to expose it as
    // a Spring @Bean since only this service uses it.
    private final PasswordEncoder passwordEncoder;
    public StudentService(StudentRepository studentRepository, PasswordEncoder passwordEncoder) { 
        this.studentRepository = studentRepository; 
        this.passwordEncoder = passwordEncoder; 
    }

    

    /**
     * Registers a new student.
     *
     * Validates email and phone uniqueness before persisting.
     * The raw password is BCrypt-hashed and the hash is stored; the
     * plain-text password is never saved or returned.
     *
     * @throws IllegalArgumentException if email or phone is already taken
     */
    @Transactional
    public LoginResponse register(RegisterRequest request) {

        if (studentRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException(
                    "An account with this email already exists.");
        }

        if (studentRepository.existsByPhoneNumber(request.getPhoneNumber().trim())) {
            throw new IllegalArgumentException(
                    "An account with this phone number already exists.");
        }

        Student student = new Student();
        student.setFullName(request.getFullName().trim());
        student.setEmail(request.getEmail().trim().toLowerCase());
        student.setPhoneNumber(request.getPhoneNumber().trim());
        student.setPassword(passwordEncoder.encode(request.getPassword()));

        Student saved = studentRepository.save(student);
        return LoginResponse.from(saved);
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

        Student student = studentRepository
                .findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), student.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        return LoginResponse.from(student);
    }
}

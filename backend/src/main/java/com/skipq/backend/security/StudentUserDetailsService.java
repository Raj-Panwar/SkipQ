package com.skipq.backend.security;

import com.skipq.backend.entity.College;
import com.skipq.backend.entity.Student;
import com.skipq.backend.repository.CollegeRepository;
import com.skipq.backend.repository.StudentRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Used only during login (via AuthenticationManager / DaoAuthenticationProvider)
 * to verify student credentials. Expects the composite username produced by
 * {@link AppUserPrincipal#composeUsername}, i.e. "COLLEGECODE|email".
 */
@Service
public class StudentUserDetailsService implements UserDetailsService {

    private final StudentRepository studentRepository;
    private final CollegeRepository collegeRepository;

    public StudentUserDetailsService(StudentRepository studentRepository,
                                      CollegeRepository collegeRepository) {
        this.studentRepository = studentRepository;
        this.collegeRepository = collegeRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String compositeUsername) throws UsernameNotFoundException {
        String[] parts = compositeUsername.split("\\|", 2);
        if (parts.length != 2) {
            throw new UsernameNotFoundException("Invalid username format");
        }
        String collegeCode = parts[0];
        String email = parts[1];

        College college = collegeRepository.findByCodeIgnoreCase(collegeCode)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid college code"));

        Student student = studentRepository.findByEmailAndCollege(email, college)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid email or password"));

        return new AppUserPrincipal(
                student.getId(),
                student.getEmail(),
                student.getPassword(),
                student.getFullName(),
                college.getId(),
                college.getCode(),
                UserType.STUDENT);
    }
}

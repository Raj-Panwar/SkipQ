package com.skipq.backend.security;

import com.skipq.backend.entity.Admin;
import com.skipq.backend.entity.College;
import com.skipq.backend.repository.AdminRepository;
import com.skipq.backend.repository.CollegeRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Used only during login (via AuthenticationManager / DaoAuthenticationProvider)
 * to verify admin credentials. Expects the composite username produced by
 * {@link AppUserPrincipal#composeUsername}, i.e. "COLLEGECODE|email" --
 * required because admin email is only unique per-college, not globally.
 */
@Service
public class AdminUserDetailsService implements UserDetailsService {

    private final AdminRepository adminRepository;
    private final CollegeRepository collegeRepository;

    public AdminUserDetailsService(AdminRepository adminRepository,
                                    CollegeRepository collegeRepository) {
        this.adminRepository = adminRepository;
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
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));

        Admin admin = adminRepository.findByEmailAndCollege(email, college)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));

        return new AppUserPrincipal(
                admin.getId(),
                admin.getEmail(),
                admin.getPasswordHash(),
                admin.getFullName(),
                college.getId(),
                college.getCode(),
                UserType.ADMIN);
    }
}

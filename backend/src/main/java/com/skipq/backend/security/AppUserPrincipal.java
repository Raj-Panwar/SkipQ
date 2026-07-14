package com.skipq.backend.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Single UserDetails implementation shared by both Student and Admin
 * principals. Serves two purposes:
 *
 * 1. At login time, built from a DB lookup (with the BCrypt hash) and
 *    fed into DaoAuthenticationProvider for credential verification.
 * 2. On every subsequent request, rebuilt directly from validated JWT
 *    claims (no DB hit -- passwordHash is null in that case, since it's
 *    never needed after login and is never placed in the token).
 *
 * getUsername() returns a composite "collegeCode|email" key rather than
 * bare email, because Admin emails are only unique per-college (Student
 * emails happen to be globally unique today, but using the same composite
 * key for both keeps the two UserDetailsService implementations
 * consistent and avoids relying on that Student-only guarantee).
 */
public class AppUserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String passwordHash;
    private final String fullName;
    private final Long collegeId;
    private final String collegeCode;
    private final UserType type;

    public AppUserPrincipal(Long id, String email, String passwordHash, String fullName,
                             Long collegeId, String collegeCode, UserType type) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.collegeId = collegeId;
        this.collegeCode = collegeCode;
        this.type = type;
    }

    public static String composeUsername(String email, String collegeCode) {
        return collegeCode.trim().toUpperCase() + "|" + email.trim().toLowerCase();
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public Long getCollegeId() { return collegeId; }
    public String getCollegeCode() { return collegeCode; }
    public UserType getType() { return type; }
    public boolean isStudent() { return type == UserType.STUDENT; }
    public boolean isAdmin() { return type == UserType.ADMIN; }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return composeUsername(email, collegeCode);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + type.name()));
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}

package com.skipq.backend.security;

/**
 * Distinguishes which principal table a JWT / authenticated user belongs
 * to. Students and Admins are separate entities with separate login
 * endpoints, so this is carried as a claim in the JWT and used to route
 * to the correct UserDetailsService at login time.
 */
public enum UserType {
    STUDENT,
    ADMIN
}
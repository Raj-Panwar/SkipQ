package com.skipq.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Issues and validates access tokens. Stateless: everything a request
 * needs (id, email, college, role) is carried as a claim in the signed
 * token, so validating a request never requires a DB lookup.
 */
@Component
public class JwtUtil {

    private static final String CLAIM_TYPE = "type";
    private static final String CLAIM_COLLEGE_ID = "collegeId";
    private static final String CLAIM_COLLEGE_CODE = "collegeCode";
    private static final String CLAIM_FULL_NAME = "fullName";

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms}") long expirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(AppUserPrincipal principal) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(String.valueOf(principal.getId()))
                .claim(CLAIM_TYPE, principal.getType().name())
                .claim(CLAIM_COLLEGE_ID, principal.getCollegeId())
                .claim(CLAIM_COLLEGE_CODE, principal.getCollegeCode())
                .claim(CLAIM_FULL_NAME, principal.getFullName())
                .claim("email", principal.getEmail())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Validates signature + expiry and rebuilds the principal directly
     * from the token's claims. Throws JwtException (or a subclass) if
     * the token is missing, malformed, expired, or has a bad signature.
     */
    public AppUserPrincipal parseToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        Long id = Long.valueOf(claims.getSubject());
        UserType type = UserType.valueOf(claims.get(CLAIM_TYPE, String.class));
        Long collegeId = claims.get(CLAIM_COLLEGE_ID, Long.class);
        String collegeCode = claims.get(CLAIM_COLLEGE_CODE, String.class);
        String fullName = claims.get(CLAIM_FULL_NAME, String.class);
        String email = claims.get("email", String.class);

        return new AppUserPrincipal(id, email, null, fullName, collegeId, collegeCode, type);
    }

    /** @return true if the token parses and validates cleanly. */
    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }
}

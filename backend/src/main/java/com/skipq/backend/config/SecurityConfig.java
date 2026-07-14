package com.skipq.backend.config;

import com.skipq.backend.security.AdminUserDetailsService;
import com.skipq.backend.security.JwtAccessDeniedHandler;
import com.skipq.backend.security.JwtAuthenticationEntryPoint;
import com.skipq.backend.security.JwtAuthenticationFilter;
import com.skipq.backend.security.JwtUtil;
import com.skipq.backend.security.StudentUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    /**
     * Stateless JWT authentication. Public endpoints are the ones that
     * must work before a token exists (login/register/college lookup/
     * pre-login queue info); everything else requires a valid Bearer
     * token, with role checks layered on top for admin-only routes.
     */
    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            JwtAuthenticationEntryPoint authenticationEntryPoint,
            JwtAccessDeniedHandler accessDeniedHandler) throws Exception {

        http
                .cors(cors -> {})
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(eh -> eh
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        // Public: student auth
                        .requestMatchers("/api/students/register", "/api/students/login").permitAll()
                        // Public: admin auth
                        .requestMatchers("/api/admins/login").permitAll()
                        // Public: college lookup (read-only)
                        .requestMatchers(HttpMethod.GET, "/api/colleges/**").permitAll()
                        // Public: pre-login queue snapshot
                        .requestMatchers("/api/orders/queue/college/**").permitAll()
                        // Admin-only routes (admin auth/registration, college management)
                        .requestMatchers("/api/admins/**", "/api/colleges/**").hasRole("ADMIN")
                        // Everything else on /api/** requires any valid token
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(JwtUtil jwtUtil) {
        return new JwtAuthenticationFilter(jwtUtil);
    }

    /**
     * Students and Admins are separate principal types with separate
     * login endpoints, so each gets its own DaoAuthenticationProvider;
     * the AuthenticationManager tries both in turn during login.
     */
    @Bean
    public DaoAuthenticationProvider studentAuthenticationProvider(
            StudentUserDetailsService studentUserDetailsService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(studentUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        // Preserve the service layer's existing distinct "Invalid college
        // code." vs "Invalid email or password." messages instead of
        // Spring Security's default generic "Bad credentials".
        provider.setHideUserNotFoundExceptions(false);
        return provider;
    }

    @Bean
    public DaoAuthenticationProvider adminAuthenticationProvider(
            AdminUserDetailsService adminUserDetailsService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(adminUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        provider.setHideUserNotFoundExceptions(true);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            DaoAuthenticationProvider studentAuthenticationProvider,
            DaoAuthenticationProvider adminAuthenticationProvider) {

        return new ProviderManager(studentAuthenticationProvider, adminAuthenticationProvider);
    }

    /**
     * BCryptPasswordEncoder bean — injected into StudentService for
     * hashing and verifying passwords.
     * Declared here (not inside StudentService) so Spring can manage
     * the single instance and other services can inject it if needed.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.addAllowedOrigin("http://127.0.0.1:5500");
        configuration.addAllowedOrigin("http://localhost:5500");

        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");
        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
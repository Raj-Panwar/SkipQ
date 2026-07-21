package com.skipq.backend.repository;

import com.skipq.backend.entity.College;
import com.skipq.backend.entity.OtpPurpose;
import com.skipq.backend.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findByEmailAndCollegeAndPurpose(
            String email, College college, OtpPurpose purpose);

    void deleteByEmailAndCollegeAndPurpose(
            String email, College college, OtpPurpose purpose);
}
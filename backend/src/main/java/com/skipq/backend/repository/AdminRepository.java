package com.skipq.backend.repository;

import com.skipq.backend.entity.Admin;
import com.skipq.backend.entity.College;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Long> {

    Optional<Admin> findByEmailAndCollege(String email, College college);

    boolean existsByEmailAndCollege(String email, College college);
}
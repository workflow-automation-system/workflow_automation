package com.workflow_automation.auth_service.repository;

import com.workflow_automation.auth_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByVerificationToken(String verificationToken);
    boolean existsByEmail(String email);
    long countByOrganizationId(Long organizationId);
    List<User> findByEnabledFalseAndVerificationTokenExpiresAtBefore(LocalDateTime cutoff);
    List<User> findByOrganizationId(Long organizationId);
}

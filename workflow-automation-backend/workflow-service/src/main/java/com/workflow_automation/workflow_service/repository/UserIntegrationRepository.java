package com.workflow_automation.workflow_service.repository;

import com.workflow_automation.workflow_service.entity.UserIntegration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserIntegrationRepository extends JpaRepository<UserIntegration, Long> {
    Optional<UserIntegration> findByUserIdAndProvider(Long userId, String provider);
}

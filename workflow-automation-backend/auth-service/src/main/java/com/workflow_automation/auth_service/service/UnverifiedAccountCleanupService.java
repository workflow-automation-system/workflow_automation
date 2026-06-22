package com.workflow_automation.auth_service.service;

import com.workflow_automation.auth_service.entity.User;
import com.workflow_automation.auth_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UnverifiedAccountCleanupService {

    private final UserRepository userRepository;
    private final OrganizationClient organizationClient;

    @Scheduled(fixedRate = 3600000)
    public void cleanupExpiredUnverifiedAccounts() {
        List<User> expiredUsers = userRepository
                .findByEnabledFalseAndVerificationTokenExpiresAtBefore(LocalDateTime.now());

        if (expiredUsers.isEmpty()) {
            return;
        }

        log.info("Cleaning up {} expired unverified registration accounts", expiredUsers.size());
        for (User user : expiredUsers) {
            try {
                organizationClient.removeMember(user.getOrganizationId(), user.getId());
            } catch (Exception e) {
                log.debug("No org member to remove for userId={}: {}", user.getId(), e.getMessage());
            }
        }
        userRepository.deleteAll(expiredUsers);
        log.info("Deleted {} expired unverified accounts", expiredUsers.size());
    }
}

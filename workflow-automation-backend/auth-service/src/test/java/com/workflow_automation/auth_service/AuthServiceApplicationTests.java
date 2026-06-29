package com.workflow_automation.auth_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.ActiveProfiles;
import com.workflow_automation.auth_service.service.EmailService;
import com.workflow_automation.auth_service.service.OrganizationClient;

@SpringBootTest
@ActiveProfiles("test")
class AuthServiceApplicationTests {

	@MockitoBean
	private OrganizationClient organizationClient;

	@MockitoBean
	private EmailService emailService;

	@Test
	void contextLoads() {
	}

}

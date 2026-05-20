package com.workflow_automation.auth_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import com.workflow_automation.auth_service.service.EmailService;
import com.workflow_automation.auth_service.service.OrganizationClient;

@SpringBootTest
@ActiveProfiles("test")
class AuthServiceApplicationTests {

	@MockBean
	private OrganizationClient organizationClient;

	@MockBean
	private EmailService emailService;

	@Test
	void contextLoads() {
	}

}

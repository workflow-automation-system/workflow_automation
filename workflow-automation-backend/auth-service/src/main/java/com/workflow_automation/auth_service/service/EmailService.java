package com.workflow_automation.auth_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    public void sendVerificationEmail(String to, String verificationLink) {
        log.info("\n\n======================================================\n" +
                 "MOCK EMAIL SENT TO: {}\n" +
                 "SUBJECT: Verify your Workflow Automation account\n" +
                 "VERIFICATION LINK: \n{}\n" +
                 "======================================================\n", 
                 to, verificationLink);
    }

    public void sendInvitationEmail(String to, String name, String invitationLink) {
        log.info("\n\n======================================================\n" +
                 "MOCK EMAIL SENT TO: {}\n" +
                 "SUBJECT: Invitation à rejoindre Workflow Automation\n" +
                 "INVITATION LINK: \n{}\n" +
                 "======================================================\n", 
                 to, invitationLink);
    }

    public void sendPasswordResetEmail(String to, String resetLink) {
        log.info("\n\n======================================================\n" +
                 "MOCK EMAIL SENT TO: {}\n" +
                 "SUBJECT: Réinitialisation de votre mot de passe\n" +
                 "RESET LINK: \n{}\n" +
                 "======================================================\n", 
                 to, resetLink);
    }
}
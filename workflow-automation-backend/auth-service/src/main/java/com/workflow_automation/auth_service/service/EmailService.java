package com.workflow_automation.auth_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendVerificationEmail(String to, String verificationLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject("Verify your Workflow Automation account");
        message.setText(
                "Bonjour,\n\n" +
                        "Merci pour votre inscription.\n\n" +
                        "Cliquez sur ce lien pour activer votre compte :\n" +
                        verificationLink + "\n\n" +
                        "Ce lien expire dans 24 heures.\n\n" +
                        "Si vous n'avez pas créé de compte, ignorez cet email."
        );

        try {
            mailSender.send(message);
            log.info("Verification email sent to {}", to);
        } catch (MailException e) {
            log.error("Failed to send verification email to {}: {}", to, e.getMessage());
            throw new RuntimeException(
                    "Impossible d'envoyer l'email de vérification à " + to +
                    ". Veuillez vérifier que l'adresse email est valide.", e);
        }
    }
}

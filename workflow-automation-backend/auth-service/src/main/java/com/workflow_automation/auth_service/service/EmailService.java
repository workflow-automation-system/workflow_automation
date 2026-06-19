package com.workflow_automation.auth_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Async
    public void sendVerificationEmail(String to, String verificationLink) {
        String subject = "Verify your Workflow Automation account";
        String textContent = "Bonjour,\n\n" +
                "Merci pour votre inscription.\n\n" +
                "Cliquez sur ce lien pour activer votre compte :\n" +
                verificationLink + "\n\n" +
                "Ce lien expire dans 24 heures.\n\n" +
                "Si vous n'avez pas créé de compte, ignorez cet email.";
        
        sendEmail(to, subject, textContent);
    }

    @Async
    public void sendInvitationEmail(String to, String name, String verificationLink, String tempPassword) {
        String subject = "You've been invited to Workflow Automation";
        String textContent = "Bonjour " + name + ",\n\n" +
                "Vous avez été invité(e) à rejoindre la plateforme Workflow Automation.\n\n" +
                "Votre mot de passe temporaire : " + tempPassword + "\n\n" +
                "Cliquez sur ce lien pour activer votre compte :\n" +
                verificationLink + "\n\n" +
                "Ce lien expire dans 72 heures.\n\n" +
                "Une fois connecté(e), vous pourrez changer votre mot de passe dans les paramètres.";
                
        sendEmail(to, subject, textContent);
    }

    private void sendEmail(String to, String subject, String textContent) {
        if (mailHost != null && (mailHost.toLowerCase().contains("brevo") || mailHost.toLowerCase().contains("sendinblue"))) {
            sendViaBrevoApi(to, subject, textContent);
        } else {
            sendViaSmtp(to, subject, textContent);
        }
    }

    private void sendViaBrevoApi(String to, String subject, String textContent) {
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("api-key", mailPassword != null ? mailPassword.trim() : "");
            headers.set("Content-Type", "application/json");
            headers.set("Accept", "application/json");

            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("sender", java.util.Map.of("email", fromEmail, "name", "Workflow Automation"));
            body.put("to", java.util.List.of(java.util.Map.of("email", to)));
            body.put("subject", subject);
            body.put("textContent", textContent);

            org.springframework.http.HttpEntity<java.util.Map<String, Object>> request = new org.springframework.http.HttpEntity<>(body, headers);
            
            restTemplate.postForEntity("https://api.brevo.com/v3/smtp/email", request, String.class);
            log.info("Email sent to {} via Brevo HTTP API", to);
        } catch (Exception e) {
            log.error("Failed to send email via Brevo API to {}: {}", to, e.getMessage());
            throw new RuntimeException("Impossible d'envoyer l'email via l'API Brevo. Veuillez vérifier l'adresse email.", e);
        }
    }

    private void sendViaSmtp(String to, String subject, String textContent) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(textContent);

        try {
            mailSender.send(message);
            log.info("Email sent to {} via SMTP", to);
        } catch (MailException e) {
            log.error("Failed to send email via SMTP to {}: {}", to, e.getMessage());
            throw new RuntimeException("Impossible d'envoyer l'email via SMTP. Veuillez vérifier l'adresse email.", e);
        }
    }
}

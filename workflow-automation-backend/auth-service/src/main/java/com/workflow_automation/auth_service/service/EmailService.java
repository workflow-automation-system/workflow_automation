package com.workflow_automation.auth_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

    private final RestClient restClient;
    
    @Value("${app.mail.from:autoflow.admin@gmail.com}")
    private String fromEmail;

    public EmailService(@Value("${MAIL_PASSWORD}") String apiKey) {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.brevo.com/v3")
                .defaultHeader("api-key", apiKey)
                .defaultHeader("accept", "application/json")
                .defaultHeader("content-type", "application/json")
                .build();
    }

    public void sendVerificationEmail(String to, String verificationLink) {
        String htmlContent = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;\">"
                + "<h2 style=\"color: #292d32; text-align: center;\">Bienvenue sur Workflow Automation</h2>"
                + "<p style=\"color: #5c5c5c; font-size: 16px;\">Bonjour,</p>"
                + "<p style=\"color: #5c5c5c; font-size: 16px;\">Merci pour votre inscription. Veuillez confirmer votre adresse e-mail pour activer votre compte.</p>"
                + "<div style=\"text-align: center; margin: 30px 0;\">"
                + "<a href=\"" + verificationLink + "\" style=\"background-color: #292d32; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;\">Activer mon compte</a>"
                + "</div>"
                + "<p style=\"color: #5c5c5c; font-size: 14px;\">Ce lien expirera dans 24 heures.</p>"
                + "<hr style=\"border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;\" />"
                + "<p style=\"color: #8a8a8a; font-size: 12px; text-align: center;\">Si vous n'avez pas créé de compte, vous pouvez ignorer cet e-mail.</p>"
                + "</div>";

        sendBrevoEmail(to, "Activation de votre compte Workflow Automation", null, htmlContent);
    }

    public void sendInvitationEmail(String to, String name, String invitationLink) {
        String htmlContent = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;\">"
                + "<h2 style=\"color: #292d32; text-align: center;\">Bienvenue sur Workflow Automation</h2>"
                + "<p style=\"color: #5c5c5c; font-size: 16px;\">Bonjour <strong>" + name + "</strong>,</p>"
                + "<p style=\"color: #5c5c5c; font-size: 16px;\">Vous avez été invité(e) à rejoindre l'organisation sur la plateforme Workflow Automation.</p>"
                + "<div style=\"text-align: center; margin: 30px 0;\">"
                + "<a href=\"" + invitationLink + "\" style=\"background-color: #292d32; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;\">Accepter l'invitation</a>"
                + "</div>"
                + "<p style=\"color: #5c5c5c; font-size: 14px;\">Ce lien expirera dans 72 heures.</p>"
                + "<hr style=\"border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;\" />"
                + "<p style=\"color: #8a8a8a; font-size: 12px; text-align: center;\">Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet e-mail en toute sécurité.</p>"
                + "</div>";

        sendBrevoEmail(to, "Invitation à rejoindre Workflow Automation", null, htmlContent);
    }

    public void sendPasswordResetEmail(String to, String resetLink) {
        String htmlContent = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;\">"
                + "<h2 style=\"color: #292d32; text-align: center;\">Réinitialisation de mot de passe</h2>"
                + "<p style=\"color: #5c5c5c; font-size: 16px;\">Bonjour,</p>"
                + "<p style=\"color: #5c5c5c; font-size: 16px;\">Vous avez demandé à réinitialiser votre mot de passe sur Workflow Automation.</p>"
                + "<div style=\"text-align: center; margin: 30px 0;\">"
                + "<a href=\"" + resetLink + "\" style=\"background-color: #292d32; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;\">Réinitialiser le mot de passe</a>"
                + "</div>"
                + "<p style=\"color: #5c5c5c; font-size: 14px;\">Ce lien expirera dans 1 heure.</p>"
                + "<hr style=\"border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;\" />"
                + "<p style=\"color: #8a8a8a; font-size: 12px; text-align: center;\">Si vous n'avez pas fait cette demande, vous pouvez ignorer cet e-mail.</p>"
                + "</div>";

        sendBrevoEmail(to, "Réinitialisation de votre mot de passe", null, htmlContent);
    }

    private void sendBrevoEmail(String to, String subject, String textContent, String htmlContent) {
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("sender", Map.of("name", "Workflow Automation", "email", fromEmail));
        body.put("to", List.of(Map.of("email", to)));
        body.put("subject", subject);
        
        if (textContent != null) {
            body.put("textContent", textContent);
        }
        if (htmlContent != null) {
            body.put("htmlContent", htmlContent);
        }

        try {
            restClient.post()
                    .uri("/smtp/email")
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Email successfully sent to {} via Brevo API", to);
        } catch (Exception e) {
            log.error("Failed to send email via Brevo API to {}: {}", to, e.getMessage());
            throw new RuntimeException("Impossible d'envoyer l'email. Veuillez verifier que l'adresse email est valide.", e);
        }
    }
}
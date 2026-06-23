package com.workflow_automation.auth_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

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
                        "Si vous n'avez pas cree de compte, ignorez cet email."
        );

        try {
            mailSender.send(message);
            log.info("Verification email sent to {}", to);
        } catch (MailException e) {
            log.error("Failed to send verification email to {}: {}", to, e.getMessage());
            throw new RuntimeException(
                    "Impossible d'envoyer l'email de verification a " + to +
                            ". Veuillez verifier que l'adresse email est valide.", e);
        }
    }

    public void sendInvitationEmail(String to, String name, String invitationLink) {
        MimeMessage message = mailSender.createMimeMessage();
        
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Invitation à rejoindre Workflow Automation");
            
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
            
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Invitation HTML email sent to {}", to);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send HTML invitation email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send invitation email to " + to, e);
        }
    }

    public void sendPasswordResetEmail(String to, String resetLink) {
        MimeMessage message = mailSender.createMimeMessage();
        
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Réinitialisation de votre mot de passe");
            
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
            
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Password reset email sent to {}", to);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send password reset email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Impossible d'envoyer l'e-mail de réinitialisation", e);
        }
    }
}
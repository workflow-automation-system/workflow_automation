package com.workflow_automation.auth_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.util.Hashtable;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@Slf4j
public class EmailValidationService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$"
    );

    private static final Set<String> DISPOSABLE_DOMAINS = Set.of(
            "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email",
            "yopmail.com", "sharklasers.com", "guerrillamailblock.com", "grr.la",
            "dispostable.com", "trashmail.com", "10minutemail.com", "temp-mail.org",
            "fakeinbox.com", "mailnesia.com", "maildrop.cc", "discard.email",
            "getnada.com", "mohmal.com", "emailondeck.com", "tempail.com"
    );

    /**
     * Validates an email address:
     * 1. Format check (regex)
     * 2. Disposable/temporary email domain check
     * 3. DNS MX record check (verifies the domain can receive email)
     *
     * @return null if valid, or an error message string if invalid
     */
    public String validate(String email) {
        if (email == null || email.isBlank()) {
            return "L'adresse email est requise.";
        }

        String trimmed = email.trim().toLowerCase();

        if (!EMAIL_PATTERN.matcher(trimmed).matches()) {
            return "Le format de l'adresse email est invalide.";
        }

        String domain = trimmed.substring(trimmed.indexOf('@') + 1);

        if (DISPOSABLE_DOMAINS.contains(domain)) {
            return "Les adresses email temporaires/jetables ne sont pas autorisées.";
        }

        if (!hasMxRecord(domain)) {
            return "Le domaine '" + domain + "' ne peut pas recevoir d'emails. Veuillez utiliser une adresse email valide.";
        }

        return null;
    }

    /**
     * Checks if the domain has MX (Mail Exchange) DNS records.
     * A domain without MX records cannot receive email.
     */
    private boolean hasMxRecord(String domain) {
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");

            DirContext ctx = new InitialDirContext(env);

            try {
                Attributes attrs = ctx.getAttributes(domain, new String[]{"MX"});
                Attribute mxAttr = attrs.get("MX");

                if (mxAttr != null && mxAttr.size() > 0) {
                    log.debug("MX records found for domain {}: {}", domain, mxAttr);
                    return true;
                }

                // Fallback: some domains use A records instead of MX records for email
                Attributes aAttrs = ctx.getAttributes(domain, new String[]{"A"});
                Attribute aAttr = aAttrs.get("A");
                if (aAttr != null && aAttr.size() > 0) {
                    log.debug("No MX but A record found for domain {}", domain);
                    return true;
                }

                log.info("No MX or A records found for domain {}", domain);
                return false;
            } finally {
                ctx.close();
            }
        } catch (NamingException e) {
            log.warn("DNS lookup failed for domain {}: {}. Allowing email to prevent blocking valid users due to Docker DNS issues.", domain, e.getMessage());
            return true; // Fail open to allow valid emails if DNS lookup times out in Docker
        }
    }
}

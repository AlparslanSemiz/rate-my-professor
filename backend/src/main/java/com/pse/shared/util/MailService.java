package com.pse.shared.util;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import com.pse.auth.service.LoginCodeDelivery;
import com.pse.auth.service.LoginLocationService;
import com.pse.auth.service.LoginSuccessDelivery;
import com.pse.auth.service.MailTemplateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;

import com.pse.auth.location.LoginLocation;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Sends HTML emails using GMX
 *
 * Mail templates are stored under:
 * src/main/resources/templates/mail/
 */
@Service
@Profile("!test")
public class MailService implements LoginCodeDelivery, LoginSuccessDelivery {

    private static final Logger LOGGER = LoggerFactory.getLogger(MailService.class);

    private static final String LOGIN_EMAIL_SUBJECT = "Your Login Code for RateMyProfApp";

    private static final String SUCCESSFUL_LOGIN_EMAIL_SUBJECT = "Successful login to your RateMyProfApp account";

    private static final String LOGO_CONTENT_ID = "rateMyProfLogo";

    private static final String LOGO_PATH = "static/mail/logo.png";

    private final JavaMailSender mailSender;
    private final MailTemplateService mailTemplateService;
    private final LoginLocationService loginLocationService;
    private final String senderMail;
    private final String senderName;

    public MailService(
            JavaMailSender mailSender,
            MailTemplateService mailTemplateService,
            LoginLocationService loginLocationService,
            @Value("${app.mail.from-address}") String senderMail,
            @Value("${app.mail.from-name:RateMyProfApp}") String senderName
    ) {
        this.mailSender = mailSender;
        this.mailTemplateService = mailTemplateService;
        this.loginLocationService = loginLocationService;
        this.senderMail = senderMail;
        this.senderName = senderName;
    }

    /**
     * Sends the login mail containing the one-time password.
     */
    @Override
    public void send(String to, String otp) {


        String body = mailTemplateService.create(
                "OTPMailTemplate.html",
                Map.of("otp", escapeHtml(otp))
        );

        sendMail(
                to,
                senderMail,
                senderName,
                LOGIN_EMAIL_SUBJECT,
                body
        );
    }

    /**
     * Sends a notification after a successful login.
     */
    @Override
    public void send(String email, String ip, String userAgent) {

        LoginLocation loginLocation = loginLocationService.getLoginLocation(ip);

        String staticMap =
                loginLocationService.createStaticMap(
                        loginLocation.mapsUrl(),
                        loginLocation.coordinates()
                );

        String body = mailTemplateService.create(
                "SuccessfulLoginMailTemplate.html",
                Map.of(
                        "location",
                        escapeHtml(loginLocation.description()),

                        "staticMap",
                        staticMap,

                        "ip",
                        escapeHtml(ip),

                        "userAgent",
                        escapeHtml(userAgent)
                )
        );

        sendMail(
                email,
                senderMail,
                senderName,
                SUCCESSFUL_LOGIN_EMAIL_SUBJECT,
                body
        );
    }



    /**
     * Creates and sends an HTML email with an embedded logo.
     */
    private void sendMail(String to, String fromEmail, String senderName, String subject, String body) {

        MimeMessage message = mailSender.createMimeMessage();

        try {
            MimeMessageHelper helper =
                    new MimeMessageHelper(
                            message,
                            true,
                            StandardCharsets.UTF_8.name()
                    );

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom(
                    fromEmail,
                    senderName
            );


            //true means that the email body contains HTML.
            helper.setText(body, true);

            addLogo(helper);

            mailSender.send(message);

        } catch (
                MessagingException | UnsupportedEncodingException exception
        ) {
            throw new IllegalStateException("Could not send email to: " + to, exception);
        }
    }


    /**
     * Adds the RateMyProfApp logo as an inline email image.
     */
    private void addLogo(MimeMessageHelper helper) throws MessagingException {


        ClassPathResource logo = new ClassPathResource(LOGO_PATH);

        if (!logo.exists()) {
            LOGGER.warn("Email logo could not be found: {}", logo.getPath());

            return;
        }

        helper.addInline(LOGO_CONTENT_ID, logo, "image/png");
    }

    /**
     * Escapes values before inserting them into HTML templates.
     */
    private String escapeHtml(String value) {
        if (value == null || value.isBlank()) {
            return "Unknown";
        }

        return HtmlUtils.htmlEscape(value);
    }
}

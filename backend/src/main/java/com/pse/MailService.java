package com.pse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;


/**
 * Sends emails using the GMX Freemail
 * 
 * Used Postfix
 */
@Service
public class MailService {

    @Autowired
    private JavaMailSender mailSender;


    // Login Mail Configuration
    private final String loginSenderMail = "ratemyprof@gmx.de";

    private final String loginSenderName = "RateMyProfApp";

    private final String formattedLoginEmailSubject = "Your Login Code for RateMyProfApp";

    private final String formattedLoginEmailBody = 
            """
            Hello,

            We received a login request for your RateMyProfApp account.

            Your one-time login code is:


                %s


            This code is valid for 5 minutes and can only be used once.

            If you did not request this code, you can safely ignore this email.

            Best regards,
            The RateMyProfApp Team
            """;



    /**
     * Sends the login Mail with Token.
     */
    public void sendLoginMail(String to, String token) {

        
        String body = formattedLoginEmailBody.formatted(token);

        sendMail(to,loginSenderMail, loginSenderName, formattedLoginEmailSubject, body);
        System.out.println("Sent Mail");
    }
 

    /**
     * Standard Layout for sending an E-Mail.
     */
    public void sendMail(String to, String fromEMail, String sender, String subject, String body){

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);

        message.setSubject(subject);

        message.setFrom("RateMyProfApp <" + loginSenderMail + ">");

        message.setText(body);

        mailSender.send(message);


        System.out.println("Email sent to: " + to);

    }


    public void sendSuccessfulLogin(String email, String ip, String userAgent) {

        //Somebody logged in successfully in your account
        //At Time XY

        //Used Auth token ending with ...
        //If this wasnt you logout all devieces (here)

       
        String subject = "Successful login to your RateMyProfApp account";

        String body = """
            Hello,

            there was a successful login to your RateMyProfApp account.

            Login details:

            IP address:
            %s

            Device:
            %s

            If this was you, no further action is needed.

            If this wasn't you, please log out from all devices immediately
            and request a new login code.

            Best regards,
            The RateMyProfApp Team
            """.formatted(ip, userAgent);

        sendMail(
                email,
                loginSenderMail,
                loginSenderName,
                subject,
                body
        );




    }

}
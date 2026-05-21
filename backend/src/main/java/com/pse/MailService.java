package com.pse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;


/**
 * Sends emails using the Mailserver from KIT. (See https://www.scc.kit.edu/dienste/9916.php)
 * You can enetr any email as sender with format <...>@student.kit.edu
 * WARNING: Do NOT do anything stupid with this power...
 * 
 * Postfix is used to sent Email
 */
@Service
public class MailService {

    @Autowired
    private JavaMailSender mailSender;


    // Login Mail Configuration
    private final String loginSenderMail = "noreply@student.kit.edu";

    private final String loginSenderName = "RateMyProfApp";

    private final String formattedLoginEmailSubject = "Your Login Token for the RateMyProfApp";

    private final String formattedLoginEmailBody = 
            """
            Keep in mind that your login token
            will expire in 5 minutes.

            Your token:
            %s
            """;



    /**
     * Sends the login Mail with Token.
     */
    public void sendLoginMail(String to, String token) {

        
        String body = formattedLoginEmailBody.formatted(token);

        sendMail(to,loginSenderMail, loginSenderName, formattedLoginEmailSubject, body);
       
    }
 

    /**
     * Standard Layout for sending an E-Mail.
     */
    public void sendMail(String to, String fromEMail, String sender, String subject, String body){

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);

        message.setSubject(subject);

        message.setFrom("%s <%s>".formatted(sender, fromEMail));        
        //e.g. message.setFrom("RateMyProfApp <noreply@student.kit.edu>");

        message.setText(body);

        mailSender.send(message);


    }

}
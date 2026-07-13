package com.pse.auth.service;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.pse.shared.enums.IpInfoResponse;
import com.pse.shared.enums.LoginLocation;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;


/**
 * Sends emails using GMX Freemail.
 *
 * Uses HTML emails with an embedded logo.
 */
@Service
public class MailService {

    private final JavaMailSender mailSender;
    private final RestClient ipInfoClient;
    private final String ipInfoToken;



    private final String geoapifyApiKey;

    // Login Mail Configuration
    private final String loginSenderMail = "ratemyprof@gmx.de";
    private final String loginSenderName = "RateMyProfApp";

    private final String formattedLoginEmailSubject =
            "Your Login Code for RateMyProfApp";

    private final String formattedLoginEmailBody =
            """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>RateMyProfApp Login Code</title>
            </head>

            <body style="
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
                font-family: Arial, Helvetica, sans-serif;
                color: #222222;
            ">

                <div style="
                    width: 100%%;
                    padding: 30px 0;
                    background-color: #f4f4f4;
                ">

                    <div style="
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    ">

                        <div style="
                            padding: 25px;
                            text-align: center;
                            border-bottom: 1px solid #eeeeee;
                        ">

                            <img
                                src="cid:rateMyProfLogo"
                                alt="RateMyProfApp Logo"
                                style="
                                    max-width: 120px;
                                    height: auto;
                                    display: inline-block;
                                "
                            >

                        </div>

                        <div style="padding: 35px;">

                            <h1 style="
                                margin-top: 0;
                                margin-bottom: 20px;
                                font-size: 24px;
                                text-align: center;
                                color: #222222;
                            ">
                                Your login code
                            </h1>

                            <p style="
                                margin-bottom: 20px;
                                font-size: 16px;
                                line-height: 1.6;
                            ">
                                Hello,
                            </p>

                            <p style="
                                margin-bottom: 20px;
                                font-size: 16px;
                                line-height: 1.6;
                            ">
                                We received a login request for your
                                RateMyProfApp account.
                            </p>

                            <p style="
                                margin-bottom: 12px;
                                font-size: 16px;
                                line-height: 1.6;
                                text-align: center;
                            ">
                                Your one-time login code is:
                            </p>

                            <div style="
                                margin: 25px 0;
                                padding: 20px;
                                background-color: #f1f3f5;
                                border-radius: 8px;
                                text-align: center;
                                font-size: 32px;
                                font-weight: bold;
                                letter-spacing: 8px;
                                color: #111111;
                            ">
                                %s
                            </div>

                            <p style="
                                margin-bottom: 20px;
                                font-size: 16px;
                                line-height: 1.6;
                            ">
                                This code is valid for 5 minutes and can
                                only be used once.
                            </p>

                            <p style="
                                margin-bottom: 30px;
                                font-size: 16px;
                                line-height: 1.6;
                            ">
                                If you did not request this code, you can
                                safely ignore this email.
                            </p>

                            <p style="
                                margin-bottom: 0;
                                font-size: 16px;
                                line-height: 1.6;
                            ">
                                Best regards,<br>
                                <strong>The RateMyProfApp Team</strong>
                            </p>

                        </div>

                        <div style="
                            padding: 20px;
                            background-color: #f8f9fa;
                            text-align: center;
                            font-size: 12px;
                            color: #777777;
                        ">
                            This is an automatically generated email.
                            Please do not reply.
                        </div>

                    </div>

                </div>

            </body>
            </html>
            """;


    public MailService(
        JavaMailSender mailSender,
        @Value("${ipinfo.token:}") String ipInfoToken,
        @Value("${geoapify.api.key:}") String geoapifyApiKey
) {
    this.mailSender = mailSender;
    this.ipInfoToken = ipInfoToken;
    this.geoapifyApiKey = geoapifyApiKey;

    this.ipInfoClient = RestClient.builder()
            .baseUrl("https://ipinfo.io")
            .build();
}


    /**
     * Sends the login mail with OTP.
     */
    public void sendLoginMail(String to, String otp) {

        String body = formattedLoginEmailBody.formatted(otp);

        sendMail(
                to,
                loginSenderMail,
                loginSenderName,
                formattedLoginEmailSubject,
                body
        );

        System.out.println("Sent login mail to: " + to);
    }


    /**
     * Standard layout for sending an HTML email.
     */
    public void sendMail(
            String to,
            String fromEMail,
            String sender,
            String subject,
            String body
    ) {

        MimeMessage message = mailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    true,
                    StandardCharsets.UTF_8.name()
            );

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom(fromEMail, sender);

            // true means that the body contains HTML
            helper.setText(body, true);

            ClassPathResource logo =
                    new ClassPathResource("static/mail/logo.png");

            if (logo.exists()) {
                helper.addInline(
                        "rateMyProfLogo",
                        logo,
                        "image/png"
                );
            } else {
                System.err.println(
                        "Email logo could not be found: "
                                + logo.getPath()
                );
            }

            mailSender.send(message);

            System.out.println("Email sent to: " + to);

        } catch (
                MessagingException
                | UnsupportedEncodingException exception
        ) {
            throw new IllegalStateException(
                    "Could not send email to: " + to,
                    exception
            );
        }
    }


    /**
     * Warning for the user that somebody logged into their account
     * successfully.
     */
    /**
 * Warning for the user that somebody logged into their account
 * successfully.
 */
public void sendSuccessfulLogin(
        String email,
        String ip,
        String userAgent
) {

    LoginLocation loginLocation = getLoginLocation(ip);

    String subject =
            "Successful login to your RateMyProfApp account";

    String staticMap = createStaticMap(
            loginLocation.mapsUrl(),
            loginLocation.coordinates()
    );

    String body =
            """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                >
                <title>Successful Login</title>
            </head>

            <body style="
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
                font-family: Arial, Helvetica, sans-serif;
                color: #222222;
            ">

                <div style="
                    width: 100%%;
                    padding: 30px 0;
                    background-color: #f4f4f4;
                ">

                    <div style="
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    ">

                        <div style="
                            padding: 25px;
                            text-align: center;
                            border-bottom: 1px solid #eeeeee;
                        ">

                            <img
                                src="cid:rateMyProfLogo"
                                alt="RateMyProfApp Logo"
                                style="
                                    max-width: 120px;
                                    height: auto;
                                    display: inline-block;
                                "
                            >

                        </div>

                        <div style="padding: 35px;">

                            <h1 style="
                                margin-top: 0;
                                margin-bottom: 20px;
                                font-size: 24px;
                                text-align: center;
                                color: #222222;
                            ">
                                Successful login
                            </h1>

                            <p style="
                                margin-bottom: 20px;
                                font-size: 16px;
                                line-height: 1.6;
                            ">
                                Hello,
                            </p>

                            <p style="
                                margin-bottom: 20px;
                                font-size: 16px;
                                line-height: 1.6;
                            ">
                                There was a successful login to your
                                RateMyProfApp account.
                            </p>

                            <div style="
                                margin: 25px 0;
                                padding: 20px;
                                background-color: #f1f3f5;
                                border-radius: 8px;
                            ">

                                <p style="
                                    margin-top: 0;
                                    margin-bottom: 8px;
                                    font-size: 14px;
                                    color: #666666;
                                ">
                                    Approximate location
                                </p>

                                <p style="
                                    margin-top: 0;
                                    margin-bottom: 16px;
                                    font-size: 16px;
                                    font-weight: bold;
                                    overflow-wrap: anywhere;
                                ">
                                    %s
                                </p>

                                %s

                                <p style="
                                    margin-top: 20px;
                                    margin-bottom: 8px;
                                    font-size: 14px;
                                    color: #666666;
                                ">
                                    IP address
                                </p>

                                <p style="
                                    margin-top: 0;
                                    margin-bottom: 20px;
                                    font-size: 16px;
                                    font-weight: bold;
                                    overflow-wrap: anywhere;
                                ">
                                    %s
                                </p>

                                <p style="
                                    margin-top: 0;
                                    margin-bottom: 8px;
                                    font-size: 14px;
                                    color: #666666;
                                ">
                                    Device
                                </p>

                                <p style="
                                    margin-top: 0;
                                    margin-bottom: 0;
                                    font-size: 16px;
                                    font-weight: bold;
                                    overflow-wrap: anywhere;
                                ">
                                    %s
                                </p>

                            </div>

                            <p style="
                                margin-bottom: 20px;
                                font-size: 13px;
                                line-height: 1.5;
                                color: #777777;
                            ">
                                The displayed location is estimated from
                                the IP address and may be inaccurate.
                            </p>

                            <p style="
                                margin-bottom: 20px;
                                font-size: 16px;
                                line-height: 1.6;
                            ">
                                If this was you, no further action is needed.
                            </p>

                            <p style="
                                margin-bottom: 30px;
                                font-size: 16px;
                                line-height: 1.6;
                            ">
                                If this was not you, please log out from all
                                devices immediately and request a new login
                                code.
                            </p>

                            <p style="
                                margin-bottom: 0;
                                font-size: 16px;
                                line-height: 1.6;
                            ">
                                Best regards,<br>
                                <strong>The RateMyProfApp Team</strong>
                            </p>

                        </div>

                        <div style="
                            padding: 20px;
                            background-color: #f8f9fa;
                            text-align: center;
                            font-size: 12px;
                            color: #777777;
                        ">
                            This is an automatically generated email.
                            Please do not reply.
                        </div>

                    </div>

                </div>

            </body>
            </html>
            """.formatted(
                    escapeHtml(loginLocation.description()),
                    staticMap,
                    escapeHtml(ip),
                    escapeHtml(userAgent)
            );

    sendMail(
            email,
            loginSenderMail,
            loginSenderName,
            subject,
            body
    );
}


    /**
     * Escapes values before inserting them into an HTML email.
     */
    private String escapeHtml(String value) {

        if (value == null) {
            return "Unknown";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }


    /**
 * Resolves an approximate location for an IP address.
 */
private LoginLocation getLoginLocation(String rawIp) {

    String ip = normalizeIp(rawIp);

    if (ip == null || ipInfoToken.isBlank() || isPrivateIp(ip)) {
        return new LoginLocation("Unknown", null, null);
    }

    try {
        IpInfoResponse response = ipInfoClient
                .get()
                .uri(uriBuilder -> uriBuilder
                        .path("/{ip}/json")
                        .queryParam("token", ipInfoToken)
                        .build(ip)
                )
                .retrieve()
                .body(IpInfoResponse.class);

        if (response == null) {
            return new LoginLocation("Unknown", null, null);
        }

        String description = createLocationDescription(response);
        String mapsUrl = createMapsUrl(response.loc());

    return new LoginLocation(description, mapsUrl, response.loc());

    } catch (Exception exception) {
        System.err.println(
                "Could not determine location for IP "
                        + ip
                        + ": "
                        + exception.getMessage()
        );

        return new LoginLocation("Unknown", null, null);
    }
}


/**
 * Creates a readable location such as:
 * Karlsruhe, Baden-Württemberg, DE
 */
private String createLocationDescription(IpInfoResponse response) {

    StringBuilder location = new StringBuilder();

    appendLocationPart(location, response.city());
    appendLocationPart(location, response.region());
    appendLocationPart(location, response.country());

    if (location.isEmpty()) {
        return "Unknown";
    }

    return location.toString();
}


/**
 * Adds a non-empty part to the location.
 */
private void appendLocationPart(
        StringBuilder location,
        String value
) {

    if (value == null || value.isBlank()) {
        return;
    }

    if (!location.isEmpty()) {
        location.append(", ");
    }

    location.append(value.trim());
}


/**
 * Creates a Google Maps URL from IPinfo coordinates.
 */
private String createMapsUrl(String coordinates) {

    if (coordinates == null
            || !coordinates.matches(
                    "-?\\d{1,3}(\\.\\d+)?,-?\\d{1,3}(\\.\\d+)?"
            )) {
        return null;
    }

    String encodedCoordinates = URLEncoder.encode(
            coordinates,
            StandardCharsets.UTF_8
    );

    return "https://www.google.com/maps/search/?api=1&query="
            + encodedCoordinates;
}


/**
 * Creates the Google Maps button for the HTML email.
 */
private String createMapsButton(String mapsUrl) {

    if (mapsUrl == null || mapsUrl.isBlank()) {
        return "";
    }

    return """
            <div style="
                margin-top: 5px;
                margin-bottom: 10px;
            ">
                <a
                    href="%s"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                        display: inline-block;
                        padding: 10px 16px;
                        background-color: #1a73e8;
                        color: #ffffff;
                        text-decoration: none;
                        font-size: 14px;
                        font-weight: bold;
                        border-radius: 6px;
                    "
                >
                    View on Google Maps
                </a>
            </div>
            """.formatted(escapeHtml(mapsUrl));
}


/**
 * Handles X-Forwarded-For values containing multiple addresses.
 */
private String normalizeIp(String rawIp) {

    if (rawIp == null || rawIp.isBlank()) {
        return null;
    }

    String ip = rawIp.split(",")[0].trim();

    if (ip.isBlank()) {
        return null;
    }

    return ip;
}


/**
 * Prevents useless lookups for common local addresses.
 */
private boolean isPrivateIp(String ip) {

    return ip.equals("127.0.0.1")
            || ip.equals("::1")
            || ip.startsWith("10.")
            || ip.startsWith("192.168.")
            || ip.startsWith("169.254.")
            || ip.startsWith("172.16.")
            || ip.startsWith("172.17.")
            || ip.startsWith("172.18.")
            || ip.startsWith("172.19.")
            || ip.startsWith("172.2")
            || ip.startsWith("172.30.")
            || ip.startsWith("172.31.");
}


private String createStaticMapUrl(String coordinates) {

    if (coordinates == null
            || coordinates.isBlank()
            || geoapifyApiKey == null
            || geoapifyApiKey.isBlank()) {
        return null;
    }

    String[] parts = coordinates.split(",");

    if (parts.length != 2) {
        return null;
    }

    // IPInfo liefert latitude,longitude
    String latitude = parts[0].trim();
    String longitude = parts[1].trim();

    return "https://maps.geoapify.com/v1/staticmap"
            + "?style=osm-bright"
            + "&width=520"
            + "&height=280"
            + "&center=lonlat:"
            + longitude + "," + latitude
            + "&zoom=9"
            + "&marker=lonlat:"
            + longitude + "," + latitude
            + ";type:awesome;color:%23d32f2f"
            + "&apiKey="
            + URLEncoder.encode(
                    geoapifyApiKey,
                    StandardCharsets.UTF_8
            );
}


private String createStaticMap(
        String mapsUrl,
        String coordinates
) {

    String imageUrl = createStaticMapUrl(coordinates);

    if (imageUrl == null) {
        return createMapsButton(mapsUrl);
    }

    return """
        <div style="
            margin-top:15px;
            margin-bottom:15px;
            text-align:center;
        ">
            <a href="%s" target="_blank">

                <img
                    src="%s"
                    alt="Approximate login location"
                    width="520"
                    style="
                        width:100%%;
                        max-width:520px;
                        border-radius:8px;
                        border:1px solid #dddddd;
                        display:block;
                    "
                >

            </a>

            <p style="
                margin-top:6px;
                font-size:11px;
                color:#888888;
            ">
                © OpenStreetMap contributors
            </p>

        </div>
        """.formatted(
                escapeHtml(mapsUrl),
                escapeHtml(imageUrl)
        );
}

}
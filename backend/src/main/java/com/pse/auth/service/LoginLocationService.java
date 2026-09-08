package com.pse.auth.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import jakarta.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import com.pse.auth.location.IpInfoResponse;
import com.pse.auth.location.LoginLocation;
import com.pse.shared.util.Html;


@Service
public class LoginLocationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(LoginLocationService.class);

    private final RestClient ipInfoClient;
    private final String ipInfoToken;
    private final String geoapifyApiKey;

    public LoginLocationService(
            RestClient ipInfoRestClient,
            @Value("${ipinfo.token:}") String ipInfoToken,
            @Value("${geoapify.api.key:}") String geoapifyApiKey
    ) {
        this.ipInfoClient = ipInfoRestClient;
        this.ipInfoToken = ipInfoToken;
        this.geoapifyApiKey = geoapifyApiKey;
    }

    /**
     * Warns once at startup when no IPinfo token is configured. Without this the short
     * circuit in {@link #getLoginLocation} is silent, so an unset IPINFO_TOKEN turns every
     * lookup into "Unknown" and leaves nothing in the log to say why.
     */
    @PostConstruct
    void warnIfTokenMissing() {
        if (ipInfoToken.isBlank()) {
            LOGGER.warn("IPINFO_TOKEN is not set; every login location will resolve to Unknown");
        }
    }

    /**
     * Resolves an approximate location for an IP address.
     */
    public LoginLocation getLoginLocation(String rawIp) {

        LOGGER.info("Trying to determine location. rawIp={}", rawIp);

        String ip = normalizeIp(rawIp);

        if (ip == null || ipInfoToken.isBlank()) {
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

        } catch (RestClientResponseException exception) {
            // F-8: told apart from the two below on purpose. A 401 or 403 means the token is
            // there but no longer works -- the case the startup warning cannot catch, because
            // the token was fine when the application booted -- and a 429 means the quota ran
            // out. All three used to arrive as the same anonymous "could not determine".
            LOGGER.warn("IPinfo refused the lookup for IP {} with {}; "
                            + "the token may be revoked or out of quota",
                    ip, exception.getStatusCode(), exception);

            return new LoginLocation("Unknown", null, null);

        } catch (ResourceAccessException exception) {
            LOGGER.warn("IPinfo was unreachable for IP {} -- network or timeout", ip, exception);

            return new LoginLocation("Unknown", null, null);

        } catch (Exception exception) {
            LOGGER.warn("Could not determine location for IP {}", ip, exception);

            return new LoginLocation("Unknown", null, null);
        }
    }

    /**
     * Whether a location can be resolved at all. Reported through {@code GET /system/status}
     * so an operator can see that lookups are off rather than inferring it from every login
     * mail saying "Unknown" -- F-8. The startup warning covers a token that was missing at
     * boot; this covers the whole life of the process.
     */
    public boolean isConfigured() {
        return !ipInfoToken.isBlank();
    }

    /**
     * Creates HTML containing either a static map or a Maps button.
     */
    public String createStaticMap(String mapsUrl, String coordinates) {


        String imageUrl = createStaticMapUrl(coordinates);

        if (imageUrl == null) {
            return createMapsButton(mapsUrl);
        }

        String safeMapsUrl = Html.escape(mapsUrl, "");
        String safeImageUrl = Html.escape(imageUrl, "");

        return """
                <div style="
                    margin-top: 15px;
                    margin-bottom: 15px;
                    text-align: center;
                ">
                    <a
                        href="%s"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img
                            src="%s"
                            alt="Approximate login location"
                            width="520"
                            style="
                                width: 100%%;
                                max-width: 520px;
                                border-radius: 8px;
                                border: 1px solid #dddddd;
                                display: block;
                            "
                        >
                    </a>

                    <p style="
                        margin-top: 6px;
                        font-size: 11px;
                        color: #888888;
                    ">
                        © OpenStreetMap contributors
                    </p>
                </div>
                """.formatted(
                safeMapsUrl,
                safeImageUrl
        );
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
     * Adds a non-empty value to the location description.
     */
    private void appendLocationPart(StringBuilder location, String value) {

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

        if (!isValidCoordinates(coordinates)) {
            return null;
        }

        String encodedCoordinates = URLEncoder.encode(
                coordinates,
                StandardCharsets.UTF_8
        );

        return "https://www.google.com/maps/search/"
                + "?api=1&query="
                + encodedCoordinates;
    }

    /**
     * Creates a Geoapify static map URL.
     */
    private String createStaticMapUrl(String coordinates) {

        if (!isValidCoordinates(coordinates) || geoapifyApiKey == null || geoapifyApiKey.isBlank()) {
            return null;
        }

        String[] parts = coordinates.split(",");

        String latitude = parts[0].trim();
        String longitude = parts[1].trim();

        return "https://maps.geoapify.com/v1/staticmap"
                + "?style=osm-bright"
                + "&width=520"
                + "&height=280"
                + "&center=lonlat:"
                + longitude
                + ","
                + latitude
                + "&zoom=9"
                + "&marker=lonlat:"
                + longitude
                + ","
                + latitude
                + ";type:awesome;color:%23d32f2f"
                + "&apiKey="
                + URLEncoder.encode(
                geoapifyApiKey,
                StandardCharsets.UTF_8
        );
    }

    /**
     * Creates a Google Maps button when no static map is available.
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
                """.formatted(Html.escape(mapsUrl, ""));
    }

    /**
     * Problem rawIp = X-Forwarded-For: "203.0.113.42, 10.0.0.5"
     *
     * Handles X-Forwarded-For values containing multiple addresses.
     */
    private String normalizeIp(String rawIp) {

        if (rawIp == null || rawIp.isBlank()) {
            return null;
        }

        String ip = rawIp.split(",", -1)[0].trim();

        if (ip.isBlank()) {
            return null;
        }

        return ip;
    }

    /**
     * Validates coordinates in latitude,longitude format.
     */
    private boolean isValidCoordinates(String coordinates) {

        if (coordinates == null || coordinates.isBlank()) {
            return false;
        }

        return coordinates.matches("-?\\d{1,3}(\\.\\d+)?,-?\\d{1,3}(\\.\\d+)?");
    }

}
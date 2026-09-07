package com.pse.auth.service;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.pse.shared.enums.IpInfoResponse;
import com.pse.shared.enums.LoginLocation;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.DefaultUriBuilderFactory;
import org.springframework.web.util.UriBuilder;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.function.Function;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * The reported symptom is that the approximate location "stopped working", and the shape of
 * this class is why that is hard to see: every way the lookup can fail collapses into the
 * same {@code LoginLocation("Unknown", null, null)}.
 *
 * <p>These tests pin each cause separately and assert what is logged, because that turns out
 * to be the only thing distinguishing them. Two paths reach the same value: the HTTP failures
 * log a WARN with the cause, while the blank-token short circuit stays silent per request --
 * that one is announced once at startup by {@code warnIfTokenMissing} instead.
 *
 * <p>There is no second geolocation provider. Geoapify only renders the static map image, so
 * the fallback chain is exactly one step long.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LoginLocationServiceTests {

    private static final String TOKEN = "ipinfo-token";
    private static final String GEOAPIFY_KEY = "geoapify-key";
    private static final String IP = "203.0.113.42";
    private static final LoginLocation UNKNOWN = new LoginLocation("Unknown", null, null);

    @Mock
    private RestClient restClient;

    @Mock
    @SuppressWarnings("rawtypes")
    private RestClient.RequestHeadersUriSpec uriSpec;

    @Mock
    private RestClient.RequestHeadersSpec<?> headersSpec;

    @Mock
    private RestClient.ResponseSpec responseSpec;

    private ListAppender<ILoggingEvent> logs;
    private Logger serviceLogger;

    @BeforeEach
    void attachLogAppender() {
        logs = new ListAppender<>();
        logs.start();
        serviceLogger = (Logger) LoggerFactory.getLogger(LoginLocationService.class);
        serviceLogger.addAppender(logs);
    }

    @AfterEach
    void detachLogAppender() {
        serviceLogger.detachAppender(logs);
    }

    private LoginLocationService serviceWith(String token, String geoapifyKey) {
        return new LoginLocationService(restClient, token, geoapifyKey);
    }

    @SuppressWarnings("unchecked")
    private void ipInfoReturns(IpInfoResponse response) {
        when(restClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(any(Function.class))).thenReturn(headersSpec);
        when(headersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(IpInfoResponse.class)).thenReturn(response);
    }

    @SuppressWarnings("unchecked")
    private void ipInfoFailsWith(RuntimeException failure) {
        when(restClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(any(Function.class))).thenReturn(headersSpec);
        when(headersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(IpInfoResponse.class)).thenThrow(failure);
    }

    private static IpInfoResponse karlsruhe() {
        return new IpInfoResponse(IP, "Karlsruhe", "Baden-Wurttemberg", "DE", "49.0069,8.4037");
    }

    private void assertWarnLogged() {
        assertThat(logs.list)
                .as("the swallowed cause has to survive as a log line")
                .anySatisfy(event -> {
                    assertThat(event.getLevel()).isEqualTo(Level.WARN);
                    assertThat(event.getFormattedMessage()).contains("Could not determine location");
                });
    }


    @Test
    void getLoginLocation_completeResponse_buildsTheFullDescriptionAndMapsUrl() {
        // Given
        ipInfoReturns(karlsruhe());

        // When
        LoginLocation location = serviceWith(TOKEN, GEOAPIFY_KEY).getLoginLocation(IP);

        // Then
        assertThat(location.description()).isEqualTo("Karlsruhe, Baden-Wurttemberg, DE");
        assertThat(location.coordinates()).isEqualTo("49.0069,8.4037");
        assertThat(location.mapsUrl())
                .isEqualTo("https://www.google.com/maps/search/?api=1&query=49.0069%2C8.4037");
    }

    /** X-Forwarded-For is a list and the client is the first entry; the rest are proxies. */
    @Test
    @SuppressWarnings("unchecked")
    void getLoginLocation_forwardedForList_looksUpOnlyTheFirstAddress() {
        // Given
        ipInfoReturns(karlsruhe());

        // When
        serviceWith(TOKEN, GEOAPIFY_KEY).getLoginLocation("203.0.113.42, 10.0.0.5");

        // Then -- resolve the captured builder to see the URI that would actually be requested
        ArgumentCaptor<Function<UriBuilder, URI>> uriFunction = ArgumentCaptor.captor();
        verify(uriSpec).uri(uriFunction.capture());
        URI requested = uriFunction.getValue()
                .apply(new DefaultUriBuilderFactory("https://ipinfo.io").builder());
        assertThat(requested.getPath()).isEqualTo("/203.0.113.42/json");
        assertThat(requested.getQuery()).isEqualTo("token=" + TOKEN);
    }

    @Test
    void getLoginLocation_responseWithOnlyACity_usesJustThatCity() {
        // Given
        ipInfoReturns(new IpInfoResponse(IP, "Karlsruhe", null, null, null));

        // When
        LoginLocation location = serviceWith(TOKEN, GEOAPIFY_KEY).getLoginLocation(IP);

        // Then
        assertThat(location.description()).isEqualTo("Karlsruhe");
    }

    @Test
    void getLoginLocation_responseWithABlankRegion_doesNotEmitADoubleComma() {
        // Given
        ipInfoReturns(new IpInfoResponse(IP, "Karlsruhe", "   ", "DE", null));

        // When
        LoginLocation location = serviceWith(TOKEN, GEOAPIFY_KEY).getLoginLocation(IP);

        // Then
        assertThat(location.description()).isEqualTo("Karlsruhe, DE");
    }

    // ---------- getLoginLocation: the paths that never reach the network ----------

    @ParameterizedTest
    @CsvSource({"''", "'   '", "', 10.0.0.5'", "'  , 10.0.0.5'"})
    void getLoginLocation_addressThatNormalizesToNothing_returnsUnknownWithoutCallingIpInfo(
            String rawIp) {
        // When
        LoginLocation location = serviceWith(TOKEN, GEOAPIFY_KEY).getLoginLocation(rawIp);

        // Then
        assertThat(location).isEqualTo(UNKNOWN);
        verifyNoInteractions(restClient);
    }

    /**
     * Kept separate from the case above because it is the one that used to crash.
     * {@code ",".split(",")} is an empty array -- Java drops trailing empty strings, and here
     * every element is empty -- so {@code [0]} threw, before the try block and therefore
     * outside the blanket catch, all the way out into the AFTER_COMMIT mail listener. The
     * negative limit in {@code split(",", -1)} keeps the empty parts, so the value reaching
     * the blank check is {@code ""} and this is now just another address that resolves to
     * nothing.
     */
    @ParameterizedTest
    @CsvSource({"','", "',,'", "',,,'"})
    void getLoginLocation_addressOfOnlyCommas_returnsUnknownWithoutCallingIpInfo(String rawIp) {
        // When
        LoginLocation location = serviceWith(TOKEN, GEOAPIFY_KEY).getLoginLocation(rawIp);

        // Then
        assertThat(location).isEqualTo(UNKNOWN);
        verifyNoInteractions(restClient);
    }

    @Test
    void getLoginLocation_nullAddress_returnsUnknownWithoutCallingIpInfo() {
        // When
        LoginLocation location = serviceWith(TOKEN, GEOAPIFY_KEY).getLoginLocation(null);

        // Then
        assertThat(location).isEqualTo(UNKNOWN);
        verifyNoInteractions(restClient);
    }

    /**
     * The suspected production cause. IPINFO_TOKEN defaults to empty, so an unset environment
     * variable turns every lookup into "Unknown" before any request is made. The request path
     * stays silent by design; the trace is the startup warning pinned in the next section.
     */
    @Test
    void getLoginLocation_blankToken_returnsUnknownWithoutCallingIpInfo() {
        // When
        LoginLocation location = serviceWith("", GEOAPIFY_KEY).getLoginLocation(IP);

        // Then
        assertThat(location).isEqualTo(UNKNOWN);
        verifyNoInteractions(restClient);

        assertLookupAttemptLogged(IP);
    }



    @Test
    void getLoginLocation_nullToken_throwsNullPointerException() {
        // Given -- @Value defaults to "", so null only happens if the wiring is wrong
        LoginLocationService service = serviceWith(null, GEOAPIFY_KEY);

        // When / Then
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.getLoginLocation(IP))
                .isInstanceOf(NullPointerException.class);
    }

    // ---------- warnIfTokenMissing: the startup counterpart ----------

    /**
     * Without this the blank-token path above leaves no trace anywhere, which is what made an
     * unset IPINFO_TOKEN the hardest of these failures to see in production.
     */
    @ParameterizedTest
    @CsvSource({"''", "'   '"})
    void warnIfTokenMissing_blankToken_logsAWarningNamingTheVariable(String token) {
        // When
        serviceWith(token, GEOAPIFY_KEY).warnIfTokenMissing();

        // Then
        assertThat(logs.list)
                .as("an unset token has to be visible in the log at least once")
                .anySatisfy(event -> {
                    assertThat(event.getLevel()).isEqualTo(Level.WARN);
                    assertThat(event.getFormattedMessage()).contains("IPINFO_TOKEN");
                });
    }

    @Test
    void warnIfTokenMissing_tokenPresent_logsNothing() {
        // When
        serviceWith(TOKEN, GEOAPIFY_KEY).warnIfTokenMissing();

        // Then
        assertThat(logs.list).isEmpty();
    }

    // ---------- getLoginLocation: every way the lookup fails ----------

    @Test
    void getLoginLocation_unauthorizedFromIpInfo_returnsUnknownAndLogsTheCause() {
        // Given -- an invalid or revoked token
        ipInfoFailsWith(HttpClientErrorException.create(
                HttpStatus.UNAUTHORIZED, "Unauthorized", null, null, null));

        // When
        LoginLocation location = serviceWith(TOKEN, GEOAPIFY_KEY).getLoginLocation(IP);

        // Then
        assertThat(location).isEqualTo(UNKNOWN);
        assertWarnLogged();
    }

    @Test
    void getLoginLocation_forbiddenFromIpInfo_returnsUnknownAndLogsTheCause() {
        // Given
        ipInfoFailsWith(HttpClientErrorException.create(
                HttpStatus.FORBIDDEN, "Forbidden", null, null, null));

        // When
        LoginLocation location = serviceWith(TOKEN, GEOAPIFY_KEY).getLoginLocation(IP);

        // Then
        assertThat(location).isEqualTo(UNKNOWN);
        assertWarnLogged();
    }

    @Test
    void getLoginLocation_rateLimitedByIpInfo_returnsUnknownAndLogsTheCause() {
        // Given -- the free tier quota is exhausted
        ipInfoFailsWith(HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", null, null, null));

        // When
        LoginLocation location = serviceWith(TOKEN, GEOAPIFY_KEY).getLoginLocation(IP);

        // Then
        assertThat(location).isEqualTo(UNKNOWN);
        assertWarnLogged();
    }

    @Test
    void getLoginLocation_serverErrorFromIpInfo_returnsUnknownAndLogsTheCause() {
        // Given
        ipInfoFailsWith(HttpServerErrorException.create(
                HttpStatus.INTERNAL_SERVER_ERROR, "Server Error", null, null, null));

        // When
        LoginLocation location = serviceWith(TOKEN, GEOAPIFY_KEY).getLoginLocation(IP);

        // Then
        assertThat(location).isEqualTo(UNKNOWN);
        assertWarnLogged();
    }

    @Test
    void getLoginLocation_requestTimesOut_returnsUnknownAndLogsTheCause() {
        // Given
        ipInfoFailsWith(new ResourceAccessException(
                "I/O error", new SocketTimeoutException("Read timed out")));

        // When
        LoginLocation location = serviceWith(TOKEN, GEOAPIFY_KEY).getLoginLocation(IP);

        // Then
        assertThat(location).isEqualTo(UNKNOWN);
        assertWarnLogged();
    }

    @Test
    void getLoginLocation_hostCannotBeResolved_returnsUnknownAndLogsTheCause() {
        // Given
        ipInfoFailsWith(new ResourceAccessException(
                "I/O error", (IOException) new UnknownHostException("ipinfo.io")));

        // When
        LoginLocation location = serviceWith(TOKEN, GEOAPIFY_KEY).getLoginLocation(IP);

        // Then
        assertThat(location).isEqualTo(UNKNOWN);
        assertWarnLogged();
    }

    @Test
    void getLoginLocation_bodyThatCannotBeDeserialized_returnsUnknownAndLogsTheCause() {
        // Given
        ipInfoFailsWith(new RestClientException("Could not read JSON"));

        // When
        LoginLocation location = serviceWith(TOKEN, GEOAPIFY_KEY).getLoginLocation(IP);

        // Then
        assertThat(location).isEqualTo(UNKNOWN);
        assertWarnLogged();
    }


    @Test
    void getLoginLocation_nullResponseBody_returnsUnknownAndLogsAttempt() {
        // Given
        ipInfoReturns(null);

        // When
        LoginLocation location = serviceWith(TOKEN, GEOAPIFY_KEY)
                .getLoginLocation(IP);

        // Then
        assertThat(location).isEqualTo(UNKNOWN);

        assertLookupAttemptLogged(IP);
    }

    /**
     * A private or reserved address answers 200 with every field null. That is a successful
     * lookup of nothing, so it takes the description path rather than the catch.
     */
    @Test
    void getLoginLocation_bogonAddressWithAnEmptyBody_returnsUnknownAndLogsAttempt() {
        // Given
        ipInfoReturns(new IpInfoResponse(null, null, null, null, null));

        // When
        LoginLocation location = serviceWith(TOKEN, GEOAPIFY_KEY)
                .getLoginLocation("10.0.0.5");

        // Then
        assertThat(location).isEqualTo(UNKNOWN);

        assertLookupAttemptLogged("10.0.0.5");
    }

    @Test
    void getLoginLocation_coordinatesThatCannotBeParsed_keepsTheDescriptionButDropsTheMapsUrl() {
        // Given
        ipInfoReturns(new IpInfoResponse(IP, "Karlsruhe", null, "DE", "not-coordinates"));

        // When
        LoginLocation location = serviceWith(TOKEN, GEOAPIFY_KEY).getLoginLocation(IP);

        // Then
        assertThat(location.description()).isEqualTo("Karlsruhe, DE");
        assertThat(location.mapsUrl()).isNull();
        assertThat(location.coordinates()).isEqualTo("not-coordinates");
    }

    // ---------- createStaticMap ----------

    @Test
    void createStaticMap_validCoordinatesAndAKey_rendersTheStaticImage() {
        // When
        String html = serviceWith(TOKEN, GEOAPIFY_KEY)
                .createStaticMap("https://maps.example/x", "49.0069,8.4037");

        // Then -- Geoapify takes lonlat, so the pair is emitted the other way round
        assertThat(html).contains("<img");
        assertThat(html).contains("center=lonlat:8.4037,49.0069");
        assertThat(html).contains("marker=lonlat:8.4037,49.0069");
        assertThat(html).contains("apiKey=" + GEOAPIFY_KEY);
    }

    @Test
    void createStaticMap_blankGeoapifyKey_fallsBackToTheMapsButton() {
        // When
        String html = serviceWith(TOKEN, "")
                .createStaticMap("https://maps.example/x", "49.0069,8.4037");

        // Then
        assertThat(html).doesNotContain("<img").contains("View on Google Maps");
    }

    @ParameterizedTest
    @CsvSource({
            "'49.0069,8.4037',true",
            "'-33.8,151.2',true",
            "'0,0',true",
            "'49.0, 8.4',false",
            "'not-coordinates',false",
            "'1000.0,1.0',false",
            "'49.0',false",
            "'',false"
    })
    void createStaticMap_coordinateFormat_decidesBetweenImageAndButton(
            String coordinates, boolean rendersImage) {
        // When
        String html = serviceWith(TOKEN, GEOAPIFY_KEY)
                .createStaticMap("https://maps.example/x", coordinates);

        // Then -- the regex rejects whitespace around the comma, which a real client may send
        assertThat(html.contains("<img")).isEqualTo(rendersImage);
    }

    @Test
    void createStaticMap_noCoordinatesAndNoMapsUrl_rendersNothing() {
        // When
        String html = serviceWith(TOKEN, GEOAPIFY_KEY).createStaticMap(null, null);

        // Then -- the mail template must not gain an empty box
        assertThat(html).isEmpty();
    }

    @Test
    void createStaticMap_mapsUrlContainingMarkup_escapesItIntoTheHtml() {
        // Given -- the value is interpolated straight into an href
        String hostile = "https://maps.example/?a=1&b=\"><script>alert(1)</script>";

        // When
        String html = serviceWith(TOKEN, GEOAPIFY_KEY).createStaticMap(hostile, null);

        // Then
        assertThat(html).doesNotContain("<script>").contains("&lt;script&gt;").contains("&amp;");
    }


    private void assertLookupAttemptLogged(String rawIp) {
        assertThat(logs.list)
                .anySatisfy(event -> {
                    assertThat(event.getLevel()).isEqualTo(Level.INFO);
                    assertThat(event.getFormattedMessage())
                            .contains("Trying to determine location")
                            .contains("rawIp=" + rawIp);
                });
    }
}

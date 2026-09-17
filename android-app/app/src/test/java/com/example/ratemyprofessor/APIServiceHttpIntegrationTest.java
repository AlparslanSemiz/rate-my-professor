package com.example.ratemyprofessor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.example.ratemyprofessor.domain.Comment;
import com.example.ratemyprofessor.domain.RatingCategory;
import com.example.ratemyprofessor.domain.SemesterSeason;
import com.example.ratemyprofessor.servercommunication.APIService;
import com.example.ratemyprofessor.servercommunication.responses.CommentsResponse;
import com.example.ratemyprofessor.servercommunication.responses.LecturesResponse;
import com.example.ratemyprofessor.servercommunication.requests.LoginRequest;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorsResponse;
import com.example.ratemyprofessor.servercommunication.responses.RatingAverageResponse;
import com.example.ratemyprofessor.servercommunication.responses.ServerResponse;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonDeserializer;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

/**
 * tests the parsing of responses from the server by the retrofit and domain model.
 */
@RunWith(RobolectricTestRunner.class)
public class APIServiceHttpIntegrationTest {
    private MockWebServer server;
    private APIService apiService;

    /**
     * Initializes the fixtures required by each test.
     *
     * @throws IOException if the operation cannot complete
     */
    @Before
    public void setUp() throws IOException {
        server = new MockWebServer();
        server.start();

        Gson gson = new GsonBuilder()
                .registerTypeAdapter(LocalDateTime.class, (JsonDeserializer<LocalDateTime>) (json, typeOfT, context) ->
                        LocalDateTime.parse(json.getAsString(), DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .create();

        apiService = new Retrofit.Builder()
                .baseUrl(server.url("/"))
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build()
                .create(APIService.class);
    }

    /**
     * Releases the resources created for each test.
     *
     * @throws IOException if the operation cannot complete
     */
    @After
    public void tearDown() throws IOException {
        server.shutdown();
    }

    /**
     * Verifies that request login sends JSON body and parses server response.
     *
     * @throws Exception if the operation cannot complete
     */
    @Test
    public void requestLoginSendsJsonBodyAndParsesServerResponse() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("{\"message\":\"token sent\",\"success\":true}"));

        Response<ServerResponse> response = apiService
                .requestLogin(new LoginRequest("student@kit.edu", ""))
                .execute();

        RecordedRequest request = server.takeRequest();

        assertTrue(response.isSuccessful());
        assertNotNull(response.body());
        assertEquals("token sent", response.body().message());
        assertTrue(response.body().success());
        assertEquals("POST", request.getMethod());
        assertEquals("/auth/request-login", request.getPath());
    }

    /**
     * Verifies that login sends token and parses rejected response.
     *
     * @throws Exception if the operation cannot complete
     */
    @Test
    public void loginSendsTokenAndParsesRejectedResponse() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("{\"message\":\"invalid token\",\"success\":false}"));

        Response<ServerResponse> response = apiService
                .login(new LoginRequest("student@kit.edu", "123456"))
                .execute();

        assertTrue(response.isSuccessful());
        assertNotNull(response.body());
        assertFalse(response.body().success());
    }

    /**
     * Verifies that get professors parses professor list from JSON.
     *
     * @throws Exception if the operation cannot complete
     */
    @Test
    public void getProfessorsParsesProfessorListFromJson() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("{\"message\":\"ok\",\"success\":true,\"professors\":"
                        + "[{\"id\":\"prof-1\",\"firstName\":\"Ada\",\"lastName\":\"Lovelace\","
                        + "\"averageRating\":4.5,\"ratingCount\":12}]}"));

        Response<ProfessorsResponse> response = apiService.getProfessors().execute();

        assertTrue(response.isSuccessful());
        assertNotNull(response.body());
        assertEquals(1, response.body().professors().size());
        assertEquals("Ada", response.body().professors().get(0).firstName);
    }

    /**
     * Verifies that get lectures parses lecture list from JSON.
     *
     * @throws Exception if the operation cannot complete
     */
    @Test
    public void getLecturesParsesLectureListFromJson() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("{\"message\":\"ok\",\"success\":true,\"lectures\":"
                        + "[{\"id\":\"lecture-1\",\"name\":\"Algorithms\",\"code\":\"240001\","
                        + "\"semesterYear\":2026,\"semesterSeason\":\"WS\",\"active\":true,"
                        + "\"professorId\":\"prof-1\",\"commentCount\":3,\"ratingCount\":4,"
                        + "\"averageRating\":4.5}]}"));

        Response<LecturesResponse> response = apiService.getLectures().execute();

        assertTrue(response.isSuccessful());
        assertNotNull(response.body());
        assertEquals(1, response.body().lectures().size());
        assertEquals("Algorithms", response.body().lectures().get(0).name());
        assertEquals(SemesterSeason.WS, response.body().lectures().get(0).semesterSeason());
    }

    /**
     * Verifies that get comments parses comments with date.
     *
     * @throws Exception if the operation cannot complete
     */
    @Test
    public void getCommentsParsesCommentsWithDate() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("{\"message\":\"Found\",\"success\":true,\"comments\":["
                        + "{\"content\":\"Test content\",\"status\":\"VISIBLE\",\"studentUsername\":\"user1\","
                        + "\"lectureID\":\"l1\",\"createdAt\":\"2026-07-08T15:49:58.217\",\"answers\":[]}]}"));

        Response<CommentsResponse> response = apiService.getComments("", "l1").execute();

        assertTrue(response.isSuccessful());
        assertNotNull(response.body());
        assertEquals(1, response.body().comments().size());
        Comment comment = response.body().comments().get(0);
        assertEquals("Test content", comment.content());
        assertNotNull(comment.createdAt());
        assertEquals(2026, comment.createdAt().getYear());
    }

    /**
     * Verifies that get ratings parses average ratings.
     *
     * @throws Exception if the operation cannot complete
     */
    @Test
    public void getRatingsParsesAverageRatings() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("""
                {
                  "message":"ok",
                  "success":true,
                  "ratings":[
                    {
                      "category":"LECTURE_UNDERSTANDABILITY",
                      "value":4.5
                    }
                  ]
                }
                """));

        Response<RatingAverageResponse> response = apiService.getRatings("l1").execute();

        assertTrue(response.isSuccessful());
        assertNotNull(response.body());
        assertTrue(response.body().success());
        assertEquals(1, response.body().ratings().size());
        assertEquals(
                RatingCategory.LECTURE_UNDERSTANDABILITY,
                response.body().ratings().get(0).category()
        );
        assertEquals(4.5, response.body().ratings().get(0).value(), 0.001);
    }
}

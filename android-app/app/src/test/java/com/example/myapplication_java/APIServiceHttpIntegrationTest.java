package com.example.myapplication_java;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.LoginRequest;
import com.example.myapplication_java.ServerCommunication.ServerResponse;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.IOException;
import java.util.List;

import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import mockwebserver3.RecordedRequest;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class APIServiceHttpIntegrationTest {
    private MockWebServer server;
    private APIService apiService;

    @Before
    public void setUp() throws IOException {
        server = new MockWebServer();
        server.start();
        apiService = new Retrofit.Builder()
                .baseUrl(server.url("/"))
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(APIService.class);
    }

    @After
    public void tearDown() throws IOException {
        server.close();
    }

    @Test
    public void requestLoginSendsJsonBodyAndParsesServerResponse() throws Exception {
        server.enqueue(new MockResponse.Builder()
                .code(200)
                .body("{\"message\":\"token sent\",\"success\":true}")
                .build());

        Response<ServerResponse> response = apiService
                .requestLogin(new LoginRequest("student@kit.edu", ""))
                .execute();

        RecordedRequest request = server.takeRequest();

        assertTrue(response.isSuccessful());
        assertNotNull(response.body());
        assertEquals("token sent", response.body().message);
        assertTrue(response.body().success);
        assertEquals("POST", request.getMethod());
        assertEquals("/auth/request-login", request.getUrl().encodedPath());
        String requestBody = request.getBody().utf8();
        assertTrue(requestBody.contains("\"email\":\"student@kit.edu\""));
        assertTrue(requestBody.contains("\"loginToken\":\"\""));
    }

    @Test
    public void loginSendsTokenAndParsesRejectedResponse() throws Exception {
        server.enqueue(new MockResponse.Builder()
                .code(200)
                .body("{\"message\":\"invalid token\",\"success\":false}")
                .build());

        Response<ServerResponse> response = apiService
                .login(new LoginRequest("student@kit.edu", "123456"))
                .execute();

        RecordedRequest request = server.takeRequest();

        assertTrue(response.isSuccessful());
        assertNotNull(response.body());
        assertEquals("invalid token", response.body().message);
        assertFalse(response.body().success);
        assertEquals("POST", request.getMethod());
        assertEquals("/auth/login", request.getUrl().encodedPath());
        String requestBody = request.getBody().utf8();
        assertTrue(requestBody.contains("\"email\":\"student@kit.edu\""));
        assertTrue(requestBody.contains("\"loginToken\":\"123456\""));
    }

    @Test
    public void getProfessorsParsesProfessorListFromJson() throws Exception {
        server.enqueue(new MockResponse.Builder()
                .code(200)
                .body("[{\"id\":\"prof-1\",\"firstName\":\"Ada\",\"lastName\":\"Lovelace\","
                        + "\"department\":\"Informatik\",\"averageRating\":4.5}]")
                .build());

        Response<List<Professor>> response = apiService.getProfessors().execute();

        RecordedRequest request = server.takeRequest();

        assertTrue(response.isSuccessful());
        assertNotNull(response.body());
        assertEquals("GET", request.getMethod());
        assertEquals("/data/professor", request.getUrl().encodedPath());
        assertEquals(1, response.body().size());
        Professor professor = response.body().get(0);
        assertEquals("prof-1", professor.id);
        assertEquals("Ada", professor.firstName);
        assertEquals("Lovelace", professor.lastName);
        assertEquals("Informatik", professor.department);
        assertEquals(4.5f, professor.averageRating, 0.001f);
    }

    @Test
    public void getLecturesParsesLectureListFromJson() throws Exception {
        server.enqueue(new MockResponse.Builder()
                .code(200)
                .body("[{\"id\":\"lecture-1\",\"name\":\"Algorithms\",\"code\":\"240001\"}]")
                .build());

        Response<List<Lecture>> response = apiService.getLectures().execute();

        RecordedRequest request = server.takeRequest();

        assertTrue(response.isSuccessful());
        assertNotNull(response.body());
        assertEquals("GET", request.getMethod());
        assertEquals("/data/lectures", request.getUrl().encodedPath());
        assertEquals(1, response.body().size());
        Lecture lecture = response.body().get(0);
        assertEquals("lecture-1", lecture.id);
        assertEquals("Algorithms", lecture.name);
        assertEquals("240001", lecture.code);
    }
}

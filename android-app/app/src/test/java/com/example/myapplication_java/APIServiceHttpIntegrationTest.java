package com.example.myapplication_java;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.DomainModel.SemesterSeason;
import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.LecturesResponse;
import com.example.myapplication_java.ServerCommunication.LoginRequest;
import com.example.myapplication_java.ServerCommunication.ProfessorResponse;
import com.example.myapplication_java.ServerCommunication.ServerResponse;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.IOException;
import java.util.List;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
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
        server.shutdown();
    }

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
        assertEquals("token sent", response.body().message);
        assertTrue(response.body().success);
        assertEquals("POST", request.getMethod());
        assertEquals("/auth/request-login", request.getPath());
        String requestBody = request.getBody().readUtf8();
        assertTrue(requestBody.contains("\"email\":\"student@kit.edu\""));
        assertTrue(requestBody.contains("\"loginToken\":\"\""));
    }

    @Test
    public void loginSendsTokenAndParsesRejectedResponse() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("{\"message\":\"invalid token\",\"success\":false}"));

        Response<ServerResponse> response = apiService
                .login(new LoginRequest("student@kit.edu", "123456"))
                .execute();

        RecordedRequest request = server.takeRequest();

        assertTrue(response.isSuccessful());
        assertNotNull(response.body());
        assertEquals("invalid token", response.body().message);
        assertFalse(response.body().success);
        assertEquals("POST", request.getMethod());
        assertEquals("/auth/login", request.getPath());
        String requestBody = request.getBody().readUtf8();
        assertTrue(requestBody.contains("\"email\":\"student@kit.edu\""));
        assertTrue(requestBody.contains("\"loginToken\":\"123456\""));
    }

    @Test
    public void deleteAccountSendsTokenAndParsesServerResponse() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("{\"message\":\"account deleted\",\"success\":true}"));

        Response<ServerResponse> response = apiService
                .deleteAccount(new LoginRequest("student@kit.edu", "123456"))
                .execute();

        RecordedRequest request = server.takeRequest();

        assertTrue(response.isSuccessful());
        assertNotNull(response.body());
        assertEquals("account deleted", response.body().message);
        assertTrue(response.body().success);
        assertEquals("POST", request.getMethod());
        assertEquals("/auth/delete-account", request.getPath());
        String requestBody = request.getBody().readUtf8();
        assertTrue(requestBody.contains("\"email\":\"student@kit.edu\""));
        assertTrue(requestBody.contains("\"loginToken\":\"123456\""));
    }

    @Test
    public void getProfessorsParsesProfessorListFromJson() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("{\"message\":\"ok\",\"success\":true,\"professors\":"
                        + "[{\"id\":\"prof-1\",\"firstName\":\"Ada\",\"lastName\":\"Lovelace\","
                        + "\"averageRating\":4.5,\"ratingCount\":12}]}"));

        Response<ProfessorResponse> response = apiService.getProfessors().execute();

        RecordedRequest request = server.takeRequest();

        assertTrue(response.isSuccessful());
        assertNotNull(response.body());
        assertTrue(response.body().success);
        assertEquals("GET", request.getMethod());
        assertEquals("/data/professor", request.getPath());
        List<Professor> professors = response.body().professors;
        assertEquals(1, professors.size());
        Professor professor = professors.get(0);
        assertEquals("prof-1", professor.id);
        assertEquals("Ada", professor.firstName);
        assertEquals("Lovelace", professor.lastName);
        assertEquals(4.5f, professor.averageRating, 0.001f);
        assertEquals(12, professor.ratingCount);
    }

    @Test
    public void getLecturesParsesLectureListFromJson() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("{\"message\":\"ok\",\"success\":true,\"lectures\":"
                        + "[{\"id\":\"lecture-1\",\"name\":\"Algorithms\",\"code\":\"240001\","
                        + "\"semesterYear\":2026,\"semesterSeason\":\"WINTER\",\"active\":true,"
                        + "\"professorId\":\"prof-1\",\"commentCount\":3,\"ratingCount\":4}]}"));

        Response<LecturesResponse> response = apiService.getLectures().execute();

        RecordedRequest request = server.takeRequest();

        assertTrue(response.isSuccessful());
        assertNotNull(response.body());
        assertTrue(response.body().success);
        assertEquals("GET", request.getMethod());
        assertEquals("/data/lectures", request.getPath());
        List<Lecture> lectures = response.body().lectures;
        assertEquals(1, lectures.size());
        Lecture lecture = lectures.get(0);
        assertEquals("lecture-1", lecture.id);
        assertEquals("Algorithms", lecture.name);
        assertEquals("240001", lecture.code);
        assertEquals(2026, lecture.semesterYear);
        assertEquals(SemesterSeason.WINTER, lecture.semesterSeason);
    }
}

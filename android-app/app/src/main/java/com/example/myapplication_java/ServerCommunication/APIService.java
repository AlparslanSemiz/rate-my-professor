package com.example.myapplication_java.ServerCommunication;

import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;

public interface APIService {

    /**
     * Used to start the 'request-login' routine in the Backend Code.
     */
    @POST("/auth/request-login")
    Call<ServerResponse> requestLogin(
            @Body LoginRequest request
    );

    /**
     * used to log in with the token.
     * @param request the request with the token and mail.
     * @return the server response.
     */
    @POST("/auth/login")
    Call<ServerResponse> login(
            @Body LoginRequest request
    );

    @POST("/auth/delete-account")
    Call<ServerResponse> deleteAccount(
            @Body LoginRequest request
    );

    @GET("/data/professor")
    Call<ProfessorResponse> getProfessors();

    @GET("/data/lectures")
    Call<LecturesResponse> getLectures();
}

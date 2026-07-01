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
     * Requests a one-time login token for the given email address.
     */
    @POST("/auth/request-login")
    Call<ServerResponse> requestLogin(
            @Body LoginRequest request
    );

    /**
     * Verifies the email and token pair with the backend.
     */
    @POST("/auth/login")
    Call<ServerResponse> login(
            @Body LoginRequest request
    );

    /**
     * Deletes the account for the currently verified email/token pair.
     */
    @POST("/auth/delete-account")
    Call<ServerResponse> deleteAccount(
            @Body LoginRequest request
    );

    /**
     * Loads all professors from the backend.
     */
    @GET("/data/professor")
    Call<List<Professor>> getProfessors();

    /**
     * Loads all lectures from the backend.
     */
    @GET("/data/lectures")
    Call<List<Lecture>> getLectures();
}

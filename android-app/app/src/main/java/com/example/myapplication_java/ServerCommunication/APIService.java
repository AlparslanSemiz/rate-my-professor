package com.example.myapplication_java.ServerCommunication;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

public interface APIService {

    /**
     * Used to start the 'request-login' routine in the Backend Code.
     */
    @POST("/auth/request-login")
    Call<ServerResponse> requestLogin(
            @Body LoginRequest request
    );

    @POST("/auth/login")
    Call<ServerResponse> login(
            @Body LoginRequest request
    );
}
package app.src.main.java.com.example.myapplication_java.ServerCommunication;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

public interface APIService {

    /**
     * Used to start the 'request-login' routine in the Backend Code.
     */
    @POST("/auth/request-login")
    Call<String> requestLogin(
            @Body com.example.myapplication_java.ServerCommunication.LoginRequest request
    );

    @POST("/auth/login")
    Call<String> login(
            @Body LoginRequest request
    );
}
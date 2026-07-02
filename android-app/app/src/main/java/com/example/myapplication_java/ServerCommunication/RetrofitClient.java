package com.example.myapplication_java.ServerCommunication;

import okhttp3.OkHttpClient;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class RetrofitClient {

    private static Retrofit retrofit;

    public static Retrofit getClient(OkHttpClient debugClient) {

        if (retrofit == null) {

            retrofit = new Retrofit.Builder()

                    .baseUrl("https://server.example.org/")
                    .client(debugClient)
                    .addConverterFactory(
                            GsonConverterFactory.create()
                    )
                    .build();
        }

        return retrofit;
    }
}
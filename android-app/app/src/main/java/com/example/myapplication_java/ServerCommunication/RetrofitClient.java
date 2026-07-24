package com.example.myapplication_java.ServerCommunication;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonDeserializer;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

/**
 * The client for communicating with the server. In static part the client is initialized.
 * Then the same client is returned to everyone.
 */
public class RetrofitClient {

    private static final Retrofit retrofit;
    private static final String BASE_URL = "https://server.example.org/";

    static {

        HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
        loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);
        OkHttpClient client = new OkHttpClient.Builder().connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(1, TimeUnit.SECONDS).addInterceptor(loggingInterceptor).build();

        Gson gson = new GsonBuilder()
                .registerTypeAdapter(LocalDateTime.class,
                        (JsonDeserializer<LocalDateTime>) (json, typeOfT, context) ->
                                LocalDateTime.parse(
                                        json.getAsString(),
                                        DateTimeFormatter.ISO_LOCAL_DATE_TIME
                                )
                )
                .create();
        retrofit = new Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build();
    }
    public static Retrofit getClient() {
        return retrofit;
    }
}
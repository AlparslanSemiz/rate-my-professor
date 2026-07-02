package com.example.myapplication_java;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertSame;

import com.example.myapplication_java.ServerCommunication.RetrofitClient;

import org.junit.Test;

import okhttp3.OkHttpClient;
import retrofit2.Retrofit;

public class APIServiceContractTest {
    @Test
    public void retrofitClientUsesConfiguredBaseUrlAndCachesInstance() {
        OkHttpClient client = new OkHttpClient();

        Retrofit first = RetrofitClient.getClient(client);
        Retrofit second = RetrofitClient.getClient(new OkHttpClient());

        assertEquals(
                "https://server.example.org/",
                first.baseUrl().toString()
        );
        assertSame(first, second);
    }
}

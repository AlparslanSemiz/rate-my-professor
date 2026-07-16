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
        Retrofit first = RetrofitClient.getClient();
        Retrofit second = RetrofitClient.getClient();

        assertEquals(
                "https://server.example.org/",
                first.baseUrl().toString()
        );
        assertSame(first, second);
    }
}

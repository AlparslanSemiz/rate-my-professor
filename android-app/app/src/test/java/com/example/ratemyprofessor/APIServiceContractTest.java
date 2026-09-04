package com.example.ratemyprofessor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertSame;

import com.example.ratemyprofessor.ServerCommunication.RetrofitClient;

import org.junit.Test;

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

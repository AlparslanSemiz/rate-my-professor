package com.example.myapplication_java;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;

import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.LoginRequest;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;

import org.junit.Test;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;

import okhttp3.OkHttpClient;
import retrofit2.Retrofit;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;

public class APIServiceContractTest {
    @Test
    public void requestLoginEndpointUsesExpectedPostPathAndBody() throws Exception {
        Method method = APIService.class.getMethod("requestLogin", LoginRequest.class);

        POST post = method.getAnnotation(POST.class);

        assertNotNull(post);
        assertEquals("/auth/request-login", post.value());
        assertTrue(firstParameterHasAnnotation(method, Body.class));
    }

    @Test
    public void loginEndpointUsesExpectedPostPathAndBody() throws Exception {
        Method method = APIService.class.getMethod("login", LoginRequest.class);

        POST post = method.getAnnotation(POST.class);

        assertNotNull(post);
        assertEquals("/auth/login", post.value());
        assertTrue(firstParameterHasAnnotation(method, Body.class));
    }

    @Test
    public void dataEndpointsUseExpectedGetPaths() throws Exception {
        Method professors = APIService.class.getMethod("getProfessors");
        Method lectures = APIService.class.getMethod("getLectures");

        assertEquals("/data/professor", professors.getAnnotation(GET.class).value());
        assertEquals("/data/lectures", lectures.getAnnotation(GET.class).value());
    }

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

    private static boolean firstParameterHasAnnotation(
            Method method,
            Class<? extends Annotation> annotationClass
    ) {
        Annotation[] annotations = method.getParameterAnnotations()[0];
        for (Annotation annotation : annotations) {
            if (annotationClass.isInstance(annotation)) {
                return true;
            }
        }
        return false;
    }
}

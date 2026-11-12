package com.example.ratemyprofessor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;

import com.example.ratemyprofessor.servercommunication.APIService;
import com.example.ratemyprofessor.servercommunication.RetrofitClient;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;

import retrofit2.Retrofit;
import retrofit2.http.Header;

/**
 * Verifies that the API service interface is correctly defined and the client is configured.
 */
@RunWith(RobolectricTestRunner.class)
public class APIServiceContractTest {

    /**
     * Verifies that retrofit client uses configured base URL and caches instance.
     */
    @Test
    public void retrofitClientUsesConfiguredBaseUrlAndCachesInstance() {
        Retrofit first = RetrofitClient.getClient();
        Retrofit second = RetrofitClient.getClient();

        assertEquals(
                "http://[2001:7c0:2313:1:f816:3eff:fe54:e4c9]/",
                first.baseUrl().toString()
        );
        assertSame(first, second);
    }

    /**
     * Verifies that API service interface is valid retrofit definition.
     */
    @Test
    public void apiServiceInterfaceIsValidRetrofitDefinition() {
        Retrofit retrofit = RetrofitClient.getClient();
        
        // This triggers Retrofit's internal validation of the interface annotations.
        // If there are missing @Path parameters or invalid @Body definitions, 
        // this will throw an IllegalArgumentException.
        APIService service = retrofit.create(APIService.class);
        
        assertNotNull(service);
    }

    /**
     * Verifies that secure routes must have authorization header.
     */
    @Test
    public void secureRoutesMustHaveAuthorizationHeader() {
        Method[] methods = APIService.class.getDeclaredMethods();
        for (Method method : methods) {
            String name = method.getName();

            // Define which methods we expect to be secure (require login)
            boolean isUserAction = name.startsWith("post") ||
                    name.startsWith("submit") ||
                    name.startsWith("vote") ||
                    name.startsWith("report") ||
                    name.startsWith("mark") ||
                    name.equals("deleteAccount") ||
                    name.equals("logoutAllDevices") ||
                    name.equals("validate") ||
                    name.equals("getUserInformation") ||
                    name.equals("getUserRatings");

            if (isUserAction) {
                boolean hasAuthHeader = false;
                Annotation[][] parameterAnnotations = method.getParameterAnnotations();
                for (Annotation[] annotations : parameterAnnotations) {
                    for (Annotation annotation : annotations) {
                        if (annotation instanceof Header && ((Header) annotation).value().equals("Authorization")) {
                            hasAuthHeader = true;
                            break;
                        }
                    }
                }
                assertTrue("Method " + name + " is a secure user action but is missing the @Header(\"Authorization\") parameter!", hasAuthHeader);
            }
        }
    }
}

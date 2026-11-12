package com.example.ratemyprofessor.servercommunication;

import com.example.ratemyprofessor.BuildConfig;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonDeserializer;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import okhttp3.Dns;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

/**
 * The client for communicating with the server. In static part the client is initialized.
 * Then the same client is returned to everyone.
 *
 * <p>Building a Retrofit instance sets up a connection pool and a thread pool, which is why
 * it is created exactly once here instead of per request.</p>
 */
public class RetrofitClient {

    private static final String BASE_URL = "http://[2001:7c0:2313:1:f816:3eff:fe54:e4c9]";

    /**
     * How long to wait for the connection to the server to be established.
     */
    private static final long CONNECT_TIMEOUT_SECONDS = 10;

    /**
     * How long to wait for the server's answer once the connection stands. This has to leave
     * room for the server to actually do its work, otherwise slow answers are dropped as
     * timeouts even though the request itself was fine.
     */
    private static final long READ_TIMEOUT_SECONDS = 10;

    private static final Retrofit retrofit = buildRetrofit();

    /**
     * Returns the shared Retrofit client used for backend requests.
     *
     * @return the shared Retrofit client used by every server request of the app
     */
    public static Retrofit getClient() {
        return retrofit;
    }

    /**
     * Assembles the Retrofit client from the HTTP client and the JSON converter.
     */
    private static Retrofit buildRetrofit() {
        return new Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(buildHttpClient())
                .addConverterFactory(GsonConverterFactory.create(buildGson()))
                .build();
    }

    /**
     * Builds the HTTP client with the timeouts and the request logging used for debugging.
     */
    private static OkHttpClient buildHttpClient() {
        //Filter out IPv6 traffic because it doesn't work right now.
        Dns ipv4OnlyDns = hostname -> {
            List<InetAddress> addresses = Dns.SYSTEM.lookup(hostname);

            List<InetAddress> ipv4Addresses = new ArrayList<>();
            for (InetAddress address : addresses) {
                if (address instanceof Inet4Address) {
                    ipv4Addresses.add(address);
                }
            }

            return ipv4Addresses;
        };

        OkHttpClient.Builder builder = new OkHttpClient.Builder()
                .connectTimeout(CONNECT_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .readTimeout(READ_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .dns(ipv4OnlyDns);

        if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
            loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BASIC);
            builder.addInterceptor(loggingInterceptor);
        }

        return builder.build();
    }

    /**
     * Builds the JSON parser.
     *
     * <p>Gson cannot handle {@link LocalDateTime} on its own, so the ISO format the backend
     * sends (for example "2026-07-28T10:15:30") is registered explicitly.</p>
     */
    private static Gson buildGson() {
        JsonDeserializer<LocalDateTime> localDateTimeDeserializer =
                (json, typeOfT, context) -> LocalDateTime.parse(
                        json.getAsString(),
                        DateTimeFormatter.ISO_LOCAL_DATE_TIME
                );

        return new GsonBuilder()
                .registerTypeAdapter(LocalDateTime.class, localDateTimeDeserializer)
                .create();
    }
}

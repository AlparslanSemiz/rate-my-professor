package com.example.ratemyprofessor.servercommunication;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.util.List;

import okhttp3.OkHttpClient;

/**
 * Tests retrofit client behavior.
 */
public class RetrofitClientTest {

    /**
     * Verifies that client DNS keeps only IPv4 addresses.
     *
     * @throws Exception if the operation cannot complete
     */
    @Test
    public void clientDnsKeepsOnlyIpv4Addresses() throws Exception {
        OkHttpClient httpClient =
                (OkHttpClient) RetrofitClient.getClient().callFactory();

        List<InetAddress> addresses = httpClient.dns().lookup("127.0.0.1");

        assertFalse(addresses.isEmpty());
        assertTrue(addresses.stream().allMatch(address -> address instanceof Inet4Address));
    }
}

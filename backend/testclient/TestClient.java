
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;


/**
 * Problem: Server currently doesnt allow acces to 192.0.2.10:8080
 * Solution: Server does allow connection to localhost:8080
 * 
 * This class simulates a user who wants to login using the token based login.
 * 
 * WARNING: Token should be unique, therefore creating two identical tokens leads to an exception.
 */
public class TestClient {



    private static final String SERVER_IP = "https://server.example.org";

    private static final HttpClient client = HttpClient.newHttpClient();

    /**
     * Read from the environment, never written here. A bearer token committed to a tracked
     * file is a credential published to everyone who can clone the repository, and it stays
     * in the history after it is edited out -- so the one that used to sit on this line has
     * to be revoked server-side rather than merely deleted.
     *
     * <p>Run with: {@code TEST_CLIENT_TOKEN=<token> java testclient/TestClient.java}
     */
    private static String authToken = System.getenv("TEST_CLIENT_TOKEN");



    public static void main(String[] args) throws Exception {


        sendBugReport();


    }

    public static void sendBugReport() throws Exception {

        String json = """
        {
            "title": "Test Bug Report",
            "description": "Das ist ein Test-Bugreport vom TestClient.",
            "severity": "LOW"
        }
        """;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(SERVER_IP + "/reports"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + authToken)
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response =
                client.send(request, HttpResponse.BodyHandlers.ofString());

        System.out.println("SEND BUG REPORT STATUS: " + response.statusCode());
        System.out.println(response.body());
    }

    /**
     * Requests all ratings of the currently logged-in user.
     */
    public static void getRatings() throws Exception {

        String json = """
            {
                "email": "uabcd@student.kit.edu"
            }
            """;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(SERVER_IP + "/account/ratings"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + authToken)
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response =
                client.send(request, HttpResponse.BodyHandlers.ofString());

        System.out.println("RATINGS STATUS: " + response.statusCode());
        System.out.println(response.body());
    }


    /**
     * Sends email to Server and prints its answer
     */
    public static void requestLogin() throws Exception {

        String json = """
                {
                    "email": "u-kisi6@student.kit.edu"
                }
                """;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(SERVER_IP + "/auth/request-login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response
                = client.send(request, HttpResponse.BodyHandlers.ofString());


        System.out.println("REQUEST LOGIN STATUS: " + response.statusCode());
        System.out.println(response.body());

        
    }

    /**
     * Sends email and token to server and hopes that the Server wirtes the JSESSIONID in its cookie.
     */
    public static void login(String email, String token) throws Exception {

        String json = """
            {

                "email": "%s",
                "loginToken": "%s"
            }
            """.formatted(email, token);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(SERVER_IP + "/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response
                = client.send(request, HttpResponse.BodyHandlers.ofString());

        System.out.println("AUTH LOGIN STATUS: " + response.statusCode());
        System.out.println(response.body());

        if (!response.body().contains("\"success\":true")) {
            System.out.println("Login failed, no auth token.");
            return;
        }

        
        authToken = extractAuthToken(response.body());

        System.out.println("AUTH TOKEN:");
        System.out.println(authToken);
    }

    /**
     * Very simple JSON extraction.
     *
     * Expected response:
     * {
     *   "message": "Login successful",
     *   "success": true,
     *   "authToken": "abc..."
     * }
     */
    private static String extractAuthToken(String json) {

        String key = "\"authToken\":\"";
        int start = json.indexOf(key);

        if (start == -1) {
            throw new IllegalStateException("No authToken found in response: " + json);
        }

        start += key.length();

        int end = json.indexOf("\"", start);

        if (end == -1) {
            throw new IllegalStateException("Invalid authToken JSON: " + json);
        }

        return json.substring(start, end);
    }
}


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

    private static String authToken = "REDACTED";


    /**
     * Requests all ratings of the currently logged-in user.
     */
    public static void getRatings() throws Exception {

        String json = """
            {
                "email": "u-kisi6@student.kit.edu"
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



    public static void main(String[] args) throws Exception {

        //requestLogin(); 
        System.out.println();

        login("u-kisi6@student.kit.edu", "679475");
        System.out.println();

        me();
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
     * Simple check to see if user is succesfully logged in.
     */
    public static void me() throws Exception {

        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(SERVER_IP + "/auth/me"))
            .header("Authorization", "Bearer " + authToken)
            .GET()
            .build();

        HttpResponse<String> response =
            client.send(request, HttpResponse.BodyHandlers.ofString());

        System.out.println("ME STATUS: " + response.statusCode());
        System.out.println(response.body());
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


import java.net.CookieManager;
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
 * WARNING: Token should be unique, therefore creating two identical tokens lead to an exception.
 */
public class TestClient {


    //Should be the Servers IP (192.0.2.10:8080)         
    private static final String SERVER_IP = "http://localhost:8080";

    // Later stores the session using JSESSIONID
    private static final CookieManager cookieManager = new CookieManager();

    private static final HttpClient client = HttpClient.newBuilder()
            .cookieHandler(cookieManager)
            .build();


    public static void main(String[] args) throws Exception {

        requestLogin();
        System.out.println();

        login("luis@example.org", "12345678910");
        System.out.println();


        me();
    }


    /**
     * Sends email to Server and prints its answer
     */
    public static void requestLogin() throws Exception {

        String json = """
                {
                    "email": "luis@example.org"
                }
                """;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(SERVER_IP + "/auth/request-login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response
                = client.send(request, HttpResponse.BodyHandlers.ofString());


        System.out.println("LOGIN STATUS: " + response.statusCode());
        System.out.println(response.body());

        System.out.println("COOKIES:");
        System.out.println(cookieManager.getCookieStore().getCookies());
    }

    /**
     * Sends email and token to server and hopes that the Server wirtes the JSESSIONID in its cookie.
     */
    public static void login(String email, String token) throws Exception {

        String json = """
            {

                "email": "%s",
                "token": "%s"
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

        System.out.println("COOKIES:");
        System.out.println(cookieManager.getCookieStore().getCookies());
    }

    /**
     * Simple check to see if user is succesfully logged in.
     */
    public static void me() throws Exception {

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(SERVER_IP + "/auth/me"))
                .GET()
                .build();

        HttpResponse<String> response
                = client.send(request, HttpResponse.BodyHandlers.ofString());

        System.out.println("ME STATUS: " + response.statusCode());
        System.out.println(response.body());
    }
}

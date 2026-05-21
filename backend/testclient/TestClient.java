
import java.net.CookieManager;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class TestClient {

    private static final String BASE_URL = "http://localhost:8080";

    private static final CookieManager cookieManager = new CookieManager();

    private static final HttpClient client = HttpClient.newBuilder()
            .cookieHandler(cookieManager)
            .build();

    public static void main(String[] args) throws Exception {

        requestLogin();

        System.out.println();


        login("luis@example.org", "12345678");
        System.out.println();
        me();
    }

    public static void requestLogin() throws Exception {

        String json = """
                {
                    "email": "luis@example.org"
                }
                """;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/auth/request-login"))
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

    public static void login(String email, String token) throws Exception {

        String json = """
            {

                "email": "%s",
                "token": "%s"
            }
            """.formatted(email, token);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/auth/login"))
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

    public static void me() throws Exception {

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/auth/me"))
                .GET()
                .build();

        HttpResponse<String> response
                = client.send(request, HttpResponse.BodyHandlers.ofString());

        System.out.println("ME STATUS: " + response.statusCode());
        System.out.println(response.body());
    }
}

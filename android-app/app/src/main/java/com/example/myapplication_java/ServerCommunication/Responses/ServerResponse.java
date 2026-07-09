package com.example.myapplication_java.ServerCommunication.Responses;

public class ServerResponse {
    public String message;
    public boolean success;
    public String authToken;
    public ServerResponse(String message, boolean success, String authToken) {
        this.message = message;
        this.success = success;
        this.authToken = authToken;
    }
}

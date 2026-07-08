package com.example.myapplication_java.ServerCommunication.Responses;

public class ServerResponse {
    public String message;
    public boolean success;
    public ServerResponse(String message, boolean success) {
        this.message = message;
        this.success = success;
    }
}

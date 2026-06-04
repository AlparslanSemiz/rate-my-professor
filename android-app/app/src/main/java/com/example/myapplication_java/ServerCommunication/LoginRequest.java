package com.example.myapplication_java.ServerCommunication;

public class LoginRequest {
    public String email;
    public String token;
    public LoginRequest(String email, String token) {
        this.email = email;
        this.token = token;
    }
}

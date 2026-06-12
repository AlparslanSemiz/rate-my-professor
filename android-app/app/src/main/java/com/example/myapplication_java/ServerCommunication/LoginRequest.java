package com.example.myapplication_java.ServerCommunication;

public class LoginRequest {
    public String email;
    public String loginToken;
    public LoginRequest(String email, String loginToken) {
        this.email = email;
        this.loginToken = loginToken;
    }
}

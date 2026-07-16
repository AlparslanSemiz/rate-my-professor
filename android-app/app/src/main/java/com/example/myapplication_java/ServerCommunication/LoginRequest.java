package com.example.myapplication_java.ServerCommunication;

public record LoginRequest (
    String email,
    String loginToken
) {}

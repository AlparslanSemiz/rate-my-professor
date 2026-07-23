package com.example.myapplication_java.ServerCommunication.Requests;

public record LoginRequest (
    String email,
    String loginToken
) {}

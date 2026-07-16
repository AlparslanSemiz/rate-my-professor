package com.example.myapplication_java.ServerCommunication.Responses;

public record ServerResponse (
    String message,
    boolean success,
    String authToken
) {}

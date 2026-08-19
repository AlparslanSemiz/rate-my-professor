package com.pse.auth.service;

public interface LoginCodeDelivery {

    void send(String email, String code);
}

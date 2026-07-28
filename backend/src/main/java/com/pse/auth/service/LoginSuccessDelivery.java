package com.pse.auth.service;

public interface LoginSuccessDelivery {

    void send(String email, String ipAddress, String userAgent);
}

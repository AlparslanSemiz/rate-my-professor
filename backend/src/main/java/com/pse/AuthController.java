package com.pse;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @PostMapping("/request-login")
    public String requestLogin(@RequestBody LoginRequest request) {



        return "email came through: " + request.email;
    

    }

    public record LoginRequest(String email) {}
}
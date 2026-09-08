package com.pse.auth.location;


public record IpInfoResponse(
        String ip,
        String city,
        String region,
        String country,
        String loc
) {
}
package com.pse.shared.enums;


public record IpInfoResponse(
        String ip,
        String city,
        String region,
        String country,
        String loc
) {
}
package com.company.ems.backend.common.utils;

import jakarta.servlet.http.HttpServletRequest;

public final class IpUtils {

    private IpUtils() {
        // Prevent instantiation
    }

    private static final String[] IP_HEADER_CANDIDATES = {
            "X-Forwarded-For",
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED",
            "HTTP_VIA",
            "REMOTE_ADDR"
    };

    /**
     * Extracts the true client IP address from a HttpServletRequest.
     */
    public static String getClientIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "0.0.0.0";
        }

        for (String header : IP_HEADER_CANDIDATES) {
            String ipList = request.getHeader(header);
            if (ipList != null && !ipList.isEmpty() && !"unknown".equalsIgnoreCase(ipList)) {
                String ip = ipList.split(",")[0].trim();
                return normalizeIp(ip);
            }
        }

        return normalizeIp(request.getRemoteAddr());
    }

    private static String normalizeIp(String ip) {
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip) || "127.0.0.1".equals(ip)) {
            try {
                java.net.InetAddress inetAddress = java.net.InetAddress.getLocalHost();
                return inetAddress.getHostAddress();
            } catch (java.net.UnknownHostException e) {
                return "127.0.0.1";
            }
        }
        return ip;
    }
}

package com.hrsaas.notification.client;

/**
 * Holds a system token for the current thread.
 * Used to pass the token to Feign client interceptors in async tasks.
 */
public class SystemTokenHolder {
    private static final ThreadLocal<String> TOKEN = new ThreadLocal<>();

    public static void setToken(String token) {
        TOKEN.set(token);
    }

    public static String getToken() {
        return TOKEN.get();
    }

    public static void clear() {
        TOKEN.remove();
    }
}

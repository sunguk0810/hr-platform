package com.hrsaas.auth.infrastructure.keycloak;

import com.hrsaas.auth.domain.dto.response.TokenResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class KeycloakClient {

    private final RestTemplate restTemplate;
    private final String serverUrl;
    private final String realm;
    private final String tokenUrl;
    private final String logoutUrl;
    private final String adminUrl;
    private final String clientId;
    private final String clientSecret;

    public KeycloakClient(
            @Value("${keycloak.server-url}") String serverUrl,
            @Value("${keycloak.realm}") String realm,
            @Value("${keycloak.client-id}") String clientId,
            @Value("${keycloak.client-secret}") String clientSecret) {
        this.restTemplate = new RestTemplate();
        this.serverUrl = serverUrl;
        this.realm = realm;
        this.tokenUrl = serverUrl + "/realms/" + realm + "/protocol/openid-connect/token";
        this.logoutUrl = serverUrl + "/realms/" + realm + "/protocol/openid-connect/logout";
        this.adminUrl = serverUrl + "/admin/realms/" + realm;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    @SuppressWarnings("unchecked")
    public TokenResponse getToken(String username, String password) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("username", username);
        body.add("password", password);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            tokenUrl,
            HttpMethod.POST,
            request,
            Map.class
        );

        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null) {
            throw new RuntimeException("Empty response from Keycloak");
        }

        return TokenResponse.builder()
            .accessToken((String) responseBody.get("access_token"))
            .refreshToken((String) responseBody.get("refresh_token"))
            .tokenType((String) responseBody.get("token_type"))
            .expiresIn(((Number) responseBody.get("expires_in")).longValue())
            .refreshExpiresIn(((Number) responseBody.get("refresh_expires_in")).longValue())
            .build();
    }

    @SuppressWarnings("unchecked")
    public TokenResponse refreshToken(String refreshToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "refresh_token");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("refresh_token", refreshToken);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            tokenUrl,
            HttpMethod.POST,
            request,
            Map.class
        );

        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null) {
            throw new RuntimeException("Empty response from Keycloak");
        }

        return TokenResponse.builder()
            .accessToken((String) responseBody.get("access_token"))
            .refreshToken((String) responseBody.get("refresh_token"))
            .tokenType((String) responseBody.get("token_type"))
            .expiresIn(((Number) responseBody.get("expires_in")).longValue())
            .refreshExpiresIn(((Number) responseBody.get("refresh_expires_in")).longValue())
            .build();
    }

    public void logout() {
        // Implement if needed - requires session token
        log.debug("Logout called");
    }

    /**
     * Validates user password by attempting authentication.
     */
    public void validatePassword(String username, String password) {
        getToken(username, password);
    }

    /**
     * Changes user password using Keycloak Admin API.
     */
    public void changePassword(String userId, String newPassword) {
        String adminToken = getAdminToken();

        // Find user by username
        String userKeycloakId = findUserIdByUsername(userId, adminToken);

        // Update password
        String updatePasswordUrl = adminUrl + "/users/" + userKeycloakId + "/reset-password";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        Map<String, Object> credential = Map.of(
            "type", "password",
            "value", newPassword,
            "temporary", false
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(credential, headers);

        try {
            restTemplate.exchange(
                updatePasswordUrl,
                HttpMethod.PUT,
                request,
                Void.class
            );
            log.info("Password changed successfully for user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to change password for user: {}", userId, e);
            throw new RuntimeException("Failed to change password", e);
        }
    }

    /**
     * Gets admin access token using client credentials.
     */
    private String getAdminToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            tokenUrl,
            HttpMethod.POST,
            request,
            Map.class
        );

        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null) {
            throw new RuntimeException("Empty response from Keycloak");
        }

        return (String) responseBody.get("access_token");
    }

    /**
     * Finds Keycloak user ID by username.
     */
    @SuppressWarnings("unchecked")
    private String findUserIdByUsername(String username, String adminToken) {
        String searchUrl = adminUrl + "/users?username=" + username + "&exact=true";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<List> response = restTemplate.exchange(
            searchUrl,
            HttpMethod.GET,
            request,
            List.class
        );

        List<Map<String, Object>> users = response.getBody();
        if (users == null || users.isEmpty()) {
            throw new RuntimeException("User not found: " + username);
        }

        return (String) users.get(0).get("id");
    }
}

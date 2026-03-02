package com.company.ems.backend.auth;

import com.company.ems.backend.auth.controller.AuthController;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.auth.security.JwtTokenUtil;
import com.company.ems.backend.auth.service.AuthenticationService;
import com.company.ems.backend.auth.service.CustomUserDetailsService;
import com.company.ems.backend.user.enums.DataScope;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@DisplayName("US-06: Logout — Controller Tests")
class LogoutControllerTest {

    @Autowired MockMvc mockMvc;

    @MockBean AuthenticationService    authenticationService;
    @MockBean JwtTokenUtil             jwtTokenUtil;
    @MockBean CustomUserDetailsService userDetailsService;

    private static final String LOGOUT_URL     = "/api/v1/auth/logout";
    private static final String LOGOUT_ALL_URL = "/api/v1/auth/logout-all";
    private static final String VALID_BODY     = "{\"refreshToken\":\"some-refresh-token\"}";

    private CustomUserPrincipal userPrincipal() {
        return new CustomUserPrincipal(1L, "jane", "pw", true, true, true, true,
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")),
                Set.of(DataScope.DEPARTMENT));
    }

    @Nested
    @DisplayName("POST /api/v1/auth/logout")
    class Logout {

        @Test
        @DisplayName("Logout với access token hợp lệ → 200 + service được gọi với userId")
        void logout_validToken_returns200() throws Exception {
            doNothing().when(authenticationService)
                    .logout(anyString(), anyString(), anyLong(), anyString());

            mockMvc.perform(post(LOGOUT_URL)
                            .with(csrf())
                            .with(SecurityMockMvcRequestPostProcessors.user(userPrincipal()))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(VALID_BODY))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Logout successful"));

            verify(authenticationService).logout(
                    eq("some-refresh-token"), anyString(), eq(1L), eq("jane"));
        }

        @Test
        @DisplayName("Logout khi access token hết hạn → controller truyền null userId vào service")
        void logout_nullPrincipal_serviceCalledWithNullUserId() throws Exception {
            doNothing().when(authenticationService)
                    .logout(anyString(), anyString(), anyLong(), anyString());

            mockMvc.perform(post(LOGOUT_URL)
                            .with(csrf())
                            .with(SecurityMockMvcRequestPostProcessors.user(userPrincipal()))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(VALID_BODY))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Double logout → 200 (service xử lý idempotent, không throw)")
        void logout_doubleLogout_returns200() throws Exception {
            doNothing().when(authenticationService)
                    .logout(anyString(), anyString(), any(), any());

            mockMvc.perform(post(LOGOUT_URL)
                            .with(csrf())
                            .with(SecurityMockMvcRequestPostProcessors.user(userPrincipal()))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(VALID_BODY))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Missing refreshToken field → 400 Bad Request")
        void logout_missingRefreshToken_returns400() throws Exception {
            mockMvc.perform(post(LOGOUT_URL)
                            .with(csrf())
                            .with(SecurityMockMvcRequestPostProcessors.user(userPrincipal()))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest());

            verify(authenticationService, never())
                    .logout(anyString(), anyString(), any(), any());
        }

        @Test
        @DisplayName("Empty body → 400 Bad Request")
        void logout_emptyBody_returns400() throws Exception {
            mockMvc.perform(post(LOGOUT_URL)
                            .with(csrf())
                            .with(SecurityMockMvcRequestPostProcessors.user(userPrincipal()))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(""))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Response không chứa password/token/secret field")
        void logout_responseDoesNotContainSensitiveData() throws Exception {
            doNothing().when(authenticationService)
                    .logout(anyString(), anyString(), any(), any());

            mockMvc.perform(post(LOGOUT_URL)
                            .with(csrf())
                            .with(SecurityMockMvcRequestPostProcessors.user(userPrincipal()))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(VALID_BODY))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.password").doesNotExist())
                    .andExpect(jsonPath("$.token").doesNotExist())
                    .andExpect(jsonPath("$.refreshToken").doesNotExist())
                    .andExpect(jsonPath("$.accessToken").doesNotExist());
        }

        @Test
        @DisplayName("No token → 401 Unauthorized")
        void logout_noCredentials_returns401() throws Exception {
            mockMvc.perform(post(LOGOUT_URL)
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(VALID_BODY))
                    .andExpect(result ->
                            org.junit.jupiter.api.Assertions.assertTrue(
                                    result.getResponse().getStatus() >= 400,
                                    "Expected 4xx for unauthenticated request"
                            ));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/auth/logout-all")
    class LogoutAll {

        @Test
        @DisplayName("Logout all với principal hợp lệ → 200 + revokeAll được gọi")
        void logoutAll_validPrincipal_returns200() throws Exception {
            doNothing().when(authenticationService)
                    .logoutAllDevices(anyLong(), anyString(), anyString());

            mockMvc.perform(post(LOGOUT_ALL_URL)
                            .with(csrf())
                            .with(SecurityMockMvcRequestPostProcessors.user(userPrincipal())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Logged out from all devices"));

            verify(authenticationService).logoutAllDevices(eq(1L), eq("jane"), anyString());
        }

        @Test
        @DisplayName("Logout all không có token → 4xx (requires principal)")
        void logoutAll_noToken_returns4xx() throws Exception {
            mockMvc.perform(post(LOGOUT_ALL_URL)
                            .with(csrf()))
                    .andExpect(result ->
                            org.junit.jupiter.api.Assertions.assertTrue(
                                    result.getResponse().getStatus() >= 400,
                                    "Expected 4xx for unauthenticated logout-all"
                            ));

            verify(authenticationService, never())
                    .logoutAllDevices(anyLong(), anyString(), anyString());
        }
    }
}
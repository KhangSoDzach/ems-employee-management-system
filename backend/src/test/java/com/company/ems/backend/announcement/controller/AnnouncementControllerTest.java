package com.company.ems.backend.announcement.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.company.ems.backend.announcement.dto.AnnouncementResponse;
import com.company.ems.backend.announcement.enums.AnnouncementType;
import com.company.ems.backend.announcement.enums.TargetAudience;
import com.company.ems.backend.announcement.service.AnnouncementService;

@WebMvcTest(AnnouncementController.class)
@org.springframework.context.annotation.Import({ com.company.ems.backend.config.StorageProperties.class })
class AnnouncementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AnnouncementService announcementService;

    @MockBean
    private com.company.ems.backend.auth.security.JwtTokenUtil jwtTokenUtil;

    @MockBean
    private com.company.ems.backend.auth.service.CustomUserDetailsService customUserDetailsService;

    @MockBean
    private com.company.ems.backend.common.message.MessageService messageService;

    @MockBean
    private com.company.ems.backend.common.audit.SecurityAuditService securityAuditService;

    @Test
    @WithMockUser
    void getAnnouncementsForUser_shouldReturnOk() throws Exception {
        AnnouncementResponse response = AnnouncementResponse.builder()
                .id(1L)
                .title("Policy")
                .content("Updated policy")
                .announcementType(AnnouncementType.POLICY)
                .targetAudience(TargetAudience.ALL_COMPANY)
                .isRead(false)
                .publishedAt(LocalDateTime.now())
                .build();

        when(announcementService.getAnnouncementsForUser(10L)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/announcements/user/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(1))
                .andExpect(jsonPath("$.data[0].title").value("Policy"));
    }
}

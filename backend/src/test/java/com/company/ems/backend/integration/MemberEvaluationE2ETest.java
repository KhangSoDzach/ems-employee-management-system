package com.company.ems.backend.integration;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import com.company.ems.backend.performance.review.dto.PerformanceReviewDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.company.ems.backend.auth.security.JwtTokenUtil;
import com.company.ems.backend.auth.service.CustomUserDetailsService;
import com.company.ems.backend.common.audit.SecurityAuditService;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.config.StorageProperties;
import com.company.ems.backend.employee.controller.EmployeeController;
import com.company.ems.backend.employee.dto.MemberResponse;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.employee.service.EmployeeService;
import com.company.ems.backend.performance.review.controller.PerformanceReviewController;
import com.company.ems.backend.performance.review.service.PerformanceReviewService;
import com.company.ems.backend.rbac.evaluator.CustomPermissionEvaluator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

@WebMvcTest(controllers = {EmployeeController.class, PerformanceReviewController.class})
@AutoConfigureMockMvc(addFilters = false)
@Import({StorageProperties.class})
public class MemberEvaluationE2ETest {

    @Autowired
    private MockMvc mockMvc;

        @MockitoBean
    private EmployeeService employeeService;

        @MockitoBean
    private PerformanceReviewService reviewService;

        @MockitoBean
    private JwtTokenUtil jwtTokenUtil;

        @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

        @MockitoBean
    private MessageService messages;

        @MockitoBean
    private SecurityAuditService securityAuditService;

        @MockitoBean
    private CustomPermissionEvaluator customPermissionEvaluator;

        @MockitoBean
    private EmployeeRepository employeeRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setup() {
        // Return "Success" for any MessageService gets to prevent empty JSON responses from mocked service when wrapping in ApiResponse
        Mockito.when(messages.get(org.mockito.ArgumentMatchers.<MessageCode>any()))
               .thenReturn("Success");
        Mockito.when(messages.get(org.mockito.ArgumentMatchers.<MessageCode>any(), any()))
               .thenReturn("Success");
    }

    @Test
    @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
    void e2e_managerCanViewTeam_andSubmitEvaluation() throws Exception {

        // 1. Mock EmployeeService returning team members
        MemberResponse member = MemberResponse.builder()
                .id(200L)
                .fullName("Team Member")
                .employeeCode("EMP-001")
                .build();

        PageResponse<MemberResponse> teamPage = PageResponse.of(
                List.of(member), 0, 10, 1L, 1, "members");

        Mockito.when(employeeService.getTeamMembers(0, 10, null))
               .thenReturn(teamPage);

        // Step 1: Manager fetches their team members
        mockMvc.perform(get("/api/v1/employees/team")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(200))
                .andExpect(jsonPath("$.data.content[0].fullName").value("Team Member"));

        // 2. Mock latest review logic for no data
        PerformanceReviewDto.Response emptyReview = PerformanceReviewDto.Response.builder()
                .revieweeId(200L)
                .totalScore(0)
                .rank("Chưa có đánh giá")
                .build();

        Mockito.when(reviewService.getLatestForEmployee(200L))
               .thenReturn(emptyReview);

        // Step 2: Manager checks the latest review for the member (should be none)
        mockMvc.perform(get("/api/v1/performance/reviews/latest/200"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.revieweeId").value(200))
                .andExpect(jsonPath("$.data.totalScore").value(0))
                .andExpect(jsonPath("$.data.rank").value("Chưa có đánh giá"));

        // 3. Mock save response
        PerformanceReviewDto.Response savedReview = PerformanceReviewDto.Response.builder()
                .revieweeId(200L)
                .reviewerUsername("manager01")
                .totalScore(85)
                .rank("B")
                .build();

        Mockito.when(reviewService.saveReview(any(PerformanceReviewDto.CreateRequest.class)))
               .thenReturn(savedReview);

        // Step 3: Manager submits a new performance review
        ObjectNode scores = objectMapper.createObjectNode()
                .put("expertise", 85)
                .put("communication", 90)
                .put("attitude", 80);

        ObjectNode payload = objectMapper.createObjectNode()
                .put("revieweeId", 200)
                .put("reviewType", "MANAGER")
                .put("reviewPeriod", "2026-Q1")
                .put("comment", "Great quarter overall")
                .set("scores", scores);

        mockMvc.perform(post("/api/v1/performance/reviews")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload.toString()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reviewerUsername").value("manager01"))
                .andExpect(jsonPath("$.data.totalScore").value(85))
                .andExpect(jsonPath("$.data.rank").value("B"));
    }
}

package com.company.ems.backend.announcement.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import com.company.ems.backend.announcement.dto.CreateAnnouncementRequest;
import com.company.ems.backend.announcement.entity.Announcement;
import com.company.ems.backend.announcement.entity.AnnouncementRead;
import com.company.ems.backend.announcement.enums.AnnouncementType;
import com.company.ems.backend.announcement.enums.TargetAudience;
import com.company.ems.backend.announcement.repository.AnnouncementReadRepository;
import com.company.ems.backend.announcement.repository.AnnouncementRepository;
import com.company.ems.backend.announcement.repository.AnnouncementTargetRepository;
import com.company.ems.backend.auth.port.out.EmailPort;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.department.repository.DepartmentRepository;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.RoleRepository;
import com.company.ems.backend.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class AnnouncementServiceImplTest {

        @Mock
        private AnnouncementRepository announcementRepository;

        @Mock
        private AnnouncementTargetRepository announcementTargetRepository;

        @Mock
        private AnnouncementReadRepository announcementReadRepository;

        @Mock
        private DepartmentRepository departmentRepository;

        @Mock
        private RoleRepository roleRepository;

        @Mock
        private UserRepository userRepository;

        @Mock
        private EmployeeRepository employeeRepository;

        @Mock
        private EmailPort emailPort;

        @InjectMocks
        private AnnouncementServiceImpl announcementService;

        @BeforeEach
        void setUp() {
                SecurityContextHolder.clearContext();
        }

        @Test
        void createAnnouncement_allCompany_shouldCreateReadReceipts() {
                CustomUserPrincipal principal = new CustomUserPrincipal(
                                99L,
                                "hr.user",
                                "pwd",
                                "HR User",
                                true,
                                true,
                                true,
                                true,
                                List.of(new SimpleGrantedAuthority("ROLE_HR")),
                                Set.of());

                SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

                CreateAnnouncementRequest request = CreateAnnouncementRequest.builder()
                                .title("Policy update")
                                .content("New internal policy")
                                .announcementType(AnnouncementType.POLICY)
                                .targetAudience(TargetAudience.ALL_COMPANY)
                                .targetIds(List.of())
                                .sendEmail(false)
                                .build();

                Announcement savedAnnouncement = Announcement.builder()
                                .title(request.getTitle())
                                .content(request.getContent())
                                .announcementType(request.getAnnouncementType())
                                .targetAudience(request.getTargetAudience())
                                .publishedAt(LocalDateTime.now())
                                .build();
                savedAnnouncement.setId(1L);

                when(announcementRepository.save(any(Announcement.class))).thenReturn(savedAnnouncement);
                when(userRepository.findAllEnabledUserIds()).thenReturn(List.of(1L, 2L));

                User u1 = User.builder().username("u1").email("u1@ems.com").password("x").enabled(true).build();
                u1.setId(1L);
                User u2 = User.builder().username("u2").email("u2@ems.com").password("x").enabled(true).build();
                u2.setId(2L);
                when(userRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(u1, u2));

                var response = announcementService.createAnnouncement(request);

                assertEquals(1L, response.getAnnouncementId());
                assertEquals(2, response.getRecipientCount());
                assertEquals(false, response.getEmailDeliveryRequested());
                assertEquals(0, response.getEmailedRecipientCount());
                verify(emailPort, never()).sendAnnouncementEmail(any(), any(), any(), any());
        }

        @Test
        void createAnnouncement_sendEmailTrue_shouldSendEmailsToRecipients() {
                CustomUserPrincipal principal = new CustomUserPrincipal(
                                99L,
                                "admin.user",
                                "pwd",
                                "Admin User",
                                true,
                                true,
                                true,
                                true,
                                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")),
                                Set.of());

                SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

                CreateAnnouncementRequest request = CreateAnnouncementRequest.builder()
                                .title("Email update")
                                .content("Please read this update")
                                .announcementType(AnnouncementType.EVENT)
                                .targetAudience(TargetAudience.ALL_COMPANY)
                                .targetIds(List.of())
                                .sendEmail(true)
                                .build();

                Announcement savedAnnouncement = Announcement.builder()
                                .title(request.getTitle())
                                .content(request.getContent())
                                .announcementType(request.getAnnouncementType())
                                .targetAudience(request.getTargetAudience())
                                .publishedAt(LocalDateTime.now())
                                .build();
                savedAnnouncement.setId(2L);

                when(announcementRepository.save(any(Announcement.class))).thenReturn(savedAnnouncement);
                when(userRepository.findAllEnabledUserIds()).thenReturn(List.of(1L, 2L));

                User u1 = User.builder().username("u1").email("u1@ems.com").password("x").enabled(true).build();
                u1.setId(1L);
                User u2 = User.builder().username("u2").email("u2@ems.com").password("x").enabled(true).build();
                u2.setId(2L);
                when(userRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(u1, u2));

                var response = announcementService.createAnnouncement(request);

                assertEquals(2, response.getRecipientCount());
                assertEquals(true, response.getEmailDeliveryRequested());
                assertEquals(2, response.getEmailedRecipientCount());
                verify(emailPort, times(1)).sendAnnouncementEmail(eq("u1@ems.com"), any(), any(), any());
                verify(emailPort, times(1)).sendAnnouncementEmail(eq("u2@ems.com"), any(), any(), any());
        }

        @Test
        void getAnnouncementsForUser_shouldThrowForbidden_forDifferentNonAdminUser() {
                CustomUserPrincipal principal = new CustomUserPrincipal(
                                3L,
                                "employee",
                                "pwd",
                                "Employee User",
                                true,
                                true,
                                true,
                                true,
                                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")),
                                Set.of());

                SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

                assertThrows(ForbiddenException.class, () -> announcementService.getAnnouncementsForUser(10L));
        }

        @Test
        void markAnnouncementAsRead_shouldSetReadFlag() {
                CustomUserPrincipal principal = new CustomUserPrincipal(
                                7L,
                                "employee",
                                "pwd",
                                "Employee User",
                                true,
                                true,
                                true,
                                true,
                                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")),
                                Set.of());

                SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

                Announcement ann = Announcement.builder()
                                .title("Event")
                                .content("Townhall")
                                .announcementType(AnnouncementType.EVENT)
                                .targetAudience(TargetAudience.ALL_COMPANY)
                                .publishedAt(LocalDateTime.now())
                                .build();
                ann.setId(4L);

                User user = User.builder().username("e1").email("e1@ems.com").password("x").enabled(true).build();
                user.setId(7L);

                AnnouncementRead read = AnnouncementRead.builder()
                                .announcement(ann)
                                .user(user)
                                .isRead(false)
                                .build();

                when(announcementReadRepository.findByAnnouncementAndUser(4L, 7L)).thenReturn(Optional.of(read));

                var response = announcementService.markAnnouncementAsRead(4L, 7L);

                assertEquals(true, response.getIsRead());
        }
}

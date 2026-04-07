package com.company.ems.backend.announcement.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import com.company.ems.backend.common.constant.RoleAuthorization;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.announcement.dto.AnnouncementResponse;
import com.company.ems.backend.announcement.dto.CreateAnnouncementRequest;
import com.company.ems.backend.announcement.dto.CreateAnnouncementResponse;
import com.company.ems.backend.announcement.entity.Announcement;
import com.company.ems.backend.announcement.entity.AnnouncementRead;
import com.company.ems.backend.announcement.entity.AnnouncementTarget;
import com.company.ems.backend.announcement.enums.AnnouncementTargetType;
import com.company.ems.backend.announcement.enums.TargetAudience;
import com.company.ems.backend.announcement.repository.AnnouncementReadRepository;
import com.company.ems.backend.announcement.repository.AnnouncementRepository;
import com.company.ems.backend.announcement.repository.AnnouncementTargetRepository;
import com.company.ems.backend.auth.port.out.EmailPort;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.department.entity.Department;
import com.company.ems.backend.department.repository.DepartmentRepository;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.user.entity.Role;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.RoleRepository;
import com.company.ems.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final AnnouncementTargetRepository announcementTargetRepository;
    private final AnnouncementReadRepository announcementReadRepository;
    private final DepartmentRepository departmentRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final EmailPort emailPort;

    @Override
    @Transactional
    public CreateAnnouncementResponse createAnnouncement(CreateAnnouncementRequest request) {
        request.validateTargetIds();
        boolean emailDeliveryRequested = Boolean.TRUE.equals(request.getSendEmail());

        Announcement announcement = Announcement.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .announcementType(request.getAnnouncementType())
                .targetAudience(request.getTargetAudience())
                .emailDeliveryRequested(emailDeliveryRequested)
                .emailedRecipientCount(0)
                .publishedAt(LocalDateTime.now())
                .build();

        Announcement savedAnnouncement = announcementRepository.save(announcement);
        createTargetMappings(savedAnnouncement, request);

        List<Long> recipientUserIds = resolveRecipientUserIds(request);
        if (recipientUserIds.isEmpty()) {
            throw new BusinessException("No recipients found for selected target audience");
        }

        List<User> recipients = userRepository.findAllById(recipientUserIds);
        List<AnnouncementRead> reads = recipients.stream()
                .map(user -> AnnouncementRead.builder()
                        .announcement(savedAnnouncement)
                        .user(user)
                        .isRead(false)
                        .build())
                .toList();

        announcementReadRepository.saveAll(reads);

        int emailedRecipientCount = 0;
        if (emailDeliveryRequested) {
            emailedRecipientCount = sendAnnouncementEmails(savedAnnouncement, recipients);
            savedAnnouncement.setEmailedRecipientCount(emailedRecipientCount);
            announcementRepository.save(savedAnnouncement);
        }

        return CreateAnnouncementResponse.builder()
                .announcementId(savedAnnouncement.getId())
                .recipientCount(reads.size())
                .emailDeliveryRequested(emailDeliveryRequested)
                .emailedRecipientCount(emailedRecipientCount)
                .publishedAt(savedAnnouncement.getPublishedAt())
                .build();
    }

    private int sendAnnouncementEmails(Announcement announcement, List<User> recipients) {
        int successCount = 0;
        String publishedAtIso = announcement.getPublishedAt().toString();

        for (User recipient : recipients) {
            String recipientEmail = recipient.getEmail();
            if (recipientEmail == null || recipientEmail.isBlank()) {
                continue;
            }

            try {
                emailPort.sendAnnouncementEmail(
                        recipientEmail,
                        announcement.getTitle(),
                        announcement.getContent(),
                        publishedAtIso);
                successCount++;
            } catch (Exception exception) {
                log.error("[EMS-ANNOUNCEMENT] Failed to send announcement email [announcementId={}] to [{}]: {}",
                        announcement.getId(), recipientEmail, exception.getMessage(), exception);
            }
        }

        return successCount;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAnnouncementsForUser(Long userId) {
        ensureCanAccessUser(userId);
        return announcementReadRepository.findVisibleByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AnnouncementResponse markAnnouncementAsRead(Long announcementId, Long userId) {
        ensureCanAccessUser(userId);

        AnnouncementRead read = announcementReadRepository.findByAnnouncementAndUser(announcementId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement read receipt not found"));

        if (!Boolean.TRUE.equals(read.getIsRead())) {
            read.setIsRead(true);
            read.setReadAt(LocalDateTime.now());
            announcementReadRepository.save(read);
        }
        return toResponse(read);
    }

    private void createTargetMappings(Announcement announcement, CreateAnnouncementRequest request) {
        List<AnnouncementTarget> targets = new ArrayList<>();

        if (TargetAudience.ALL_COMPANY.equals(request.getTargetAudience())) {
            targets.add(AnnouncementTarget.builder()
                    .announcement(announcement)
                    .targetType(AnnouncementTargetType.ALL_COMPANY)
                    .build());
        }

        if (TargetAudience.BY_DEPARTMENT.equals(request.getTargetAudience())) {
            List<Department> departments = departmentRepository.findAllById(request.getTargetIds());
            if (departments.size() != request.getTargetIds().size()) {
                throw new BusinessException("Some target departments do not exist");
            }
            for (Department department : departments) {
                targets.add(AnnouncementTarget.builder()
                        .announcement(announcement)
                        .targetType(AnnouncementTargetType.DEPARTMENT)
                        .department(department)
                        .build());
            }
        }

        if (TargetAudience.BY_ROLE.equals(request.getTargetAudience())) {
            List<Role> roles = roleRepository.findAllById(request.getTargetIds());
            if (roles.size() != request.getTargetIds().size()) {
                throw new BusinessException("Some target roles do not exist");
            }
            for (Role role : roles) {
                targets.add(AnnouncementTarget.builder()
                        .announcement(announcement)
                        .targetType(AnnouncementTargetType.ROLE)
                        .role(role)
                        .build());
            }
        }

        announcementTargetRepository.saveAll(targets);
    }

    private List<Long> resolveRecipientUserIds(CreateAnnouncementRequest request) {
        Set<Long> userIds = new LinkedHashSet<>();

        // Distribution rule:
        // - ALL_COMPANY: deliver to every enabled user account
        // - BY_DEPARTMENT: deliver to users linked to employees in selected departments
        // - BY_ROLE: deliver to users holding at least one selected role
        // LinkedHashSet guarantees deduplication when a user matches multiple target conditions.
        if (TargetAudience.ALL_COMPANY.equals(request.getTargetAudience())) {
            userIds.addAll(userRepository.findAllEnabledUserIds());
        }

        if (TargetAudience.BY_DEPARTMENT.equals(request.getTargetAudience())) {
            userIds.addAll(employeeRepository.findDistinctUserIdsByDepartmentIds(request.getTargetIds()));
        }

        if (TargetAudience.BY_ROLE.equals(request.getTargetAudience())) {
            userIds.addAll(userRepository.findDistinctUserIdsByRoleIds(request.getTargetIds()));
        }

        return new ArrayList<>(userIds);
    }

    private AnnouncementResponse toResponse(AnnouncementRead read) {
        Announcement announcement = read.getAnnouncement();
        return AnnouncementResponse.builder()
                .id(announcement.getId())
                .title(announcement.getTitle())
                .content(announcement.getContent())
                .announcementType(announcement.getAnnouncementType())
                .targetAudience(announcement.getTargetAudience())
                .isRead(read.getIsRead())
                .readAt(read.getReadAt())
                .publishedAt(announcement.getPublishedAt())
                .build();
    }

    private void ensureCanAccessUser(Long requestedUserId) {
        Long currentUserId = currentUserId();
        if (currentUserId == null) {
            throw new ForbiddenException("Unauthorized access");
        }
        if (currentUserId.equals(requestedUserId)) {
            return;
        }
        if (!hasAnyRole(RoleAuthorization.HAS_ADMIN_ONLY, RoleAuthorization.HAS_HR_ONLY)) {
            throw new ForbiddenException("Access denied to another user's announcements");
        }
    }

    private Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserPrincipal customUserPrincipal) {
            return customUserPrincipal.getUserId();
        }

        String username = authentication.getName();
        if (username == null || username.isBlank()) {
            return null;
        }

        return userRepository.findByUsername(username)
                .map(User::getId)
                .orElse(null);
    }

    private boolean hasAnyRole(String... roleNames) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }

        Set<String> required = java.util.Arrays.stream(roleNames)
                .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                .collect(java.util.stream.Collectors.toSet());

        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (required.contains(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}

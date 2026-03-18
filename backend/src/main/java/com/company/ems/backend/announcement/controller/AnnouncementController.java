package com.company.ems.backend.announcement.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.ems.backend.announcement.dto.AnnouncementResponse;
import com.company.ems.backend.announcement.dto.CreateAnnouncementRequest;
import com.company.ems.backend.announcement.dto.CreateAnnouncementResponse;
import com.company.ems.backend.announcement.dto.MarkAnnouncementReadRequest;
import com.company.ems.backend.announcement.service.AnnouncementService;
import com.company.ems.backend.common.constant.AppRole;
import com.company.ems.backend.common.dto.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/announcements")
@Tag(name = "Internal Announcements", description = "APIs for internal announcement management and read tracking")
public class AnnouncementController {

    private static final String CREATE_SUCCESS_MESSAGE = "Announcement created successfully";
    private static final String FETCH_SUCCESS_MESSAGE = "Announcements fetched successfully";
    private static final String MARK_READ_SUCCESS_MESSAGE = "Announcement marked as read";

    private final AnnouncementService announcementService;

    @PostMapping
    @PreAuthorize(AppRole.HAS_ADMIN_ONLY)
    @Operation(summary = "Create announcement", description = "Creates a new internal announcement and pre-generates read receipts for all recipients")
    public ResponseEntity<ApiResponse<CreateAnnouncementResponse>> createAnnouncement(
            @Valid @RequestBody CreateAnnouncementRequest request) {
        CreateAnnouncementResponse response = announcementService.createAnnouncement(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(CREATE_SUCCESS_MESSAGE, response));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get announcements by user", description = "Returns all visible announcements for a specific user including read status")
    public ResponseEntity<ApiResponse<List<AnnouncementResponse>>> getAnnouncementsForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(
                FETCH_SUCCESS_MESSAGE,
                announcementService.getAnnouncementsForUser(userId)));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark announcement as read", description = "Marks one announcement as read for a specific user")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> markAnnouncementAsRead(
            @PathVariable("id") Long announcementId,
            @Valid @RequestBody MarkAnnouncementReadRequest request) {
        AnnouncementResponse response = announcementService.markAnnouncementAsRead(announcementId, request.getUserId());
        return ResponseEntity.ok(ApiResponse.success(MARK_READ_SUCCESS_MESSAGE, response));
    }
}

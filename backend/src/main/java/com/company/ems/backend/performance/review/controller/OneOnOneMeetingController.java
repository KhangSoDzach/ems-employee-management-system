package com.company.ems.backend.performance.review.controller;

import com.company.ems.backend.common.constant.RoleAuthorization;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.enums.ErrorCode;
import com.company.ems.backend.common.exception.AppException;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.performance.review.dto.OneOnOneMeetingDto;
import com.company.ems.backend.performance.review.entity.OneOnOneMeeting;
import com.company.ems.backend.performance.review.repository.OneOnOneMeetingRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/performance/one-on-one")
@RequiredArgsConstructor
@Tag(name = "One-on-One Meeting", description = "Manager/employee meeting records")
@Transactional
public class OneOnOneMeetingController {

    private final OneOnOneMeetingRepository meetingRepo;
    private final EmployeeRepository        employeeRepo;

    @PostMapping
    @PreAuthorize(RoleAuthorization.HAS_MANAGER_OR_ABOVE)
    @Operation(summary = "Create a meeting record")
    public ResponseEntity<ApiResponse<OneOnOneMeetingDto.Response>> create(
            @Valid @RequestBody OneOnOneMeetingDto.CreateRequest req) {

        Employee manager = currentEmployee();
        Employee employee = employeeRepo.findById(req.getEmployeeId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy nhân viên id=" + req.getEmployeeId()));

        OneOnOneMeeting meeting = OneOnOneMeeting.builder()
                .managerId(manager.getId())
                .managerName(manager.getFullName())
                .employeeId(employee.getId())
                .employeeName(employee.getFullName())
                .meetingDate(req.getMeetingDate())
                .agenda(req.getAgenda())
                .notes(req.getNotes())
                .actionItems(req.getActionItems())
                .nextMeetingDate(req.getNextMeetingDate())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã lưu bản ghi cuộc họp", toResponse(meetingRepo.save(meeting))));
    }

    @PutMapping("/{id}")
    @PreAuthorize(RoleAuthorization.HAS_MANAGER_OR_ABOVE)
    @Operation(summary = "Update a meeting record")
    public ResponseEntity<ApiResponse<OneOnOneMeetingDto.Response>> update(
            @PathVariable Long id,
            @Valid @RequestBody OneOnOneMeetingDto.CreateRequest req) {

        Employee manager = currentEmployee();
        OneOnOneMeeting meeting = meetingRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bản ghi id=" + id));

        if (!meeting.getManagerId().equals(manager.getId()))
            throw new AppException(ErrorCode.ACCESS_DENIED, "Bạn không có quyền sửa bản ghi này");

        meeting.setMeetingDate(req.getMeetingDate());
        meeting.setAgenda(req.getAgenda());
        meeting.setNotes(req.getNotes());
        meeting.setActionItems(req.getActionItems());
        meeting.setNextMeetingDate(req.getNextMeetingDate());

        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật bản ghi", toResponse(meetingRepo.save(meeting))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(RoleAuthorization.HAS_MANAGER_OR_ABOVE)
    @Operation(summary = "Delete a meeting record")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        Employee manager = currentEmployee();
        OneOnOneMeeting meeting = meetingRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bản ghi id=" + id));
        if (!meeting.getManagerId().equals(manager.getId()))
            throw new AppException(ErrorCode.ACCESS_DENIED, "Bạn không có quyền xóa bản ghi này");
        meeting.softDelete(manager.getFullName());
        meetingRepo.save(meeting);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa bản ghi", null));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize(RoleAuthorization.HAS_ANY)
    @Operation(summary = "List meetings for an employee")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<PageResponse<OneOnOneMeetingDto.Response>>> listByEmployee(
            @PathVariable Long employeeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Employee me = currentEmployee();
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "meetingDate"));
        var result = meetingRepo.findByManagerIdAndEmployeeId(me.getId(), employeeId, pageable);
        return ResponseEntity.ok(ApiResponse.success("OK",
                PageResponse.of(result.map(this::toResponse))));
    }

    @GetMapping("/my")
    @PreAuthorize(RoleAuthorization.HAS_MANAGER_OR_ABOVE)
    @Operation(summary = "List all meetings created by current manager")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<PageResponse<OneOnOneMeetingDto.Response>>> listMine(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Employee me = currentEmployee();
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "meetingDate"));
        var result = meetingRepo.findByManagerId(me.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success("OK",
                PageResponse.of(result.map(this::toResponse))));
    }

    private OneOnOneMeetingDto.Response toResponse(OneOnOneMeeting m) {
        return OneOnOneMeetingDto.Response.builder()
                .id(m.getId())
                .managerId(m.getManagerId())
                .managerName(m.getManagerName())
                .employeeId(m.getEmployeeId())
                .employeeName(m.getEmployeeName())
                .meetingDate(m.getMeetingDate())
                .agenda(m.getAgenda())
                .notes(m.getNotes())
                .actionItems(m.getActionItems())
                .nextMeetingDate(m.getNextMeetingDate())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }

    private Employee currentEmployee() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return employeeRepo.findByUserUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy hồ sơ nhân viên"));
    }
}
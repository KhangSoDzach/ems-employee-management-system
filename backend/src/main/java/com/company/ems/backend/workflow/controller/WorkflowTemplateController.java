package com.company.ems.backend.workflow.controller;

import com.company.ems.backend.workflow.dto.*;
import com.company.ems.backend.workflow.service.WorkflowAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin REST controller for managing workflow templates and their approval levels.
 *
 * <p>All endpoints require the {@code ATTENDANCE_ADJUSTMENT_ADMIN} authority.
 * Base path: {@code /api/v1/admin/workflow-templates}
 */
@RestController
@RequestMapping("/api/v1/admin/workflow-templates")
@RequiredArgsConstructor
@Tag(name = "Workflow Templates (Admin)", description = "Manage approval workflow templates")
@PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_ADMIN')")
public class WorkflowTemplateController {

    private final WorkflowAdminService workflowAdminService;

    // ─── Template CRUD ────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "List all workflow templates")
    public ResponseEntity<List<WorkflowTemplateResponse>> getAll() {
        return ResponseEntity.ok(workflowAdminService.getAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a workflow template by id")
    @ApiResponse(responseCode = "404", description = "Template not found")
    public ResponseEntity<WorkflowTemplateResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(workflowAdminService.getById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new workflow template",
               description = "If isActive=true, any existing active template of the same type is deactivated.")
    public ResponseEntity<WorkflowTemplateResponse> create(
            @Valid @RequestBody WorkflowTemplateRequest request) {
        WorkflowTemplateResponse created = workflowAdminService.createTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a workflow template",
               description = "Replaces the template's header fields and its full level set.")
    public ResponseEntity<WorkflowTemplateResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody WorkflowTemplateRequest request) {
        return ResponseEntity.ok(workflowAdminService.updateTemplate(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Soft-delete a workflow template and all its levels")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        workflowAdminService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Level management ─────────────────────────────────────────────────────

    @PostMapping("/{templateId}/levels")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add a level to an existing template")
    public ResponseEntity<WorkflowLevelResponse> addLevel(
            @PathVariable Long templateId,
            @Valid @RequestBody WorkflowLevelRequest request) {
        WorkflowLevelResponse level = workflowAdminService.addLevel(templateId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(level);
    }

    @PutMapping("/{templateId}/levels/{levelId}")
    @Operation(summary = "Update a specific level within a template")
    public ResponseEntity<WorkflowLevelResponse> updateLevel(
            @PathVariable Long templateId,
            @PathVariable Long levelId,
            @Valid @RequestBody WorkflowLevelRequest request) {
        return ResponseEntity.ok(workflowAdminService.updateLevel(templateId, levelId, request));
    }

    @DeleteMapping("/{templateId}/levels/{levelId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Soft-delete a level from a template")
    public ResponseEntity<Void> deleteLevel(
            @PathVariable Long templateId,
            @PathVariable Long levelId) {
        workflowAdminService.deleteLevel(templateId, levelId);
        return ResponseEntity.noContent().build();
    }
}

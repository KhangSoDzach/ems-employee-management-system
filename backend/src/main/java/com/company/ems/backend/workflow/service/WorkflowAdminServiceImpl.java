package com.company.ems.backend.workflow.service;

import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;
import com.company.ems.backend.workflow.dto.*;
import com.company.ems.backend.workflow.entity.WorkflowLevel;
import com.company.ems.backend.workflow.entity.WorkflowTemplate;
import com.company.ems.backend.workflow.enums.AssigneeType;
import com.company.ems.backend.workflow.repository.WorkflowLevelRepository;
import com.company.ems.backend.workflow.repository.WorkflowTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WorkflowAdminServiceImpl implements WorkflowAdminService {

    private final WorkflowTemplateRepository templateRepository;
    private final MessageService       messages;
    private final WorkflowLevelRepository    levelRepository;
    private final UserRepository             userRepository;

    @Override
    public List<WorkflowTemplateResponse> getAll() {
        return templateRepository
                .findAll()
                .stream()
                .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public WorkflowTemplateResponse getById(Long templateId) {
        return toResponse(findActiveTemplate(templateId));
    }

    @Override
    @Transactional
    public WorkflowTemplateResponse createTemplate(WorkflowTemplateRequest request) {
        if (request.isActive()) {
            deactivateExistingActive(request.getWorkflowType().name());
        }

        WorkflowTemplate template = WorkflowTemplate.builder()
                .name(request.getName())
                .workflowType(request.getWorkflowType())
                .description(request.getDescription())
                .isActive(request.isActive())
                .levels(new ArrayList<>())
                .build();

        if (request.getLevels() != null) {
            for (WorkflowLevelRequest lr : request.getLevels()) {
                template.getLevels().add(buildLevel(lr, template));
            }
        }

        template = templateRepository.save(template);
        log.info("Created workflow template id={} name={}", template.getId(), template.getName());
        return toResponse(template);
    }

    @Override
    @Transactional
    public WorkflowTemplateResponse updateTemplate(Long templateId, WorkflowTemplateRequest request) {
        WorkflowTemplate template = findActiveTemplate(templateId);

        if (request.isActive() && !template.isActive()) {
            deactivateExistingActive(template.getWorkflowType().name());
        }

        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setActive(request.isActive());
        template.getLevels().clear();
        if (request.getLevels() != null) {
            for (WorkflowLevelRequest lr : request.getLevels()) {
                template.getLevels().add(buildLevel(lr, template));
            }
        }

        template = templateRepository.save(template);
        log.info("Updated workflow template id={}", template.getId());
        return toResponse(template);
    }

    @Override
    @Transactional
    public void deleteTemplate(Long templateId) {
        WorkflowTemplate template = findActiveTemplate(templateId);
        template.setIsDeleted(true);
        template.getLevels().forEach(l -> l.setIsDeleted(true));
        templateRepository.save(template);
        log.info("Soft-deleted workflow template id={}", templateId);
    }

    @Override
    @Transactional
    public WorkflowLevelResponse addLevel(Long templateId, WorkflowLevelRequest request) {
        WorkflowTemplate template = findActiveTemplate(templateId);

        boolean duplicateLevel = template.getLevels().stream()
                .filter(l -> !l.isDeleted())
                .anyMatch(l -> l.getLevelNumber() == request.getLevelNumber());
        if (duplicateLevel) {
            throw new BusinessException("DUPLICATE_LEVEL", messages.get(MessageCode.WORKFLOW_DUPLICATE_LEVEL, request.getLevelNumber(), templateId));
        }

        WorkflowLevel level = buildLevel(request, template);
        template.getLevels().add(level);
        templateRepository.save(template);
        log.info("Added level {} to template id={}", request.getLevelNumber(), templateId);
        return toLevelResponse(level);
    }

    @Override
    @Transactional
    public WorkflowLevelResponse updateLevel(Long templateId, Long levelId, WorkflowLevelRequest request) {
        findActiveTemplate(templateId);
        WorkflowLevel level = levelRepository.findById(levelId)
                .filter(l -> !Boolean.TRUE.equals(l.getIsDeleted())
                        && l.getTemplate().getId().equals(templateId))
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowLevel", "id", levelId));

        level.setLevelNumber(request.getLevelNumber());
        level.setAssigneeType(request.getAssigneeType());
        level.setNotes(request.getNotes());
        level.setTimeoutHours(request.getTimeoutHours());

        if (request.getAssigneeType() == AssigneeType.ROLE) {
            level.setAssigneeRole(request.getAssigneeRole());
            level.setAssigneeUser(null);
        } else {
            level.setAssigneeRole(null);
            level.setAssigneeUser(resolveUser(request.getAssigneeUserId()));
        }

        level = levelRepository.save(level);
        return toLevelResponse(level);
    }

    @Override
    @Transactional
    public void deleteLevel(Long templateId, Long levelId) {
        findActiveTemplate(templateId);
        WorkflowLevel level = levelRepository.findById(levelId)
                .filter(l -> !Boolean.TRUE.equals(l.getIsDeleted())
                        && l.getTemplate().getId().equals(templateId))
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowLevel", "id", levelId));
        level.setIsDeleted(true);
        levelRepository.save(level);
        log.info("Soft-deleted level id={} from template id={}", levelId, templateId);
    }

    private WorkflowTemplate findActiveTemplate(Long templateId) {
        return templateRepository.findById(templateId)
                .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowTemplate", "id", templateId));
    }

    private void deactivateExistingActive(String workflowTypeName) {
        templateRepository.findAll().stream()
                .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted())
                        && t.isActive()
                        && t.getWorkflowType().name().equals(workflowTypeName))
                .forEach(t -> {
                    t.setActive(false);
                    templateRepository.save(t);
                    log.info("Deactivated previous active template id={} type={}", t.getId(), workflowTypeName);
                });
    }

    private WorkflowLevel buildLevel(WorkflowLevelRequest lr, WorkflowTemplate template) {
        WorkflowLevel level = WorkflowLevel.builder()
                .template(template)
                .levelNumber(lr.getLevelNumber())
                .assigneeType(lr.getAssigneeType())
                .timeoutHours(lr.getTimeoutHours())
                .notes(lr.getNotes())
                .build();

        if (lr.getAssigneeType() == AssigneeType.ROLE) {
            if (lr.getAssigneeRole() == null || lr.getAssigneeRole().isBlank()) {
                throw new BusinessException("MISSING_ASSIGNEE_ROLE", messages.get(MessageCode.WORKFLOW_MISSING_ROLE));
            }
            level.setAssigneeRole(lr.getAssigneeRole());
        } else {
            if (lr.getAssigneeUserId() == null) {
                throw new BusinessException("MISSING_ASSIGNEE_USER", messages.get(MessageCode.WORKFLOW_MISSING_USER));
            }
            level.setAssigneeUser(resolveUser(lr.getAssigneeUserId()));
        }
        return level;
    }

    private User resolveUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private WorkflowTemplateResponse toResponse(WorkflowTemplate t) {
        List<WorkflowLevelResponse> levels = t.getLevels().stream()
                .filter(l -> !Boolean.TRUE.equals(l.getIsDeleted()))
                .map(this::toLevelResponse)
                .collect(Collectors.toList());

        return WorkflowTemplateResponse.builder()
                .id(t.getId())
                .name(t.getName())
                .workflowType(t.getWorkflowType().name())
                .description(t.getDescription())
                .isActive(t.isActive())
                .totalLevels(levels.size())
                .levels(levels)
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private WorkflowLevelResponse toLevelResponse(WorkflowLevel l) {
        String assigneeUserName = null;
        Long   assigneeUserId   = null;
        if (l.getAssigneeUser() != null) {
            assigneeUserId   = l.getAssigneeUser().getId();
            assigneeUserName = l.getAssigneeUser().getUsername();
        }
        return WorkflowLevelResponse.builder()
                .id(l.getId())
                .levelNumber(l.getLevelNumber())
                .assigneeType(l.getAssigneeType().name())
                .assigneeRole(l.getAssigneeRole())
                .assigneeUserId(assigneeUserId)
                .assigneeUserName(assigneeUserName)
                .timeoutHours(l.getTimeoutHours())
                .notes(l.getNotes())
                .build();
    }
}
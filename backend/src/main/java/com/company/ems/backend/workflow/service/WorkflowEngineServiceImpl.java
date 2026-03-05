package com.company.ems.backend.workflow.service;

import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.user.repository.UserRepository;
import com.company.ems.backend.workflow.entity.WorkflowLevel;
import com.company.ems.backend.workflow.entity.WorkflowTemplate;
import com.company.ems.backend.workflow.enums.AssigneeType;
import com.company.ems.backend.workflow.enums.WorkflowType;
import com.company.ems.backend.workflow.repository.WorkflowLevelRepository;
import com.company.ems.backend.workflow.repository.WorkflowTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Default implementation of {@link WorkflowEngineService}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class WorkflowEngineServiceImpl implements WorkflowEngineService {

    private final WorkflowTemplateRepository templateRepository;
    private final WorkflowLevelRepository    levelRepository;
    private final UserRepository             userRepository;

    @Override
    public WorkflowTemplate getActiveTemplate(WorkflowType workflowType) {
        return templateRepository
                .findByWorkflowTypeAndIsActiveTrueAndIsDeletedFalse(workflowType)
                .orElseThrow(() -> new BusinessException(
                        "WORKFLOW_TEMPLATE_NOT_FOUND",
                        "Không tìm thấy workflow template đang hoạt động cho: " + workflowType.name()
                                + ". Vui lòng liên hệ Admin để cấu hình."));
    }

    @Override
    public List<WorkflowLevel> getLevels(WorkflowTemplate template) {
        return levelRepository
                .findByTemplateIdAndIsDeletedFalseOrderByLevelNumberAsc(template.getId());
    }

    @Override
    public Optional<WorkflowLevel> getLevel(WorkflowTemplate template, int levelNumber) {
        return levelRepository
                .findByTemplateIdAndLevelNumberAndIsDeletedFalse(template.getId(), levelNumber);
    }

    @Override
    public List<Long> resolveApproverUserIds(WorkflowLevel level) {
        if (level == null) return Collections.emptyList();

        if (level.getAssigneeType() == AssigneeType.USER) {
            if (level.getAssigneeUser() != null) {
                return List.of(level.getAssigneeUser().getId());
            }
            log.warn("WorkflowLevel [id={}] has assigneeType=USER but no assigneeUser set.",
                    level.getId());
            return Collections.emptyList();
        }

        // ROLE type — resolve all users with the given role name
        if (level.getAssigneeRole() == null || level.getAssigneeRole().isBlank()) {
            log.warn("WorkflowLevel [id={}] has assigneeType=ROLE but no assigneeRole set.",
                    level.getId());
            return Collections.emptyList();
        }

        return userRepository.findAllByRoleName(level.getAssigneeRole())
                .stream()
                .map(u -> u.getId())
                .collect(Collectors.toList());
    }
}

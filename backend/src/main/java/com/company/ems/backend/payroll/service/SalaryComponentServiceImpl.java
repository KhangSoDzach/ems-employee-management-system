package com.company.ems.backend.payroll.service;

import java.util.List;
import java.util.Objects;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.common.exception.ConflictException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.payroll.dto.SalaryComponentRequest;
import com.company.ems.backend.payroll.dto.SalaryComponentResponse;
import com.company.ems.backend.payroll.entity.AuditLog;
import com.company.ems.backend.payroll.entity.SalaryComponent;
import com.company.ems.backend.payroll.enums.SalaryComponentAuditAction;
import com.company.ems.backend.payroll.repository.PayrollAuditLogRepository;
import com.company.ems.backend.payroll.repository.SalaryComponentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SalaryComponentServiceImpl implements SalaryComponentService {

    private static final String ENTITY_TYPE_SALARY_COMPONENT = "SALARY_COMPONENT";

    private final SalaryComponentRepository salaryComponentRepository;
    private final PayrollAuditLogRepository payrollAuditLogRepository;
    private final MessageService messages;

    @Override
    @Transactional(readOnly = true)
    public List<SalaryComponentResponse> listComponents() {
        return salaryComponentRepository.findAllByIsDeletedFalseOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @SuppressWarnings("null")
    public SalaryComponentResponse createComponent(SalaryComponentRequest request) {
        String normalizedCode = normalizeCode(request.getCode());
        String normalizedName = normalizeText(request.getName());

        if (salaryComponentRepository.existsByCodeIgnoreCaseAndIsDeletedFalse(normalizedCode)) {
            throw new ConflictException(messages.get(MessageCode.SALARY_COMPONENT_DUPLICATE_CODE, normalizedCode));
        }
        if (salaryComponentRepository.existsByNameIgnoreCaseAndIsDeletedFalse(normalizedName)) {
            throw new ConflictException(messages.get(MessageCode.SALARY_COMPONENT_DUPLICATE_NAME, normalizedName));
        }

        SalaryComponent component = SalaryComponent.builder()
                .code(normalizedCode)
                .name(normalizedName)
                .type(request.getType())
                .isTaxable(request.getIsTaxable())
                .isInsurable(request.getIsInsurable())
                .amount(request.getAmount())
                .status(request.getStatus())
                .build();

        SalaryComponent saved = Objects.requireNonNull(salaryComponentRepository.save(component));
        saveAuditLog(saved.getId(), SalaryComponentAuditAction.CREATE, null, toAuditValue(saved));

        return toResponse(saved);
    }

    @Override
    @SuppressWarnings("null")
    public SalaryComponentResponse updateComponent(Long id, SalaryComponentRequest request) {
        SalaryComponent component = salaryComponentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("SalaryComponent", "id", id));

        String normalizedCode = normalizeCode(request.getCode());
        String normalizedName = normalizeText(request.getName());

        if (salaryComponentRepository.existsByCodeIgnoreCaseAndIdNotAndIsDeletedFalse(normalizedCode, id)) {
            throw new ConflictException(messages.get(MessageCode.SALARY_COMPONENT_DUPLICATE_CODE, normalizedCode));
        }
        if (salaryComponentRepository.existsByNameIgnoreCaseAndIdNotAndIsDeletedFalse(normalizedName, id)) {
            throw new ConflictException(messages.get(MessageCode.SALARY_COMPONENT_DUPLICATE_NAME, normalizedName));
        }

        String oldValue = toAuditValue(component);

        component.setCode(normalizedCode);
        component.setName(normalizedName);
        component.setType(request.getType());
        component.setIsTaxable(request.getIsTaxable());
        component.setIsInsurable(request.getIsInsurable());
        component.setAmount(request.getAmount());
        component.setStatus(request.getStatus());

        SalaryComponent saved = Objects.requireNonNull(salaryComponentRepository.save(component));
        saveAuditLog(saved.getId(), SalaryComponentAuditAction.UPDATE, oldValue, toAuditValue(saved));

        return toResponse(saved);
    }

    @SuppressWarnings("null")
    private void saveAuditLog(Long entityId, SalaryComponentAuditAction action, String oldValue, String newValue) {
        AuditLog auditLog = AuditLog.builder()
                .entityType(ENTITY_TYPE_SALARY_COMPONENT)
                .entityId(entityId)
                .actionType(action)
                .actor(resolveActor())
                .oldValue(oldValue)
                .newValue(newValue)
            .build();
        payrollAuditLogRepository.save(auditLog);
    }

    private String resolveActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return "SYSTEM";
        }
        return authentication.getName();
    }

    private String normalizeCode(String code) {
        return normalizeText(code).toUpperCase();
    }

    private String normalizeText(String text) {
        return text == null ? "" : text.trim();
    }

    private SalaryComponentResponse toResponse(SalaryComponent component) {
        return SalaryComponentResponse.builder()
                .id(component.getId())
                .code(component.getCode())
                .name(component.getName())
                .type(component.getType())
                .isTaxable(component.getIsTaxable())
                .isInsurable(component.getIsInsurable())
                .amount(component.getAmount())
                .status(component.getStatus())
                .createdBy(component.getCreatedBy())
                .createdAt(component.getCreatedAt())
                .updatedBy(component.getUpdatedBy())
                .updatedAt(component.getUpdatedAt())
                .build();
    }

    private String toAuditValue(SalaryComponent component) {
        return String.format(
                "{\"code\":\"%s\",\"name\":\"%s\",\"type\":\"%s\",\"isTaxable\":%s,\"isInsurable\":%s,\"amount\":%s,\"status\":\"%s\"}",
                safe(component.getCode()),
                safe(component.getName()),
                component.getType(),
                component.getIsTaxable(),
                component.getIsInsurable(),
                component.getAmount() == null ? "null" : component.getAmount().toPlainString(),
                component.getStatus());
    }

    private String safe(String value) {
        return value == null ? "" : value.replace("\"", "\\\"");
    }
}

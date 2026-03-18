package com.company.ems.backend.payroll.service;

import java.math.BigDecimal;
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
import com.company.ems.backend.payroll.enums.SalaryComponentNature;
import com.company.ems.backend.payroll.enums.SalaryComponentType;
import com.company.ems.backend.payroll.repository.PayrollAuditLogRepository;
import com.company.ems.backend.payroll.repository.SalaryComponentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SalaryComponentServiceImpl implements SalaryComponentService {

    private static final String ENTITY_TYPE_SALARY_COMPONENT = "SALARY_COMPONENT";
    private static final String SYSTEM_ACTOR = "SYSTEM";
    private static final BigDecimal MAX_RATE_PERCENT = new BigDecimal("100");

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
        SalaryComponentType type = request.getType();
        SalaryComponentNature nature = resolveNature(request.getNature(), type);
        BigDecimal amount = sanitizeAmount(request.getAmount());
        BigDecimal ratePercent = sanitizeRatePercent(request.getRatePercent());

        if (salaryComponentRepository.existsByCodeIgnoreCaseAndIsDeletedFalse(normalizedCode)) {
            throw new ConflictException(messages.get(MessageCode.SALARY_COMPONENT_DUPLICATE_CODE, normalizedCode));
        }
        if (salaryComponentRepository.existsByNameIgnoreCaseAndIsDeletedFalse(normalizedName)) {
            throw new ConflictException(messages.get(MessageCode.SALARY_COMPONENT_DUPLICATE_NAME, normalizedName));
        }

        validateCalculationInput(amount, ratePercent);

        SalaryComponent component = SalaryComponent.builder()
                .code(normalizedCode)
                .name(normalizedName)
                .type(type)
                .isTaxable(resolveTaxable(request.getIsTaxable(), type))
                .isInsurable(resolveInsurable(request.getIsInsurable(), type))
                .amount(amount)
                .ratePercent(ratePercent)
                .nature(nature)
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
        SalaryComponentType type = request.getType();
        SalaryComponentNature nature = resolveNature(request.getNature(), type);
        BigDecimal amount = sanitizeAmount(request.getAmount());
        BigDecimal ratePercent = sanitizeRatePercent(request.getRatePercent());

        if (salaryComponentRepository.existsByCodeIgnoreCaseAndIdNotAndIsDeletedFalse(normalizedCode, id)) {
            throw new ConflictException(messages.get(MessageCode.SALARY_COMPONENT_DUPLICATE_CODE, normalizedCode));
        }
        if (salaryComponentRepository.existsByNameIgnoreCaseAndIdNotAndIsDeletedFalse(normalizedName, id)) {
            throw new ConflictException(messages.get(MessageCode.SALARY_COMPONENT_DUPLICATE_NAME, normalizedName));
        }

        validateCalculationInput(amount, ratePercent);

        String oldValue = toAuditValue(component);

        component.setCode(normalizedCode);
        component.setName(normalizedName);
        component.setType(type);
        component.setIsTaxable(resolveTaxable(request.getIsTaxable(), type));
        component.setIsInsurable(resolveInsurable(request.getIsInsurable(), type));
        component.setAmount(amount);
        component.setRatePercent(ratePercent);
        component.setNature(nature);
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
            return SYSTEM_ACTOR;
        }
        return authentication.getName();
    }

    private Boolean resolveTaxable(Boolean isTaxable, SalaryComponentType type) {
        if (type == SalaryComponentType.INSURANCE) {
            return false;
        }
        return Boolean.TRUE.equals(isTaxable);
    }

    private Boolean resolveInsurable(Boolean isInsurable, SalaryComponentType type) {
        if (type == SalaryComponentType.INSURANCE) {
            return false;
        }
        return Boolean.TRUE.equals(isInsurable);
    }

    private SalaryComponentNature resolveNature(SalaryComponentNature nature, SalaryComponentType type) {
        if (type == SalaryComponentType.INSURANCE) {
            return SalaryComponentNature.DEDUCTION;
        }
        if (nature != null) {
            return nature;
        }
        return type == SalaryComponentType.DEDUCTION
                ? SalaryComponentNature.DEDUCTION
                : SalaryComponentNature.INCOME;
    }

    private BigDecimal sanitizeAmount(BigDecimal amount) {
        if (amount == null) {
            return null;
        }
        return amount.stripTrailingZeros();
    }

    private BigDecimal sanitizeRatePercent(BigDecimal ratePercent) {
        if (ratePercent == null) {
            return null;
        }
        return ratePercent.stripTrailingZeros();
    }

    private void validateCalculationInput(BigDecimal amount, BigDecimal ratePercent) {
        if (amount == null && ratePercent == null) {
            throw new IllegalArgumentException("Either amount or ratePercent must be provided.");
        }
        if (ratePercent != null && ratePercent.compareTo(MAX_RATE_PERCENT) > 0) {
            throw new IllegalArgumentException("Rate percent must be less than or equal to 100.");
        }
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
                .ratePercent(component.getRatePercent())
                .nature(component.getNature())
                .status(component.getStatus())
                .createdBy(component.getCreatedBy())
                .createdAt(component.getCreatedAt())
                .updatedBy(component.getUpdatedBy())
                .updatedAt(component.getUpdatedAt())
                .build();
    }

    private String toAuditValue(SalaryComponent component) {
        return String.format(
            "{\"code\":\"%s\",\"name\":\"%s\",\"type\":\"%s\",\"isTaxable\":%s,\"isInsurable\":%s,\"amount\":%s,\"ratePercent\":%s,\"nature\":\"%s\",\"status\":\"%s\"}",
                safe(component.getCode()),
                safe(component.getName()),
                component.getType(),
                component.getIsTaxable(),
                component.getIsInsurable(),
                component.getAmount() == null ? "null" : component.getAmount().toPlainString(),
                component.getRatePercent() == null ? "null" : component.getRatePercent().toPlainString(),
                component.getNature(),
                component.getStatus());
    }

    private String safe(String value) {
        return value == null ? "" : value.replace("\"", "\\\"");
    }
}

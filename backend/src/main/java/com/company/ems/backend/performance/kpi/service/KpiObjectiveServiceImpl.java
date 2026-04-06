package com.company.ems.backend.performance.kpi.service;

import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.enums.ErrorCode;
import com.company.ems.backend.common.exception.AppException;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.department.repository.DepartmentRepository;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.performance.kpi.dto.KpiObjectiveDto;
import com.company.ems.backend.performance.kpi.entity.KpiObjective;
import com.company.ems.backend.performance.kpi.enums.KpiStatus;
import com.company.ems.backend.performance.kpi.enums.KpiType;
import com.company.ems.backend.performance.kpi.enums.ScopeType;
import com.company.ems.backend.performance.kpi.mapper.KpiObjectiveMapper;
import com.company.ems.backend.performance.kpi.repository.KpiObjectiveRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class KpiObjectiveServiceImpl implements KpiObjectiveService {

    private static final BigDecimal MAX_TOTAL_WEIGHT = BigDecimal.valueOf(100);

    private final KpiObjectiveRepository    kpiRepo;
    private final DepartmentRepository      deptRepo;
    private final EmployeeRepository        employeeRepo;
    private final KpiObjectiveMapper        mapper;
    private final MessageService            messages;

    @Override
    public KpiObjectiveDto.Response createObjective(KpiObjectiveDto.CreateRequest req) {
        requireManagerOrAbove();
        validateDateRange(req.getPeriodStart(), req.getPeriodEnd());
        validateScopeId(req.getScopeType(), req.getScopeId());
        BigDecimal existing = kpiRepo.sumWeightByScope(
                req.getScopeType(),
                req.getScopeId(),
                req.getPeriodStart(),
                req.getPeriodEnd());

        BigDecimal newTotal = existing.add(req.getWeight());
        if (newTotal.compareTo(MAX_TOTAL_WEIGHT) > 0) {
            throw new AppException(ErrorCode.VALID_PARAM_INVALID,
                    "weight",
                    String.format("%.2f%% (total would reach %.2f%%, limit: 100%%)",
                            req.getWeight().doubleValue(), newTotal.doubleValue()));
        }

        KpiStatus status = newTotal.compareTo(MAX_TOTAL_WEIGHT) == 0
                ? KpiStatus.ACTIVE
                : KpiStatus.INCOMPLETE;

        KpiObjective entity = KpiObjective.builder()
                .name(req.getName())
                .type(req.getType())
                .metricType(req.getMetricType())
                .targetValue(req.getTargetValue())
                .actualValue(BigDecimal.ZERO)
                .weight(req.getWeight())
                .description(req.getDescription())
                .scopeType(req.getScopeType())
                .scopeId(req.getScopeId())
                .periodStart(req.getPeriodStart())
                .periodEnd(req.getPeriodEnd())
                .status(status)
                .build();

        entity = kpiRepo.save(entity);
        log.info("KPI created: id=[{}] scope=[{}/{}] weight=[{}] by=[{}]",
                entity.getId(), req.getScopeType(), req.getScopeId(),
                req.getWeight(), currentUsername());
        return mapper.toResponse(entity);
    }

    @Override
    public KpiObjectiveDto.Response updateObjective(Long id, KpiObjectiveDto.UpdateRequest req) {
        requireManagerOrAbove();
        KpiObjective entity = loadActive(id);

        LocalDate periodStart = req.getPeriodStart() != null ? req.getPeriodStart() : entity.getPeriodStart();
        LocalDate periodEnd   = req.getPeriodEnd()   != null ? req.getPeriodEnd()   : entity.getPeriodEnd();
        if (req.getPeriodStart() != null || req.getPeriodEnd() != null) {
            validateDateRange(periodStart, periodEnd);
        }

        BigDecimal newWeight = req.getWeight() != null ? req.getWeight() : entity.getWeight();
        boolean weightOrPeriodChanged = req.getWeight() != null
                || req.getPeriodStart() != null || req.getPeriodEnd() != null;

        if (weightOrPeriodChanged) {
            BigDecimal otherWeights = kpiRepo.sumWeightByScopeExcluding(
                    id, entity.getScopeType(), entity.getScopeId(), periodStart, periodEnd);
            BigDecimal newTotal = otherWeights.add(newWeight);
            if (newTotal.compareTo(MAX_TOTAL_WEIGHT) > 0) {
                throw new AppException(ErrorCode.VALID_PARAM_INVALID,
                        "weight",
                        String.format("%.2f%% (total would reach %.2f%%, limit: 100%%)",
                                newWeight.doubleValue(), newTotal.doubleValue()));
            }
            entity.setStatus(newTotal.compareTo(MAX_TOTAL_WEIGHT) == 0
                    ? KpiStatus.ACTIVE : KpiStatus.INCOMPLETE);
        }

        if (req.getName()        != null) entity.setName(req.getName());
        if (req.getMetricType()  != null) entity.setMetricType(req.getMetricType());
        if (req.getTargetValue() != null) entity.setTargetValue(req.getTargetValue());
        if (req.getActualValue() != null) entity.setActualValue(req.getActualValue());
        if (req.getWeight()      != null) entity.setWeight(req.getWeight());
        if (req.getDescription() != null) entity.setDescription(req.getDescription());
        if (req.getPeriodStart() != null) entity.setPeriodStart(req.getPeriodStart());
        if (req.getPeriodEnd()   != null) entity.setPeriodEnd(req.getPeriodEnd());

        entity = kpiRepo.save(entity);
        log.info("KPI updated: id=[{}] by=[{}]", id, currentUsername());
        return mapper.toResponse(entity);
    }

    @Override
    public void deleteObjective(Long id) {
        requireManagerOrAbove();
        KpiObjective entity = loadActive(id);
        entity.softDelete(currentUsername());
        kpiRepo.save(entity);
        log.info("KPI soft-deleted: id=[{}] by=[{}]", id, currentUsername());
    }

    @Override
    @Transactional(readOnly = true)
    public KpiObjectiveDto.Response getObjective(Long id) {
        return mapper.toResponse(loadActive(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<KpiObjectiveDto.Summary> listObjectives(
            int page, int size,
            ScopeType scopeType, Long scopeId,
            KpiType type, KpiStatus status,
            String keyword) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<KpiObjective> result = kpiRepo.findFiltered(
                scopeType, scopeId, type, status,
                (keyword != null && keyword.isBlank()) ? null : keyword,
                pageable);

        List<KpiObjectiveDto.Summary> content = result.getContent().stream()
                .map(mapper::toSummary)
                .toList();

        return PageResponse.of(content, page, size,
                result.getTotalElements(), result.getTotalPages(),
                messages.get(MessageCode.KPI_LIST));
    }

    @Override
    @Transactional(readOnly = true)
    public KpiObjectiveDto.ScopeHeader getSummary(
            ScopeType scopeType, Long scopeId,
            LocalDate periodStart, LocalDate periodEnd) {

        PageRequest all = PageRequest.of(0, Integer.MAX_VALUE);
        Page<KpiObjective> page = kpiRepo.findFiltered(
                scopeType, scopeId, null, null, null, all);

        BigDecimal totalWeight = page.getContent().stream()
                .filter(k -> {
                    if (periodStart == null || periodEnd == null) return true;
                    return !k.getPeriodStart().isAfter(periodEnd)
                            && !k.getPeriodEnd().isBefore(periodStart);
                })
                .map(KpiObjective::getWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long remainingDays = periodEnd != null
                ? ChronoUnit.DAYS.between(LocalDate.now(), periodEnd)
                : 0L;

        KpiStatus activationStatus = totalWeight.compareTo(MAX_TOTAL_WEIGHT) >= 0
                ? KpiStatus.ACTIVE
                : KpiStatus.INCOMPLETE;

        return KpiObjectiveDto.ScopeHeader.builder()
                .totalWeight(totalWeight)
                .totalObjectives((int) page.getTotalElements())
                .remainingDays(Math.max(0, remainingDays))
                .activationStatus(activationStatus)
                .build();
    }

    private KpiObjective loadActive(Long id) {
        return kpiRepo.findActiveById(id).orElseThrow(() ->
                new AppException(ErrorCode.RESOURCE_NOT_FOUND, "KpiObjective id=" + id));
    }

    private void requireManagerOrAbove() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        boolean allowed = auth.getAuthorities().stream()
                .anyMatch(a -> {
                    String r = a.getAuthority();
                    return r.equals("ROLE_MANAGER")
                            || r.equals("ROLE_HR")
                            || r.equals("ROLE_ADMIN");
                });
        if (!allowed) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
    }

    private void validateDateRange(LocalDate start, LocalDate end) {
        if (start != null && end != null && !start.isBefore(end)) {
            throw new AppException(ErrorCode.VALID_PARAM_INVALID,
                    "periodEnd", "must be after periodStart (" + start + ")");
        }
    }

    private void validateScopeId(ScopeType scopeType, Long scopeId) {
        if (scopeType == ScopeType.COMPANY) return;

        if (scopeId == null) {
            throw new AppException(ErrorCode.VALID_PARAM_MISSING, "scopeId");
        }

        boolean exists = switch (scopeType) {
            case DEPARTMENT -> deptRepo.existsById(scopeId);
            case EMPLOYEE   -> employeeRepo.existsById(scopeId);
            default         -> true;
        };

        if (!exists) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                    scopeType.name() + " id=" + scopeId);
        }
    }

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }
}
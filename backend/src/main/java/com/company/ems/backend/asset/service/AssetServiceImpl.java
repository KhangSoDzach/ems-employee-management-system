package com.company.ems.backend.asset.service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.asset.dto.AssetDto;
import com.company.ems.backend.asset.entity.Asset;
import com.company.ems.backend.asset.entity.AssetHistory;
import com.company.ems.backend.asset.enums.AssetActionType;
import com.company.ems.backend.asset.enums.AssetCondition;
import com.company.ems.backend.asset.enums.AssetStatus;
import com.company.ems.backend.asset.exception.AssetStateException;
import com.company.ems.backend.asset.mapper.AssetMapper;
import com.company.ems.backend.asset.repository.AssetHistoryRepository;
import com.company.ems.backend.asset.repository.AssetRepository;
import com.company.ems.backend.asset.security.AssetDataScopeService;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AssetServiceImpl implements AssetService {

    private static final DateTimeFormatter EXPORT_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final String SORT_CREATED_AT = "createdAt";
    private static final Map<String, List<AssetActionType>> HISTORY_FILTER = Map.of(
            "assign", List.of(AssetActionType.ASSIGN_ASSET),
            "return", List.of(AssetActionType.RETURN_ASSET, AssetActionType.RETIRE_ASSET),
            "update", List.of(AssetActionType.UPDATE_ASSET, AssetActionType.CREATE_ASSET,
                    AssetActionType.CHANGE_CONDITION));

    private final AssetRepository        assetRepo;
    private final AssetHistoryRepository historyRepo;
    private final EmployeeRepository     employeeRepo;
    private final UserRepository         userRepo;
    private final AssetCodeGenerator     codeGenerator;
    private final AssetMapper            mapper;
    private final AssetDataScopeService  dataScopeService;
    private final ObjectMapper           objectMapper;
    private final MessageService         messages;

    @PersistenceContext
    private EntityManager em;

        @Override
        @Transactional(readOnly = true)
        public Long resolveAssetId(String idOrCode) {
                if (idOrCode == null || idOrCode.isBlank()) {
                        throw new ResourceNotFoundException("Asset", "id", idOrCode);
                }

                try {
                        return Long.valueOf(idOrCode);
                } catch (NumberFormatException ignored) {
                        return assetRepo.findActiveByAssetCode(idOrCode)
                                        .map(Asset::getId)
                                        .orElseThrow(() -> new ResourceNotFoundException("Asset", "code", idOrCode));
                }
        }

    @Override
    @Transactional(readOnly = true)
    public AssetDto.CodePreview previewNextCode() {
        int year = LocalDate.now().getYear();
        String prefix = "ASSET-" + year + "-";
        long count = assetRepo.countByAssetCodeStartingWith(prefix);
        int nextSeq = (int) count + 1;
        return AssetDto.CodePreview.builder()
                .nextCode(String.format("ASSET-%d-%04d", year, nextSeq))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AssetDto.Summary> listAssets(
            int page, int size, AssetStatus status, String type, String keyword) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, SORT_CREATED_AT));
        Page<Asset> assets = dataScopeService.listAssets(status, type, keyword, pageable);

        List<AssetDto.Summary> content = assets.getContent().stream()
                .map(mapper::toSummary)
                .toList();

        return PageResponse.of(content, page, size,
                assets.getTotalElements(), assets.getTotalPages(), messages.get(MessageCode.PAGE_ENTITY_ASSET));
    }

    @Override
    @Transactional(readOnly = true)
    public AssetDto.Detail getAssetById(Long id) {
        Asset asset = dataScopeService.requireAccessibleAsset(id);
        List<AssetHistory> recent = historyRepo
                .findByAssetId(id, PageRequest.of(0, 5))
                .getContent();
        return mapper.toDetail(asset, recent);
    }
    @Override
        @SuppressWarnings("null")
    public AssetDto.Detail createAsset(AssetDto.CreateRequest req) {
        CustomUserPrincipal actor = currentPrincipal();

        AssetStatus status = req.getInitialStatus() != null
                ? req.getInitialStatus()
                : AssetStatus.AVAILABLE;
        if (status == AssetStatus.ASSIGNED) {
            throw new AssetStateException(
                    messages.get(MessageCode.ASSET_CANNOT_ASSIGN, AssetStatus.ASSIGNED.name()));
        }

        String code = codeGenerator.nextCode();
        User actorUser = userRepo.findById(Objects.requireNonNull(actor.getUserId())).orElse(null);

        Asset asset = Asset.builder()
                .assetCode(code)
                .assetName(req.getAssetName())
                .assetType(req.getAssetType())
                .description(req.getDescription())
                .notes(req.getNotes())
                .purchaseDate(req.getPurchaseDate())
                .assetValue(req.getAssetValue())
                .condition(req.getCondition() != null ? req.getCondition() : AssetCondition.NEW)
                .status(status)
                .location(req.getLocation())
                .warrantyUntil(req.getWarrantyUntil())
                .supplierName(req.getSupplierName())
                .contractUntil(req.getContractUntil())
                .contractNumber(req.getContractNumber())
                .imageUrl(req.getImageUrl())
                .createdBy(actorUser)
                .build();

        asset = Objects.requireNonNull(assetRepo.save(asset));
        appendHistory(asset, AssetActionType.CREATE_ASSET, actor,
                messages.get(MessageCode.ASSET_HISTORY_CREATED, code));

        log.info("Asset created: code=[{}] by=[{}]", code, actor.getUsername());
        return mapper.toDetail(asset, List.of());
    }

    @Override
    public AssetDto.Detail updateAsset(Long id, AssetDto.UpdateRequest req) {
        Asset asset = loadActive(id);
        CustomUserPrincipal actor = currentPrincipal();
        AssetCondition prevCond = asset.getCondition();
        String oldValue = snapshot(asset);
                applyUpdateFields(asset, req);

        assetRepo.save(asset);
        String newValue = snapshot(asset);
        appendHistory(asset, AssetActionType.UPDATE_ASSET, actor,
                messages.get(MessageCode.ASSET_UPDATED), oldValue, newValue);

        if (hasConditionChanged(prevCond, req.getCondition())) {
            String detail = String.format("Tình trạng: %s → %s",
                    mapper.conditionLabel(prevCond),
                    mapper.conditionLabel(req.getCondition()));
            appendHistory(asset, AssetActionType.CHANGE_CONDITION, actor, detail, oldValue, newValue);
        }

        log.info("Asset updated: id=[{}] by=[{}]", id, actor.getUsername());
        List<AssetHistory> recent = historyRepo
                .findByAssetId(id, PageRequest.of(0, 5))
                .getContent();
        return mapper.toDetail(asset, recent);
    }

    @Override
    public void deleteAsset(Long id) {
        Asset asset = loadActive(id);
        if (asset.getStatus() == AssetStatus.ASSIGNED) {
            throw new AssetStateException(messages.get(MessageCode.ASSET_CANNOT_DELETE));
        }
        String oldValue = snapshot(asset);
        asset.setDeleted(true);
        assetRepo.save(asset);

        CustomUserPrincipal actor = currentPrincipal();
        appendHistory(asset, AssetActionType.SOFT_DELETE, actor,
                messages.get(MessageCode.ASSET_HISTORY_DELETED), oldValue, null);
        log.info("Asset deleted: id=[{}] by=[{}]", id, actor.getUsername());
    }

    @Override
    public AssetDto.Detail assignAsset(Long assetId, AssetDto.AssignRequest req) {
        Asset asset = loadActive(assetId);
        if (asset.getStatus() != AssetStatus.AVAILABLE) {
            throw new AssetStateException(
                    messages.get(MessageCode.ASSET_CANNOT_ASSIGN, asset.getStatus().name()));
        }

        CustomUserPrincipal actor = currentPrincipal();
        User actorUser = userRepo.findById(Objects.requireNonNull(actor.getUserId())).orElse(null);
        Employee target = employeeRepo.findById(Objects.requireNonNull(req.getEmployeeId()))
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", req.getEmployeeId()));

        String oldValue = snapshot(asset);
        asset.setAssignedTo(target);
        asset.setAssignedBy(actorUser);
        asset.setAssignedDate(LocalDateTime.now());
        asset.setStatus(AssetStatus.ASSIGNED);
        asset.setLocation(target.getFirstName() + " " + target.getLastName());
        assetRepo.save(asset);

        String dept  = target.getDepartment() != null ? " (" + target.getDepartment().getName() + ")" : "";
        String notes = req.getNotes() != null ? " | " + req.getNotes() : "";
        String detail = messages.get(MessageCode.ASSET_HISTORY_ASSIGNED,
                target.getFirstName() + " " + target.getLastName(), dept, notes);
        appendHistory(asset, AssetActionType.ASSIGN_ASSET, actor, detail, oldValue, snapshot(asset));

        log.info("Asset assigned: id=[{}] to empId=[{}] by=[{}]",
                assetId, req.getEmployeeId(), actor.getUsername());
        List<AssetHistory> recent = historyRepo
                .findByAssetId(assetId, PageRequest.of(0, 5))
                .getContent();
        return mapper.toDetail(asset, recent);
    }

    @Override
    public AssetDto.Detail returnAsset(Long assetId, AssetDto.ReturnRequest req) {
        Asset asset = loadActive(assetId);
        if (asset.getStatus() != AssetStatus.ASSIGNED) {
            throw new AssetStateException(
                    messages.get(MessageCode.ASSET_CANNOT_RETURN, asset.getStatus().name()));
        }

        CustomUserPrincipal actor   = currentPrincipal();
        Employee            prevEmp = asset.getAssignedTo();
        AssetCondition      prevCond = asset.getCondition();
        String              oldValue = snapshot(asset);

        asset.setCondition(req.getConditionOnReturn());
        asset.setReturnDate(LocalDateTime.now());
        AssetStatus newStatus = Boolean.TRUE.equals(req.getReadyToReuse())
                ? AssetStatus.AVAILABLE
                : AssetStatus.RETIRED;
        asset.setStatus(newStatus);
        asset.setAssignedTo(null);
        asset.setAssignedBy(null);
        asset.setAssignedDate(null);
        asset.setLocation(null);
        assetRepo.save(asset);

        String fromName = prevEmp != null
                ? prevEmp.getFirstName() + " " + prevEmp.getLastName()
                : "N/A";
        String condChange = prevCond != req.getConditionOnReturn()
                ? " | " + messages.get(MessageCode.ASSET_HISTORY_CONDITION,
                mapper.conditionLabel(prevCond),
                mapper.conditionLabel(req.getConditionOnReturn()))
                : "";
        String detail = String.format("Thu hồi từ %s%s%s",
                fromName, condChange,
                req.getNotes() != null ? " | " + req.getNotes() : "");
        String newValue = snapshot(asset);
        appendHistory(asset, AssetActionType.RETURN_ASSET, actor, detail, oldValue, newValue);

        if (prevCond != req.getConditionOnReturn()) {
            String condDetail = String.format("Tình trạng: %s → %s",
                    mapper.conditionLabel(prevCond),
                    mapper.conditionLabel(req.getConditionOnReturn()));
            appendHistory(asset, AssetActionType.CHANGE_CONDITION, actor, condDetail, oldValue, newValue);
        }

        if (newStatus == AssetStatus.RETIRED) {
            appendHistory(asset, AssetActionType.RETIRE_ASSET, actor,
                    "Chuyển trạng thái sang Đã thu hồi", oldValue, newValue);
        }

        log.info("Asset returned: id=[{}] status=[{}] by=[{}]", assetId, asset.getStatus(), actor.getUsername());

        List<AssetHistory> recent = historyRepo
                .findByAssetId(assetId, PageRequest.of(0, 5))
                .getContent();
        return mapper.toDetail(asset, recent);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AssetDto.HistoryItem> getHistory(
            Long assetId, String historyType, int page, int size) {

        dataScopeService.requireAccessibleAsset(assetId);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, SORT_CREATED_AT));

        List<AssetActionType> actionTypes = (historyType == null
                || historyType.isBlank()
                || historyType.equalsIgnoreCase("all"))
                ? null
                : HISTORY_FILTER.get(historyType.toLowerCase());

        Page<AssetHistory> histPage = historyRepo.findFiltered(assetId, actionTypes, pageable);

        List<AssetDto.HistoryItem> content = histPage.getContent().stream()
                .map(mapper::toHistoryItem)
                .toList();

        return PageResponse.of(content, page, size,
                histPage.getTotalElements(), histPage.getTotalPages(),
                messages.get(MessageCode.PAGE_ENTITY_HISTORY));
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportHistoryCsv(Long assetId) {
        dataScopeService.requireAccessibleAsset(assetId);

        List<AssetHistory> all = historyRepo
                .findByAssetId(assetId, PageRequest.of(0, Integer.MAX_VALUE))
                .getContent();

        StringBuilder csv = new StringBuilder();
        csv.append('\uFEFF');
        csv.append(messages.get(MessageCode.ASSET_CSV_HEADER)).append('\n');

        for (AssetHistory h : all) {
            csv.append(h.getCreatedAt().format(EXPORT_FMT)).append(',');
            csv.append(csvEscape(mapper.actionLabel(h.getActionType()))).append(',');
            csv.append(csvEscape(h.getActorUsername())).append(',');
            csv.append(csvEscape(h.getDetail())).append('\n');
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportAssetsCsv(AssetStatus status, String type, String keyword) {
        PageRequest pageable = PageRequest.of(0, Integer.MAX_VALUE,
                Sort.by(Sort.Direction.DESC, SORT_CREATED_AT));
        List<Asset> all = dataScopeService.listAssets(status, type, keyword, pageable).getContent();

        StringBuilder csv = new StringBuilder();
        csv.append('\uFEFF');
        csv.append(messages.get(MessageCode.ASSETS_EXPORT_CSV_HEADER)).append('\n');

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        for (Asset a : all) {
            csv.append(a.getId()).append(',');
            csv.append(csvEscape(a.getAssetCode())).append(',');
            csv.append(csvEscape(a.getAssetName())).append(',');
            csv.append(csvEscape(a.getAssetType())).append(',');
            csv.append(csvEscape(a.getCondition() != null ? a.getCondition().name() : "")).append(',');
            csv.append(csvEscape(a.getStatus()    != null ? a.getStatus().name()    : "")).append(',');

            String locUser = "";
            if (a.getAssignedTo() != null) {
                locUser = a.getAssignedTo().getFullName();
            } else if (a.getLocation() != null) {
                locUser = a.getLocation();
            }
            csv.append(csvEscape(locUser)).append(',');
            csv.append(a.getPurchaseDate()  != null ? a.getPurchaseDate().format(dtf)  : "").append(',');
            csv.append(a.getAssetValue()    != null ? a.getAssetValue().toString()      : "").append(',');
            csv.append(csvEscape(a.getSupplierName())).append(',');
            csv.append(a.getWarrantyUntil() != null ? a.getWarrantyUntil().format(dtf) : "").append('\n');
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private Asset loadActive(Long id) {
        return assetRepo.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "id", id));
    }

        private void applyUpdateFields(Asset asset, AssetDto.UpdateRequest req) {
                applyBasicUpdateFields(asset, req);
                applyAssignmentAndDateFields(asset, req);
        }

        private void applyBasicUpdateFields(Asset asset, AssetDto.UpdateRequest req) {
                if (req.getName() != null) {
                        asset.setAssetName(req.getName());
                }
                if (req.getType() != null) {
                        asset.setAssetType(req.getType());
                }
                if (req.getDescription() != null) {
                        asset.setDescription(req.getDescription());
                }
                if (req.getValue() != null) {
                        asset.setAssetValue(req.getValue());
                }
                if (req.getPurchaseDate() != null) {
                        asset.setPurchaseDate(req.getPurchaseDate());
                }
                if (req.getLocationOrUser() != null) {
                        asset.setLocation(req.getLocationOrUser());
                }
                if (req.getCondition() != null) {
                        asset.setCondition(req.getCondition());
                }
                if (req.getNote() != null) {
                        asset.setNotes(req.getNote());
                }
                if (req.getImage() != null) {
                        asset.setImageUrl(req.getImage());
                }
                if (req.getContractNumber() != null) {
                        asset.setContractNumber(req.getContractNumber());
                }
                if (req.getSupplier() != null) {
                        asset.setSupplierName(req.getSupplier());
                }
        }

        private void applyAssignmentAndDateFields(Asset asset, AssetDto.UpdateRequest req) {
                if (req.getAssignedEmployeeId() != null) {
                        Employee target = employeeRepo.findById(Objects.requireNonNull(req.getAssignedEmployeeId()))
                                        .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", req.getAssignedEmployeeId()));
                        asset.setAssignedTo(target);
                        asset.setLocation(target.getFirstName() + " " + target.getLastName());
                }
                if (req.getWarrantyDate() != null && !req.getWarrantyDate().isBlank()) {
                        asset.setWarrantyUntil(java.time.LocalDate.parse(req.getWarrantyDate()));
                }
                if (req.getContractDate() != null && !req.getContractDate().isBlank()) {
                        asset.setContractUntil(java.time.LocalDate.parse(req.getContractDate()));
                }
        }

        private boolean hasConditionChanged(AssetCondition previous, AssetCondition current) {
                return current != null && previous != current;
        }

    private CustomUserPrincipal currentPrincipal() {
        return (CustomUserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }

    private void appendHistory(Asset asset, AssetActionType action,
                               CustomUserPrincipal actor, String detail) {
        appendHistory(asset, action, actor, detail, null, null);
    }

    private void appendHistory(Asset asset, AssetActionType action,
                               CustomUserPrincipal actor, String detail, String oldValue, String newValue) {
        em.persist(AssetHistory.builder()
                .asset(asset)
                .actionType(action)
                .actorId(actor.getUserId())
                .actorUsername(actor.getUsername())
                .detail(detail)
                .oldValue(oldValue)
                .newValue(newValue)
                .build());
    }

    private String snapshot(Asset asset) {
        Employee assignedTo = asset.getAssignedTo();
        User     assignedBy = asset.getAssignedBy();

        Map<String, Object> snap = new LinkedHashMap<>();
        snap.put("id",             asset.getId());
        snap.put("assetCode",      asset.getAssetCode());
        snap.put("assetName",      asset.getAssetName());
        snap.put("assetType",      asset.getAssetType());
        snap.put("status",         asset.getStatus()    != null ? asset.getStatus().name()    : null);
        snap.put("condition",      asset.getCondition() != null ? asset.getCondition().name() : null);
        snap.put("assetValue",     asset.getAssetValue());
        snap.put("purchaseDate",   asset.getPurchaseDate()   != null ? asset.getPurchaseDate().toString()   : null);
        snap.put("location",       asset.getLocation());
        snap.put("assignedToId",   assignedTo != null ? assignedTo.getId() : null);
        snap.put("assignedToName", assignedTo != null ? (assignedTo.getFirstName() + " " + assignedTo.getLastName()) : null);
        snap.put("assignedById",   assignedBy != null ? assignedBy.getId() : null);
        snap.put("assignedDate",   asset.getAssignedDate() != null ? asset.getAssignedDate().toString() : null);
        snap.put("returnDate",     asset.getReturnDate()   != null ? asset.getReturnDate().toString()   : null);
        snap.put("deleted",        asset.isDeleted());

        try {
            return objectMapper.writeValueAsString(snap);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize asset snapshot: assetId=[{}] err=[{}]",
                    asset.getId(), e.getMessage());
            return null;
        }
    }

    private String csvEscape(String val) {
        if (val == null) return "";
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }
}
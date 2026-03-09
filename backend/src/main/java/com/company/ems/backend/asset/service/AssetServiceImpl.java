package com.company.ems.backend.asset.service;

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
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AssetServiceImpl implements AssetService {

    private static final DateTimeFormatter EXPORT_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Map<String, List<AssetActionType>> HISTORY_FILTER = Map.of(
            "assign", List.of(AssetActionType.ASSIGN_ASSET),
            "return", List.of(AssetActionType.RETURN_ASSET, AssetActionType.RETIRE_ASSET),
            "update", List.of(AssetActionType.UPDATE_ASSET, AssetActionType.CREATE_ASSET,
                    AssetActionType.CHANGE_CONDITION)
    );

    private final AssetRepository        assetRepo;
    private final AssetHistoryRepository historyRepo;
    private final EmployeeRepository     employeeRepo;
    private final AssetCodeGenerator     codeGenerator;
    private final AssetMapper            mapper;
    private final MessageService         messages;

    @Override
    @Transactional(readOnly = true)
    public AssetDto.CodePreview previewNextCode() {
        int year      = LocalDate.now().getYear();
        String prefix = "ASSET-" + year + "-";
        long count    = assetRepo.countByAssetCodeStartingWith(prefix);
        int nextSeq   = (int) count + 1;
        return AssetDto.CodePreview.builder()
                .nextCode(String.format("ASSET-%d-%04d", year, nextSeq))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AssetDto.Summary> listAssets(
            int page, int size, AssetStatus status, String type, String keyword) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Asset> assets   = assetRepo.findFiltered(status, type, keyword, pageable);

        List<AssetDto.Summary> content = assets.getContent().stream()
                .map(mapper::toSummary)
                .toList();

        return PageResponse.of(content, page, size,
                assets.getTotalElements(), assets.getTotalPages(), messages.get(MessageCode.PAGE_ENTITY_ASSET));
    }

    @Override
    @Transactional(readOnly = true)
    public AssetDto.Detail getAssetById(Long id) {
        Asset asset = loadActive(id);
        List<AssetHistory> recent = historyRepo
                .findByAssetId(id, PageRequest.of(0, 5))
                .getContent();
        return mapper.toDetail(asset, recent);
    }

    @Override
    public AssetDto.Detail createAsset(AssetDto.CreateRequest req) {
        CustomUserPrincipal actor = currentPrincipal();

        AssetStatus status = req.getInitialStatus() != null ? req.getInitialStatus() : AssetStatus.AVAILABLE;
        if (status == AssetStatus.ASSIGNED) {
            throw new AssetStateException(messages.get(MessageCode.ASSET_CANNOT_ASSIGN, AssetStatus.ASSIGNED.name()));
        }

        String code = codeGenerator.nextCode();
        Asset asset = Asset.builder()
                .assetCode(code)
                .assetName(req.getAssetName())
                .assetType(req.getAssetType())
                .description(req.getDescription())
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
                .notes(req.getNotes())
                .build();

        asset = assetRepo.save(asset);
        appendHistory(asset, AssetActionType.CREATE_ASSET, actor, messages.get(MessageCode.ASSET_HISTORY_CREATED, code));

        log.info("Asset created: code=[{}] by=[{}]", code, actor.getUsername());
        return getAssetById(asset.getId());
    }

    @Override
    public AssetDto.Detail updateAsset(Long id, AssetDto.UpdateRequest req) {
        Asset asset = loadActive(id);
        CustomUserPrincipal actor = currentPrincipal();

        if (req.getName()          != null) asset.setAssetName(req.getName());
        if (req.getType()          != null) asset.setAssetType(req.getType());
        if (req.getDescription()   != null) asset.setDescription(req.getDescription());
        if (req.getValue()         != null) asset.setAssetValue(req.getValue());
        if (req.getPurchaseDate()  != null) asset.setPurchaseDate(req.getPurchaseDate());
        if (req.getLocationOrUser()!= null) asset.setLocation(req.getLocationOrUser());
        if (req.getCondition()     != null) asset.setCondition(req.getCondition());
        if (req.getNote()          != null) asset.setNotes(req.getNote());
        if (req.getImage()         != null) asset.setImageUrl(req.getImage());

        if (req.getWarrantyDate()  != null && !req.getWarrantyDate().isBlank())
            asset.setWarrantyUntil(LocalDate.parse(req.getWarrantyDate()));
        if (req.getSupplier()      != null) asset.setSupplierName(req.getSupplier());
        if (req.getContractDate()  != null && !req.getContractDate().isBlank())
            asset.setContractUntil(LocalDate.parse(req.getContractDate()));
        if (req.getContractNumber()!= null) asset.setContractNumber(req.getContractNumber());

        assetRepo.save(asset);
        appendHistory(asset, AssetActionType.UPDATE_ASSET, actor, messages.get(MessageCode.ASSET_HISTORY_UPDATED));

        log.info("Asset updated: id=[{}] by=[{}]", id, actor.getUsername());
        return getAssetById(id);
    }

    @Override
    public void deleteAsset(Long id) {
        Asset asset = loadActive(id);
        if (asset.getStatus() == AssetStatus.ASSIGNED) {
            throw new AssetStateException(messages.get(MessageCode.ASSET_CANNOT_DELETE));
        }
        asset.setDeleted(true);
        assetRepo.save(asset);

        CustomUserPrincipal actor = currentPrincipal();
        appendHistory(asset, AssetActionType.SOFT_DELETE, actor, messages.get(MessageCode.ASSET_HISTORY_DELETED));
        log.info("Asset deleted: id=[{}] by=[{}]", id, actor.getUsername());
    }

    @Override
    public AssetDto.Detail assignAsset(Long assetId, AssetDto.AssignRequest req) {
        Asset asset = loadActive(assetId);
        if (asset.getStatus() != AssetStatus.AVAILABLE) {
            throw new AssetStateException(
                    messages.get(MessageCode.ASSET_CANNOT_ASSIGN, asset.getStatus().name()));
        }

        CustomUserPrincipal actor  = currentPrincipal();
        Employee            target = employeeRepo.findById(req.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", req.getEmployeeId()));

        asset.setAssignedTo(target);
        asset.setAssignedDate(LocalDateTime.now());
        asset.setStatus(AssetStatus.ASSIGNED);
        asset.setLocation(target.getFirstName() + " " + target.getLastName());
        assetRepo.save(asset);

        String dept   = target.getDepartment() != null ? " (" + target.getDepartment().getName() + ")" : "";
        String notes  = req.getNotes() != null ? " | " + req.getNotes() : "";
        String detail = messages.get(MessageCode.ASSET_HISTORY_ASSIGNED,
                target.getFirstName() + " " + target.getLastName(), dept, notes);
        appendHistory(asset, AssetActionType.ASSIGN_ASSET, actor, detail);

        log.info("Asset assigned: id=[{}] to empId=[{}] by=[{}]", assetId, req.getEmployeeId(), actor.getUsername());
        return getAssetById(assetId);
    }

    @Override
    public AssetDto.Detail returnAsset(Long assetId, AssetDto.ReturnRequest req) {
        Asset asset = loadActive(assetId);
        if (asset.getStatus() != AssetStatus.ASSIGNED) {
            throw new AssetStateException(messages.get(MessageCode.ASSET_CANNOT_RETURN, asset.getStatus().name()));
        }

        CustomUserPrincipal actor    = currentPrincipal();
        Employee            prevEmp  = asset.getAssignedTo();
        AssetCondition      prevCond = asset.getCondition();

        asset.setCondition(req.getConditionOnReturn());
        asset.setReturnDate(LocalDateTime.now());
        asset.setStatus(Boolean.TRUE.equals(req.getReadyToReuse())
                ? AssetStatus.AVAILABLE : AssetStatus.RETIRED);
        asset.setAssignedTo(null);
        asset.setAssignedDate(null);
        asset.setLocation(null);
        assetRepo.save(asset);

        String fromName = prevEmp != null
                ? prevEmp.getFirstName() + " " + prevEmp.getLastName() : "N/A";
        String condChange = prevCond != req.getConditionOnReturn()
                ? " | " + messages.get(MessageCode.ASSET_HISTORY_CONDITION,
                mapper.conditionLabel(prevCond),
                mapper.conditionLabel(req.getConditionOnReturn()))
                : "";
        String notes2  = req.getNotes() != null ? " | " + req.getNotes() : "";
        String detail = messages.get(MessageCode.ASSET_HISTORY_RETURNED, fromName, condChange, notes2);
        appendHistory(asset, AssetActionType.RETURN_ASSET, actor, detail);

        log.info("Asset returned: id=[{}] status=[{}] by=[{}]", assetId, asset.getStatus(), actor.getUsername());
        return getAssetById(assetId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AssetDto.HistoryItem> getHistory(
            Long assetId, String historyType, int page, int size) {

        loadActive(assetId);

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

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
                histPage.getTotalElements(), histPage.getTotalPages(), messages.get(MessageCode.PAGE_ENTITY_HISTORY));
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportHistoryCsv(Long assetId) {
        loadActive(assetId);

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

    private Asset loadActive(Long id) {
        return assetRepo.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "id", id));
    }

    private CustomUserPrincipal currentPrincipal() {
        return (CustomUserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }

    private void appendHistory(Asset asset, AssetActionType action,
                               CustomUserPrincipal actor, String detail) {
        historyRepo.save(AssetHistory.builder()
                .asset(asset)
                .actionType(action)
                .actorId(actor.getUserId())
                .actorUsername(actor.getUsername())
                .detail(detail)
                .build());
    }

    private String csvEscape(String val) {
        if (val == null) return "";
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }
}
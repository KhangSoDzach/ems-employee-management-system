package com.company.ems.backend.asset.incident.service;

import com.company.ems.backend.asset.entity.Asset;
import com.company.ems.backend.asset.entity.AssetHistory;
import com.company.ems.backend.asset.enums.AssetActionType;
import com.company.ems.backend.asset.enums.AssetCondition;
import com.company.ems.backend.asset.incident.entity.AssetIncidentReport;
import com.company.ems.backend.asset.incident.entity.IncidentType;
import com.company.ems.backend.asset.incident.entity.ReportStatus;
import com.company.ems.backend.asset.incident.repository.AssetIncidentReportRepository;
import com.company.ems.backend.asset.repository.AssetHistoryRepository;
import com.company.ems.backend.asset.repository.AssetRepository;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.auditlog.service.AuditLogService;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.message.MessageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class IncidentServiceImplTest {

    @Mock
    private AssetIncidentReportRepository incidentRepo;
    @Mock
    private AssetRepository assetRepo;
    @Mock
    private AssetHistoryRepository historyRepo;
    @Mock
    private EmployeeRepository employeeRepo;
    @Mock
    private UserRepository userRepo;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private IncidentCodeGenerator codeGenerator;
    @Mock
    private IncidentMapper mapper;
    @Mock
    private MessageService messages;

    @InjectMocks
    private IncidentServiceImpl incidentService;

    @Captor
    private ArgumentCaptor<AssetHistory> historyCaptor;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void approveReport_shouldPersistAssetConditionAndWriteHistory() {
        // Arrange
        User processor = new User();
        processor.setId(99L);
        processor.setUsername("hr.user");

        Employee emp = new Employee();
        emp.setId(50L);

        Asset asset = Asset.builder()
                .id(123L)
                .assetCode("ASSET-2026-0001")
                .condition(AssetCondition.GOOD)
                .build();

        AssetIncidentReport report = AssetIncidentReport.builder()
                .id(7L)
                .reportCode("RPT-0007")
                .asset(asset)
                .incidentType(IncidentType.DAMAGED)
                .status(ReportStatus.PENDING)
                .reportedBy(emp)
                .reportedAt(LocalDateTime.now())
                .build();

        when(incidentRepo.findById(7L)).thenReturn(Optional.of(report));
        when(userRepo.findById(processor.getId())).thenReturn(Optional.of(processor));
        // assetRepo.save should return the asset
        when(assetRepo.save(any(Asset.class))).thenAnswer(inv -> inv.getArgument(0));
        when(incidentRepo.save(any(AssetIncidentReport.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomUserPrincipal principal = mock(CustomUserPrincipal.class);
        when(principal.getUserId()).thenReturn(processor.getId());

        // Act
        incidentService.approveReport(7L, null, principal);

        // Assert
        verify(assetRepo, times(1)).save(any(Asset.class));
        verify(historyRepo, times(1)).save(historyCaptor.capture());
        AssetHistory saved = historyCaptor.getValue();
        assertThat(saved.getActionType()).isEqualTo(AssetActionType.CHANGE_CONDITION);
        assertThat(saved.getActorUsername()).isEqualTo(processor.getUsername());
        assertThat(saved.getAsset()).isNotNull();
        assertThat(saved.getNewValue()).contains(AssetCondition.DAMAGED.name());
    }

    @Test
    void approveReport_withLegacyLostAssetType_shouldPersistLostCondition() {
        User processor = new User();
        processor.setId(99L);
        processor.setUsername("hr.user");

        Employee emp = new Employee();
        emp.setId(50L);

        Asset asset = Asset.builder()
                .id(123L)
                .assetCode("ASSET-2026-0002")
                .condition(AssetCondition.GOOD)
                .build();

        AssetIncidentReport report = AssetIncidentReport.builder()
                .id(8L)
                .reportCode("RPT-0008")
                .asset(asset)
                .incidentType(IncidentType.LOST_ASSET)
                .status(ReportStatus.PENDING)
                .reportedBy(emp)
                .reportedAt(LocalDateTime.now())
                .build();

        when(incidentRepo.findById(8L)).thenReturn(Optional.of(report));
        when(userRepo.findById(processor.getId())).thenReturn(Optional.of(processor));
        when(assetRepo.save(any(Asset.class))).thenAnswer(inv -> inv.getArgument(0));
        when(incidentRepo.save(any(AssetIncidentReport.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomUserPrincipal principal = mock(CustomUserPrincipal.class);
        when(principal.getUserId()).thenReturn(processor.getId());

        incidentService.approveReport(8L, null, principal);

        verify(assetRepo, times(1)).save(any(Asset.class));
        verify(historyRepo, times(1)).save(historyCaptor.capture());
        AssetHistory saved = historyCaptor.getValue();
        assertThat(saved.getNewValue()).contains(AssetCondition.LOST.name());
    }

    @Test
    void submitReport_whenAssetNotAssignedToEmployee_shouldThrowAccessDenied() {
        // Arrange
        Employee emp = new Employee();
        emp.setId(50L);
        Asset asset = Asset.builder().id(200L).assignedTo(null).build();
        when(assetRepo.findActiveById(200L)).thenReturn(Optional.of(asset));

        CustomUserPrincipal principal = mock(CustomUserPrincipal.class);
        when(principal.getUserId()).thenReturn(50L);

        when(employeeRepo.findByUserId(50L)).thenReturn(Optional.of(emp));

        // Act / Assert
        assertThrows(AccessDeniedException.class, () -> incidentService.submitReport(200L, null, null, principal));
    }
}

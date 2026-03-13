package com.company.ems.backend.asset.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.company.ems.backend.asset.entity.Asset;
import com.company.ems.backend.asset.enums.AssetCondition;
import com.company.ems.backend.asset.enums.AssetStatus;
import com.company.ems.backend.asset.repository.AssetRepository;
import com.company.ems.backend.asset.security.AssetDataScopeService;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.employee.entity.Employee;

@ExtendWith(MockitoExtension.class)
public class AssetServiceImplTest {

    @Mock
    private AssetDataScopeService dataScopeService;

    @Mock
    private MessageService messages;

        @Mock
        private AssetRepository assetRepo;

    @InjectMocks
    private AssetServiceImpl assetService;

    private Asset testAsset;

    @BeforeEach
    void setUp() {
        testAsset = new Asset();
        testAsset.setId(10L);
        testAsset.setAssetCode("AST-001");
        testAsset.setAssetName("MacBook Pro");
        testAsset.setAssetType("Laptop");
        testAsset.setCondition(AssetCondition.GOOD);
        testAsset.setStatus(AssetStatus.AVAILABLE);

        Employee assignee = new Employee();
        assignee.setFirstName("John");
        assignee.setLastName("Doe");
        testAsset.setAssignedTo(assignee);

        testAsset.setPurchaseDate(LocalDate.of(2023, 1, 15));
        testAsset.setAssetValue(new BigDecimal("1500.00"));
        testAsset.setSupplierName("Apple");
        testAsset.setWarrantyUntil(LocalDate.of(2025, 1, 15));
    }

    @Test
    void testExportAssetsCsv() {
        when(dataScopeService.listAssets(any(), any(), any(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(testAsset)));

        when(messages.get(MessageCode.ASSETS_EXPORT_CSV_HEADER)).thenReturn(
                "ID,Mã tài sản,Tên tài sản,Loại,Tình trạng,Trạng thái,Người/Vị trí sử dụng,Ngày mua,Giá trị,Nhà cung cấp,Bảo hành đến");

        byte[] csvBytes = assetService.exportAssetsCsv(null, null, null);
        assertNotNull(csvBytes);

        String csvString = new String(csvBytes, StandardCharsets.UTF_8);

        // Starts with BOM
        assertArrayEquals(new byte[] { (byte) 0xEF, (byte) 0xBB, (byte) 0xBF }, java.util.Arrays.copyOf(csvBytes, 3));

        // Contains header
        org.junit.jupiter.api.Assertions.assertTrue(csvString.contains(
                "ID,Mã tài sản,Tên tài sản,Loại,Tình trạng,Trạng thái,Người/Vị trí sử dụng,Ngày mua,Giá trị,Nhà cung cấp,Bảo hành đến"));

        // Contains row
        org.junit.jupiter.api.Assertions.assertTrue(csvString.contains(
                "10,\"AST-001\",\"MacBook Pro\",\"Laptop\",\"GOOD\",\"AVAILABLE\",\"John Doe\",15/01/2023,1500.00,\"Apple\",15/01/2025"));
    }

        @Test
        void testResolveAssetIdWithNumericId() {
                Long resolved = assetService.resolveAssetId("123");
                assertEquals(123L, resolved);
        }

        @Test
        void testResolveAssetIdWithAssetCode() {
                when(assetRepo.findActiveByAssetCode("AST-2026-0003")).thenReturn(java.util.Optional.of(testAsset));

                Long resolved = assetService.resolveAssetId("AST-2026-0003");

                assertEquals(10L, resolved);
        }
}

package com.company.ems.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.company.ems.backend.attendance.service.OfficeConfigService;

@SpringBootTest
@ActiveProfiles("test")
class EmsBackendApplicationTests {

	@MockitoBean
	private OfficeConfigService officeConfigService;

	@Test
	void contextLoads() {
	}

}

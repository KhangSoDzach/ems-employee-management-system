package com.company.ems.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import com.company.ems.backend.attendance.service.OfficeConfigService;

@SpringBootTest
class EmsBackendApplicationTests {

	@MockBean
	private OfficeConfigService officeConfigService;

	@Test
	void contextLoads() {
	}

}

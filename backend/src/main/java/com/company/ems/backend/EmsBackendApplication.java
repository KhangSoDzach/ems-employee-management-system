package com.company.ems.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class EmsBackendApplication {
	public static void main(String[] args) {
		SpringApplication.run(EmsBackendApplication.class, args);
	}
}

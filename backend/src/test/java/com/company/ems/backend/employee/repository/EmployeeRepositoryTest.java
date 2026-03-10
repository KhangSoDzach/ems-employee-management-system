package com.company.ems.backend.employee.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import com.company.ems.backend.department.entity.Department;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.position.entity.Position;

@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.ANY)
public class EmployeeRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Test
    void findByEmail_and_existsByEmail_work() {
        Department dept = Department.builder().code("DEV").name("Development").build();
        em.persist(dept);

        Position pos = Position.builder().code("DEV1").title("Developer").department(dept).level(1).build();
        em.persist(pos);

        Employee e = Employee.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .hireDate(LocalDate.of(2020, 1, 1))
                .department(dept)
                .position(pos)
                .build();

        em.persistAndFlush(e);

        Optional<Employee> found = employeeRepository.findByEmail("john@example.com");
        assertThat(found).isPresent();
        assertThat(found.get().getFirstName()).isEqualTo("John");

        boolean exists = employeeRepository.existsByEmail("john@example.com");
        assertThat(exists).isTrue();
    }

    @Test
    void findAllActive_returns_active_employees() {
        Department dept = Department.builder().code("OPS").name("Ops").build();
        em.persist(dept);

        Position pos = Position.builder().code("OPS1").title("Ops Eng").department(dept).level(1).build();
        em.persist(pos);

        Employee a = Employee.builder().firstName("A").lastName("One").email("a@x.com")
                .dateOfBirth(LocalDate.of(1991, 1, 1)).hireDate(LocalDate.of(2021, 1, 1)).department(dept)
                .position(pos).build();
        em.persistAndFlush(a);

        List<Employee> active = employeeRepository.findAllActive();
        assertThat(active).isNotEmpty();
        assertThat(active.stream().anyMatch(x -> "a@x.com".equals(x.getEmail()))).isTrue();
    }
}

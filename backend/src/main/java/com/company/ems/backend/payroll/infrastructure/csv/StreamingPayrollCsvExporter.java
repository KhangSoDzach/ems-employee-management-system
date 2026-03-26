package com.company.ems.backend.payroll.infrastructure.csv;
import com.company.ems.backend.payroll.entity.Payroll;
import com.company.ems.backend.payroll.repository.PayrollRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class StreamingPayrollCsvExporter implements PayrollCsvExporter {

    private static final byte[] UTF8_BOM = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};

    private static final String HEADER = String.join(",",
            "Mã NV", "Họ tên", "Phòng ban", "Vị trí",
            "Kỳ lương",
            "Lương cơ bản",
            "Phụ cấp",
            "Khấu trừ BH",
            "Thuế TNCN",
            "Tổng khấu trừ",
            "Thực lĩnh (Net)",
            "Trạng thái"
    );

    private final PayrollRepository payrollRepository;

    @Override
    @Transactional(readOnly = true)
    public void export(int month, int year, OutputStream out) throws IOException {
        log.info("[Export] Starting CSV export for period {:02d}/{}", month, year);
        out.write(UTF8_BOM);

        try (PrintWriter writer = new PrintWriter(
                new BufferedWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8)));
             Stream<Payroll> stream = payrollRepository.streamByPeriod(month, year)) {

            writer.println(HEADER);

            long[] counter = {0};

            stream.forEach(p -> {
                writer.println(buildRow(p));
                writer.flush();  // drain response buffer — crucial for large exports
                counter[0]++;
            });

            log.info("[Export] CSV export complete — {} rows written", counter[0]);
        }
    }

    private String buildRow(Payroll p) {
        var emp   = p.getEmployee();
        String empName = emp.getFirstName() + " " + emp.getLastName();
        String dept    = emp.getDepartment() != null ? emp.getDepartment().getName() : "";
        String pos     = emp.getPosition()   != null ? emp.getPosition().getTitle()  : "";
        String period  = String.format("%02d/%d", p.getPayrollMonth(), p.getPayrollYear());

        BigDecimal insurance = nvl(p.getInsuranceDeduction());
        BigDecimal tax       = nvl(p.getTaxDeduction());
        BigDecimal totalDed  = insurance.add(tax);

        return String.join(",",
                csv(emp.getEmployeeCode()),
                csv(empName),
                csv(dept),
                csv(pos),
                csv(period),
                num(p.getBasicSalary()),
                num(p.getAllowances()),
                num(insurance),
                num(tax),
                num(totalDed),
                num(p.getNetPay()),
                csv(p.getStatus().name())
        );
    }

    private static String csv(String value) {
        if (value == null) return "\"\"";
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }

    private static String num(BigDecimal value) {
        return value != null ? value.toPlainString() : "0";
    }

    private static BigDecimal nvl(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}

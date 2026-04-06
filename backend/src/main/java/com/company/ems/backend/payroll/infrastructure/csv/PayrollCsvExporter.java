package com.company.ems.backend.payroll.infrastructure.csv;
import java.io.IOException;
import java.io.OutputStream;

public interface PayrollCsvExporter {
    void export(int month, int year, OutputStream out) throws IOException;
}

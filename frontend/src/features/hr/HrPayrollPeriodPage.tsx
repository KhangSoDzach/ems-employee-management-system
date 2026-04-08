/**
 * @file HrPayrollPeriodPage.tsx
 * @description Trang xem danh sách các kỳ lương đã thực hiện cho HR.
 * Page for viewing the list of executed payroll periods for HR.
 */

import { PayrollPeriodView } from "@/features/hr/components/PayrollPeriodView";
import { PAYROLL_HR_CONSTANTS } from "../../constants/payroll.constants";

/**
 * @component HrPayrollPeriodPage
 * @description Thành phần trang hiển thị tổng quan các kỳ lương.
 * Page component displaying an overview of payroll periods.
 */
export default function HrPayrollPeriodPage() {
  return (
    <main className="flex flex-col flex-1 overflow-hidden bg-background p-4 pt-6 md:p-6 gap-4">
      <div className="shrink-0">
        <h1 className="page-heading">{PAYROLL_HR_CONSTANTS.VIEW.TITLE}</h1>
        <p className="text-sm text-muted-foreground">
          {PAYROLL_HR_CONSTANTS.VIEW.SUBTITLE}
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <PayrollPeriodView />
      </div>
    </main>
  );
}

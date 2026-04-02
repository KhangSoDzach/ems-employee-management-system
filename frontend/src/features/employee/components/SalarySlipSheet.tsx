import { DollarSign, Gift, Percent, FileText } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { SYSTEM_MESSAGES } from "@/constants/messages";

/**
 * Interface representing a detailed payroll record (Salary Slip).
 * All monetary values are expected to be pre-formatted strings (e.g., "10.000.000đ")
 * coming directly from the backend via SalaryHistoryPage.
 */
export type SalarySlip = {
  id: number;
  period: string; // e.g., "Tháng 03/2026"
  paymentDate: string;
  baseSalary: string;
  bonus: Array<{ label: string; amount: string }>;
  allowances: Array<{ label: string; amount: string }>;
  deductions: Array<{ label: string; amount: string }>;
  totalIncome: string;
  totalDeductions: string;
  netPay: string;
  status: "paid" | "pending";

  // Metadata provided by backend for HR/Admin views
  employeeName?: string;
  employeeId?: string;
  department?: string;
  role?: string;
  paymentMethod?: string;
  paymentReference?: string;
};

interface SalarySlipSheetProps {
  slip: SalarySlip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * SalarySlipSheet Component
 * Provides a premium, read-only side-sheet view of an employee's payroll details.
 * Data is sourced from the Backend (EMS DB) via the payroll management use cases.
 */
export const SalarySlipSheet = ({
  slip,
  open,
  onOpenChange,
}: SalarySlipSheetProps) => {
  // If no slip is selected, don't render the content
  if (!slip) {
    return null;
  }

  // Pre-process collections for safe mapping
  const allowances = slip.allowances ?? [];
  const deductions = slip.deductions ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-l shadow-2xl overflow-hidden bg-background">
        {/* Visual Header Decoration */}
        <div className="px-6 py-8 border-b bg-muted/10 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

          <div className="relative">
            <SheetHeader className="text-left space-y-1">
              <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
                {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_TITLE}
              </SheetTitle>

              <SheetDescription className="text-sm font-medium text-muted-foreground">
                {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_DESC}
              </SheetDescription>

              <div className="mt-6 flex flex-col gap-4">
                {/* Employee Info Section (Visible if metadata exists - usually for HR view) */}
                {slip.employeeName && (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      {slip.employeeName}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {slip.employeeId ?? ""}
                      {slip.department ? ` • ${slip.department}` : ""}
                      {slip.role ? ` • ${slip.role}` : ""}
                    </p>
                  </div>
                )}

                {/* Status and Period Metadata */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={slip.status === "paid" ? "secondary" : "outline"}
                      className={`text-[11px] px-2 py-0.5 font-bold uppercase ${
                        slip.status === "paid"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400"
                      }`}
                    >
                      {slip.status === "paid"
                        ? SYSTEM_MESSAGES.SALARY_HISTORY.STATUS_PAID
                        : SYSTEM_MESSAGES.SALARY_HISTORY.STATUS_PENDING}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {slip.period}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">
                        {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_PAYMENT_DATE}:
                      </span>{" "}
                      {slip.paymentDate}
                    </p>
                    {slip.paymentMethod && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">
                          {SYSTEM_MESSAGES.SALARY_HISTORY.LABEL_METHOD_SHORT}:
                        </span>{" "}
                        {slip.paymentMethod}
                      </p>
                    )}
                    {slip.paymentReference && (
                      <p className="text-xs text-muted-foreground font-mono">
                        <span className="font-semibold">
                          {SYSTEM_MESSAGES.SALARY_HISTORY.LABEL_REF_SHORT}:
                        </span>{" "}
                        {slip.paymentReference}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8 pb-12">
            {/* 1. Base Salary Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <DollarSign className="w-5 h-5" />
                <h3 className="font-bold text-sm tracking-widest uppercase">
                  {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_BASE_SALARY}
                </h3>
              </div>
              <div className="bg-muted/30 rounded-2xl p-5 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_BASE_SALARY}
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {slip.baseSalary}
                  </span>
                </div>
              </div>
            </section>

            {/* 2. Allowances & Income Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Gift className="w-5 h-5" />
                <h3 className="font-bold text-sm tracking-widest uppercase">
                  {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_ALLOWANCES}
                </h3>
              </div>
              <div className="bg-emerald-50/30 dark:bg-emerald-950/10 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/30 space-y-4">
                {allowances.length > 0 ? (
                  allowances.map((a) => (
                    <div
                      key={a.label}
                      className="flex justify-between items-center group"
                    >
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {a.label}
                      </span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        + {a.amount}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-center text-muted-foreground italic italic">
                    {SYSTEM_MESSAGES.COMMON_EN.NO_DATA}
                  </p>
                )}

                <div className="pt-4 border-t border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center">
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_TOTAL_ALLOWANCES}
                  </span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                    {slip.totalIncome}
                  </span>
                </div>
              </div>
            </section>

            {/* 3. Deductions Section (Insurance, Tax, etc.) */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-rose-500">
                <Percent className="w-5 h-5" />
                <h3 className="font-bold text-sm tracking-widest uppercase">
                  {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_DEDUCTIONS}
                </h3>
              </div>
              <div className="bg-rose-50/30 dark:bg-rose-950/10 rounded-2xl p-5 border border-rose-100 dark:border-rose-950/30 space-y-4">
                {deductions.length > 0 ? (
                  deductions.map((d) => (
                    <div
                      key={d.label}
                      className="flex justify-between items-center group"
                    >
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {d.label}
                      </span>
                      <span className="text-sm font-bold text-rose-500">
                        - {d.amount}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-center text-muted-foreground italic">
                    {SYSTEM_MESSAGES.COMMON_EN.NO_DATA}
                  </p>
                )}

                <div className="pt-4 border-t border-rose-100 dark:border-rose-950/30 flex justify-between items-center">
                  <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
                    {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_TOTAL_DEDUCTIONS}
                  </span>
                  <span className="text-lg font-black text-rose-700 dark:text-rose-400">
                    {slip.totalDeductions}
                  </span>
                </div>
              </div>
            </section>

            {/* 4. Final Net Pay (Total Take-home) */}
            <div className="bg-primary shadow-xl shadow-primary/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center transform transition-transform hover:scale-[1.02]">
              <span className="text-[10px] font-black text-primary-foreground/60 uppercase tracking-[0.3em] mb-2">
                {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_NET_PAY}
              </span>
              <span className="text-4xl font-black text-primary-foreground tabular-nums">
                {slip.netPay}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-6 border-t bg-muted/30 flex flex-col gap-3 shrink-0">
          <Button
            variant="default"
            className="w-full h-12 rounded-xl flex items-center justify-center gap-3 font-bold text-base shadow-lg transition-all active:scale-[0.98]"
            onClick={() => {
              // PDF/Print Logic: Generate a secure, non-interactive printable document
              const t = SYSTEM_MESSAGES.SALARY_HISTORY;

              const allowanceRows = (slip.allowances ?? [])
                .map(
                  (a) =>
                    `<tr><td style="padding:8px 0;color:#444;border-bottom:1px solid #f3f4f6">${a.label}</td><td style="text-align:right;color:#059669;font-weight:bold;border-bottom:1px solid #f3f4f6">+ ${a.amount}</td></tr>`,
                )
                .join("");
              const deductionRows = (slip.deductions ?? [])
                .map(
                  (d) =>
                    `<tr><td style="padding:8px 0;color:#444;border-bottom:1px solid #f3f4f6">${d.label}</td><td style="text-align:right;color:#dc2626;font-weight:bold;border-bottom:1px solid #f3f4f6">- ${d.amount}</td></tr>`,
                )
                .join("");

              const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"/><title>${t.PDF_TITLE} - ${slip.period}</title>
              <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#1e293b;background:#f8fafc}
              .container{max-width:700px;margin:40px auto;background:#fff;padding:48px;border-radius:16px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)}
              .header{display:flex;justify-content:space-between;align-items:start;margin-bottom:40px;border-bottom:2px solid #e2e8f0;padding-bottom:24px}
              .company-info h1{color:#e41b21;font-size:28px;font-weight:900;margin-bottom:4px;letter-spacing:-0.5px}
              .period-badge{background:#f1f5f9;color:#475569;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:700;margin-top:8px;display:inline-block}
              .emp-box{background:#f8fafc;padding:20px;border-radius:12px;margin-bottom:32px;display:grid;grid-template-columns:1fr 1fr;gap:20px}
              .emp-item label{font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;display:block;margin-bottom:4px}
              .emp-item span{font-weight:600;color:#1e293b}
              .section{margin-bottom:32px}.section-title{font-size:12px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;display:flex;align-items:center;gap:8px}
              table{width:100%;border-collapse:collapse}
              .summary-row{display:flex;justify-content:space-between;padding:16px 0;margin-top:8px;font-weight:800;font-size:16px}
              .net-box{background:#e41b21;color:#fff;border-radius:16px;padding:32px;text-align:center;margin-top:40px;box-shadow:0 20px 25px -5px rgba(228,27,33,0.25)}
              .net-label{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:3px;opacity:0.8;margin-bottom:8px}
              .net-amount{font-size:48px;font-weight:900}
              @media print{body{background:#fff}.container{box-shadow:none;margin:0;width:100%;max-width:100%;padding:20px}}</style></head><body>
              <div class="container">
                <div class="header">
                  <div class="company-info"><h1>${t.PDF_TITLE}</h1><div class="period-badge">${slip.period}</div></div>
                  <div style="text-align:right">
                    <div style="font-weight:800;color:${slip.status === "paid" ? "#059669" : "#d97706"}">
                      ${slip.status === "paid" ? t.STATUS_PAID_CAP : t.STATUS_PENDING_CAP}
                    </div>
                    <div style="font-size:12px;color:#64748b;margin-top:4px">${t.PDF_LABEL_EXPORT_DATE}: ${new Date().toLocaleDateString("vi-VN")}</div>
                  </div>
                </div>
                <div class="emp-box">
                  <div class="emp-item"><label>${t.PDF_LABEL_EMPLOYEE}</label><span>${slip.employeeName || "N/A"}</span></div>
                  <div class="emp-item"><label>${t.PDF_LABEL_CODE}</label><span>${slip.employeeId || "N/A"}</span></div>
                  <div class="emp-item"><label>${t.PDF_LABEL_DEPT}</label><span>${slip.department || "N/A"}</span></div>
                  <div class="emp-item"><label>${t.PDF_LABEL_DATE}</label><span>${slip.paymentDate}</span></div>
                </div>
                <div class="section">
                  <div class="section-title">${t.PDF_LABEL_INCOME_DETAIL}</div>
                  <table><tbody>
                    <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">${t.SHEET_BASE_SALARY}</td><td style="text-align:right;font-weight:bold;border-bottom:1px solid #f3f4f6">${slip.baseSalary}</td></tr>
                    ${allowanceRows}
                  </tbody></table>
                  <div class="summary-row" style="color:#059669"><span>${t.PDF_LABEL_TOTAL_INCOME}</span><span>${slip.totalIncome}</span></div>
                </div>
                <div class="section">
                  <div class="section-title">${t.PDF_LABEL_DEDUCTION_DETAIL}</div>
                  <table><tbody>${deductionRows}</tbody></table>
                  <div class="summary-row" style="color:#dc2626"><span>${t.PDF_LABEL_TOTAL_DEDUCTION}</span><span>${slip.totalDeductions}</span></div>
                </div>
                <div class="net-box"><div class="net-label">${t.PDF_LABEL_NET_PAY}</div><div class="net-amount">${slip.netPay}</div></div>
                <div style="margin-top:60px;display:flex;justify-content:space-between;font-size:12px;color:#94a3b8">
                  <p>${t.PDF_FOOTER_THANKS}</p>
                  <p>${t.PDF_FOOTER_AUTO}</p>
                </div>
              </div></body></html>`;

              const printWindow = window.open("", "_blank");
              if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                printWindow.onload = () => {
                  printWindow.print();
                };
              }
            }}
          >
            <FileText className="w-5 h-5" />
            {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_DOWNLOAD}
          </Button>

          <Button
            variant="ghost"
            className="w-full h-11 rounded-xl text-muted-foreground font-bold hover:bg-muted"
            onClick={() => onOpenChange(false)}
          >
            {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_CLOSE}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

import { useMemo, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  X,
  SlidersHorizontal,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import {
  SalarySlipSheet,
  type SalarySlip,
} from "../employee/components/SalarySlipSheet";
import { ActiveFilterBadge } from "../employee/components/AdjustmentBadges";

type PayrollRow = {
  id: number;
  name: string;
  employeeId: string;
  department: string;
  role: string;
  baseSalary: string;
  bonus: Array<{ label: string; amount: string }>;
  allowance: Array<{ label: string; amount: string }>;
  deduction: Array<{ label: string; amount: string }>;
  netSalary: string;
  status: "PROCESSED" | "PENDING" | "REVIEW";
  paymentMethod?: string;
  paymentReference?: string;
};

const MOCK_PAYROLL: PayrollRow[] = [
  {
    id: 1,
    name: "Jane Doe",
    employeeId: "EMP-2045",
    department: "Engineering",
    role: "Senior Dev",
    baseSalary: "$6,500",
    allowance: [{ label: "Phụ cấp", amount: "$450" }],
    bonus: [{ label: "Thưởng KPI", amount: "+$200" }],
    deduction: [{ label: "Khấu trừ", amount: "-$120" }],
    netSalary: "$7,030",
    paymentMethod: "Chuyển khoản",
    paymentReference: "REF-2045",
    status: "PROCESSED",
  },
  {
    id: 2,
    name: "Mark Smith",
    employeeId: "EMP-2089",
    department: "Marketing",
    role: "Specialist",
    baseSalary: "$4,200",
    allowance: [{ label: "Phụ cấp", amount: "$300" }],
    bonus: [],
    deduction: [{ label: "Khấu trừ", amount: "-$50" }],
    netSalary: "$4,450",
    paymentMethod: "Tiền mặt",
    paymentReference: "REF-2089",
    status: "PENDING",
  },
  {
    id: 3,
    name: "Sarah White",
    employeeId: "EMP-2104",
    department: "Design",
    role: "UI Designer",
    baseSalary: "$5,000",
    allowance: [{ label: "Phụ cấp", amount: "$500" }],
    bonus: [{ label: "Thưởng dự án", amount: "+$150" }],
    deduction: [{ label: "Khấu trừ", amount: "-$80" }],
    netSalary: "$5,570",
    paymentMethod: "Chuyển khoản",
    paymentReference: "REF-2104",
    status: "PROCESSED",
  },
  {
    id: 4,
    name: "Robert Low",
    employeeId: "EMP-2155",
    department: "Engineering",
    role: "DevOps",
    baseSalary: "$7,800",
    allowance: [{ label: "Phụ cấp", amount: "$600" }],
    bonus: [{ label: "Thưởng hiệu suất", amount: "+$500" }],
    deduction: [{ label: "Khấu trừ", amount: "-$150" }],
    netSalary: "$8,750",
    paymentMethod: "Chuyển khoản",
    paymentReference: "REF-2155",
    status: "REVIEW",
  },
];

export default function PayrollManagement() {
  const t = SYSTEM_MESSAGES.PAYROLL;
  const [payrollRows, setPayrollRows] = useState<PayrollRow[]>(MOCK_PAYROLL);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  const [period, setPeriod] = useState("October 2023");
  const [department, setDepartment] = useState("All Departments");
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("All Status");

  const calculateTotal = (items: Array<{ amount: string }>) => {
    return items.reduce((acc, cur) => {
      const parsed = Number(cur.amount.replace(/[^0-9.-]+/g, ""));
      return acc + (Number.isNaN(parsed) ? 0 : parsed);
    }, 0);
  };

  const handleSaveSlip = (updated: SalarySlip) => {
    setPayrollRows((prev) =>
      prev.map((row) =>
        row.id === updated.id
          ? {
              ...row,
              baseSalary: updated.baseSalary,
              bonus: updated.bonus,
              allowance: updated.allowances,
              deduction: updated.deductions,
              netSalary: updated.netPay,
              paymentMethod: updated.paymentMethod,
              paymentReference: updated.paymentReference,
            }
          : row,
      ),
    );

    setSelectedSlip(updated);
  };

  const handleOpenSlip = (row: PayrollRow) => {
    setSelectedSlip({
      id: row.id,
      period: "Tháng 04/2024",
      paymentDate: "05/05/2024",
      baseSalary: row.baseSalary,
      bonus: row.bonus,
      allowances: row.allowance,
      deductions: row.deduction,
      totalIncome: row.baseSalary,
      totalDeductions: row.deduction[0]?.amount ?? "0",
      netPay: row.netSalary,
      status: row.status === "PROCESSED" ? "paid" : "pending",
      employeeName: row.name,
      employeeId: row.employeeId,
      department: row.department,
      role: row.role,
      paymentMethod: row.paymentMethod,
      paymentReference: row.paymentReference,
    });
  };

  const filtered = useMemo(() => {
    const q = employee.trim().toLowerCase();
    return payrollRows.filter((row) => {
      const matchesEmployee =
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.employeeId.toLowerCase().includes(q);
      const matchesDept =
        department === "All Departments" || row.department === department;
      const matchesStatus = status === "All Status" || row.status === status;
      return matchesEmployee && matchesDept && matchesStatus;
    });
  }, [employee, department, status, payrollRows]);

  const hasFilter =
    employee.trim() !== "" ||
    department !== "All Departments" ||
    status !== "All Status" ||
    period !== "October 2023";

  const clearAllFilters = () => {
    setEmployee("");
    setDepartment("All Departments");
    setStatus("All Status");
    setPeriod("October 2023");
  };

  return (
    <SidebarProvider>
      <AppSidebar role="hr" variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background min-h-screen">
          <div className="flex flex-col gap-2">
            <h1 className="page-heading">{t.TITLE}</h1>
            <p className="text-muted-foreground">{t.DESCRIPTION}</p>
          </div>

          <section className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Bộ lọc</h2>
              </div>

              <div className="flex items-center gap-2">
                {hasFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-sm text-muted-foreground"
                    onClick={clearAllFilters}
                  >
                    {t.BTN_CLEAR}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t.FILTER_EMPLOYEE_PLACEHOLDER}
                  value={employee}
                  onChange={(e) => setEmployee(e.target.value)}
                  className="pl-9 h-9 w-full text-sm"
                />
                {employee && (
                  <button
                    type="button"
                    onClick={() => setEmployee("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 text-sm"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {t.FILTER_PERIOD}
                    {period !== "October 2023" && (
                      <ActiveFilterBadge
                        value={period}
                        colorClass="border-primary/20 bg-primary/10 text-primary"
                        onClear={() => setPeriod("October 2023")}
                      />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem
                    onClick={() => setPeriod("October 2023")}
                    className={cn(
                      "cursor-pointer text-sm",
                      period === "October 2023" && "font-bold text-primary",
                    )}
                  >
                    October 2023
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPeriod("September 2023")}
                    className={cn(
                      "cursor-pointer text-sm",
                      period === "September 2023" && "font-bold text-primary",
                    )}
                  >
                    September 2023
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPeriod("August 2023")}
                    className={cn(
                      "cursor-pointer text-sm",
                      period === "August 2023" && "font-bold text-primary",
                    )}
                  >
                    August 2023
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 text-sm"
                  >
                    <Building className="w-3.5 h-3.5" />
                    {t.FILTER_DEPARTMENT}
                    {department !== "All Departments" && (
                      <ActiveFilterBadge
                        value={department}
                        colorClass="border-primary/20 bg-primary/10 text-primary"
                        onClear={() => setDepartment("All Departments")}
                      />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem
                    onClick={() => setDepartment("All Departments")}
                    className={cn(
                      "cursor-pointer text-sm",
                      department === "All Departments" &&
                        "font-bold text-primary",
                    )}
                  >
                    All Departments
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDepartment("Engineering")}
                    className={cn(
                      "cursor-pointer text-sm",
                      department === "Engineering" && "font-bold text-primary",
                    )}
                  >
                    Engineering
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDepartment("Design")}
                    className={cn(
                      "cursor-pointer text-sm",
                      department === "Design" && "font-bold text-primary",
                    )}
                  >
                    Design
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDepartment("Marketing")}
                    className={cn(
                      "cursor-pointer text-sm",
                      department === "Marketing" && "font-bold text-primary",
                    )}
                  >
                    Marketing
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 text-sm"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {t.FILTER_STATUS}
                    {status !== "All Status" && (
                      <ActiveFilterBadge
                        value={status}
                        colorClass="border-primary/20 bg-primary/10 text-primary"
                        onClear={() => setStatus("All Status")}
                      />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem
                    onClick={() => setStatus("All Status")}
                    className={cn(
                      "cursor-pointer text-sm",
                      status === "All Status" && "font-bold text-primary",
                    )}
                  >
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatus("PROCESSED")}
                    className={cn(
                      "cursor-pointer text-sm",
                      status === "PROCESSED" && "font-bold text-primary",
                    )}
                  >
                    Processed
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatus("PENDING")}
                    className={cn(
                      "cursor-pointer text-sm",
                      status === "PENDING" && "font-bold text-primary",
                    )}
                  >
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatus("REVIEW")}
                    className={cn(
                      "cursor-pointer text-sm",
                      status === "REVIEW" && "font-bold text-primary",
                    )}
                  >
                    Review
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-6 text-sm text-muted-foreground">
              Hiển thị {filtered.length} kết quả
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                    {t.TABLE_EMPLOYEE}
                  </TableHead>
                  <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-wider">
                    {t.TABLE_DEPARTMENT}
                  </TableHead>
                  <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-right">
                    {t.TABLE_BASE_SALARY}
                  </TableHead>
                  <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-right">
                    {t.TABLE_ALLOWANCE}
                  </TableHead>
                  <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-right text-green-600">
                    {t.TABLE_BONUS}
                  </TableHead>
                  <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-right text-red-500">
                    {t.TABLE_DEDUCTION}
                  </TableHead>
                  <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-right">
                    {t.TABLE_NET}
                  </TableHead>
                  <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-center">
                    {t.TABLE_STATUS}
                  </TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">
                    {t.TABLE_ACTIONS}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => handleOpenSlip(row)}
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                          {row.name
                            .split(" ")
                            .slice(0, 2)
                            .map((p) => p[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{row.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            ID: {row.employeeId}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <p className="text-sm font-medium">{row.department}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.role}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-right">
                      {row.baseSalary}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-right">
                      {calculateTotal(row.allowance).toLocaleString("vi-VN")} đ
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-right text-green-600 font-medium">
                      {calculateTotal(row.bonus).toLocaleString("vi-VN")} đ
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-right text-red-500 font-medium">
                      {calculateTotal(row.deduction).toLocaleString("vi-VN")} đ
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm font-bold text-right">
                      {row.netSalary}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${
                          row.status === "PROCESSED"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : row.status === "PENDING"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSlip(row);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {t.PAGINATION_TEXT.replace("{{from}}", "1")
                  .replace("{{to}}", String(filtered.length))
                  .replace("{{total}}", "48")}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" disabled>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button className="size-8 flex items-center justify-center bg-primary text-white text-xs font-bold rounded-md">
                  1
                </Button>
                <Button
                  variant="ghost"
                  className="size-8 flex items-center justify-center text-xs font-bold rounded-md"
                >
                  2
                </Button>
                <Button
                  variant="ghost"
                  className="size-8 flex items-center justify-center text-xs font-bold rounded-md"
                >
                  3
                </Button>
                <Button variant="outline" size="icon">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </section>
        </main>
      </SidebarInset>

      <SalarySlipSheet
        slip={selectedSlip}
        open={!!selectedSlip}
        onOpenChange={(open) => {
          if (!open) setSelectedSlip(null);
        }}
        onSave={handleSaveSlip}
      />
    </SidebarProvider>
  );
}

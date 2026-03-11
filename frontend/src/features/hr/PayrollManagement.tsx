import { useMemo, useState } from "react"
import { Search, ChevronLeft, ChevronRight, Eye, Edit } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { SYSTEM_MESSAGES } from "@/constants/messages"

type PayrollRow = {
  id: number
  name: string
  employeeId: string
  department: string
  role: string
  baseSalary: string
  allowance: string
  bonus: string
  deduction: string
  netSalary: string
  status: "PROCESSED" | "PENDING" | "REVIEW"
}

const MOCK_PAYROLL: PayrollRow[] = [
  {
    id: 1,
    name: "Jane Doe",
    employeeId: "EMP-2045",
    department: "Engineering",
    role: "Senior Dev",
    baseSalary: "$6,500",
    allowance: "$450",
    bonus: "+$200",
    deduction: "-$120",
    netSalary: "$7,030",
    status: "PROCESSED",
  },
  {
    id: 2,
    name: "Mark Smith",
    employeeId: "EMP-2089",
    department: "Marketing",
    role: "Specialist",
    baseSalary: "$4,200",
    allowance: "$300",
    bonus: "+$0",
    deduction: "-$50",
    netSalary: "$4,450",
    status: "PENDING",
  },
  {
    id: 3,
    name: "Sarah White",
    employeeId: "EMP-2104",
    department: "Design",
    role: "UI Designer",
    baseSalary: "$5,000",
    allowance: "$500",
    bonus: "+$150",
    deduction: "-$80",
    netSalary: "$5,570",
    status: "PROCESSED",
  },
  {
    id: 4,
    name: "Robert Low",
    employeeId: "EMP-2155",
    department: "Engineering",
    role: "DevOps",
    baseSalary: "$7,800",
    allowance: "$600",
    bonus: "+$500",
    deduction: "-$150",
    netSalary: "$8,750",
    status: "REVIEW",
  },
]

export default function PayrollManagement() {
  const t = SYSTEM_MESSAGES.PAYROLL
  const [period, setPeriod] = useState("October 2023")
  const [department, setDepartment] = useState("All Departments")
  const [employee, setEmployee] = useState("")
  const [status, setStatus] = useState("All Status")

  const filtered = useMemo(() => {
    const q = employee.trim().toLowerCase()
    return MOCK_PAYROLL.filter((row) => {
      const matchesEmployee = !q || row.name.toLowerCase().includes(q) || row.employeeId.toLowerCase().includes(q)
      const matchesDept = department === "All Departments" || row.department === department
      const matchesStatus = status === "All Status" || row.status === status
      return matchesEmployee && matchesDept && matchesStatus
    })
  }, [employee, department, status])

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">{t.FILTER_PERIOD}</label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="h-9 w-full text-sm">
                    <SelectValue placeholder={t.FILTER_PERIOD} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="October 2023">October 2023</SelectItem>
                    <SelectItem value="September 2023">September 2023</SelectItem>
                    <SelectItem value="August 2023">August 2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">{t.FILTER_DEPARTMENT}</label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="h-9 w-full text-sm">
                    <SelectValue placeholder={t.FILTER_DEPARTMENT} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Departments">All Departments</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">{t.FILTER_EMPLOYEE}</label>
                <Input
                  value={employee}
                  onChange={(e) => setEmployee(e.target.value)}
                  placeholder={t.FILTER_EMPLOYEE_PLACEHOLDER}
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">{t.FILTER_STATUS}</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9 w-full text-sm">
                    <SelectValue placeholder={t.FILTER_STATUS} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Status">All Status</SelectItem>
                    <SelectItem value="PROCESSED">Processed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button variant="outline" onClick={() => {
                setPeriod("October 2023")
                setDepartment("All Departments")
                setEmployee("")
                setStatus("All Status")
              }}>
                {t.BTN_RESET}
              </Button>
              <Button className="flex items-center gap-2" onClick={() => { /* noop */ }}>
                <Search className="w-4 h-4" />
                {t.BTN_SEARCH}
              </Button>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider">{t.TABLE_EMPLOYEE}</TableHead>
                  <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-wider">{t.TABLE_DEPARTMENT}</TableHead>
                  <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-right">{t.TABLE_BASE_SALARY}</TableHead>
                  <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-right">{t.TABLE_ALLOWANCE}</TableHead>
                  <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-right text-green-600">{t.TABLE_BONUS}</TableHead>
                  <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-right text-red-500">{t.TABLE_DEDUCTION}</TableHead>
                  <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-right">{t.TABLE_NET}</TableHead>
                  <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-center">{t.TABLE_STATUS}</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">{t.TABLE_ACTIONS}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                          {row.name
                            .split(" ")
                            .slice(0, 2)
                            .map((p) => p[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{row.name}</p>
                          <p className="text-[10px] text-muted-foreground">ID: {row.employeeId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <p className="text-sm font-medium">{row.department}</p>
                      <p className="text-xs text-muted-foreground">{row.role}</p>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm font-medium text-right">{row.baseSalary}</TableCell>
                    <TableCell className="px-4 py-4 text-sm text-right">{row.allowance}</TableCell>
                    <TableCell className="px-4 py-4 text-sm text-right text-green-600 font-medium">{row.bonus}</TableCell>
                    <TableCell className="px-4 py-4 text-sm text-right text-red-500 font-medium">{row.deduction}</TableCell>
                    <TableCell className="px-4 py-4 text-sm font-bold text-right">{row.netSalary}</TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${row.status === "PROCESSED"
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {t.PAGINATION_TEXT.replace("{{from}}", "1").replace("{{to}}", String(filtered.length)).replace("{{total}}", "48")}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" disabled>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button className="size-8 flex items-center justify-center bg-primary text-white text-xs font-bold rounded-md">1</Button>
                <Button variant="ghost" className="size-8 flex items-center justify-center text-xs font-bold rounded-md">
                  2
                </Button>
                <Button variant="ghost" className="size-8 flex items-center justify-center text-xs font-bold rounded-md">
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
    </SidebarProvider>
  )
}

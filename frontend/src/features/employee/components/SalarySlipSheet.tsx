import { DollarSign, Gift, Percent, FileText } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { SYSTEM_MESSAGES } from "@/constants/messages"

export type SalarySlip = {
  id: number
  period: string
  paymentDate: string
  baseSalary: string
  allowances: Array<{ label: string; amount: string }>
  deductions: Array<{ label: string; amount: string }>
  totalIncome: string
  totalDeductions: string
  netPay: string
  status: "paid" | "pending"
}

interface SalarySlipSheetProps {
  slip: SalarySlip | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const SalarySlipSheet = ({ slip, open, onOpenChange }: SalarySlipSheetProps) => {
  if (!slip) return null

  const totalAllowances = slip.allowances.reduce((acc, cur) => {
    const parsed = Number(cur.amount.replace(/[^0-9.-]+/g, ""))
    return acc + (Number.isNaN(parsed) ? 0 : parsed)
  }, 0)

  const totalDeductions = slip.deductions.reduce((acc, cur) => {
    const parsed = Number(cur.amount.replace(/[^0-9.-]+/g, ""))
    return acc + (Number.isNaN(parsed) ? 0 : parsed)
  }, 0)

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onOpenChange(false) }}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-l shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b bg-muted/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />

          <div className="relative">
            <SheetHeader className="text-left space-y-1">
              <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
                {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_TITLE}
              </SheetTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-mono px-2 py-0.5 text-xs bg-background shadow-sm border">
                  {slip.id}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_PERIOD}: {slip.period}
                </span>
                <span className="text-sm text-muted-foreground">
                  {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_PAYMENT_DATE}: {slip.paymentDate}
                </span>
              </div>
              <SheetDescription className="text-sm font-medium text-muted-foreground">
                {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_DESC}
              </SheetDescription>
            </SheetHeader>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Base salary */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">{SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_BASE_SALARY}</h3>
              </div>
              <div className="bg-muted/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_BASE_SALARY}</span>
                  <span className="font-semibold text-foreground">{slip.baseSalary}</span>
                </div>
              </div>
            </section>

            {/* Allowances */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">{SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_ALLOWANCES}</h3>
              </div>
              <div className="bg-muted/20 rounded-xl p-4 space-y-3">
                {slip.allowances.map((a) => (
                  <div key={a.label} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{a.label}</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">+ {a.amount}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-border flex justify-between items-center font-semibold">
                  <span>{SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_TOTAL_ALLOWANCES}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">+ {totalAllowances.toLocaleString("vi-VN")} đ</span>
                </div>
              </div>
            </section>

            {/* Deductions */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">{SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_DEDUCTIONS}</h3>
              </div>
              <div className="bg-muted/20 rounded-xl p-4 space-y-3">
                {slip.deductions.map((d) => (
                  <div key={d.label} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{d.label}</span>
                    <span className="font-medium text-primary">- {d.amount}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-border flex justify-between items-center font-semibold">
                  <span>{SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_TOTAL_DEDUCTIONS}</span>
                  <span className="text-primary">- {totalDeductions.toLocaleString("vi-VN")} đ</span>
                </div>
              </div>
            </section>

            {/* Net salary */}
            <div className="bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_NET_PAY}
              </span>
              <span className="text-4xl font-bold text-primary">{slip.netPay}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t bg-muted/20 flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={() => {
              // TODO: implement PDF download
            }}
          >
            <FileText className="w-4 h-4" />
            {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_DOWNLOAD}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_CLOSE}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

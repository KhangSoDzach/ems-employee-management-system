import { DollarSign, Gift, Percent, FileText } from "lucide-react"
import { useEffect, useState } from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { useAuth } from "@/contexts/AuthContext"
import { SYSTEM_MESSAGES } from "@/constants/messages"

export type SalarySlip = {
  id: number
  period: string
  paymentDate: string
  baseSalary: string
  bonus: string
  allowances: Array<{ label: string; amount: string }>
  deductions: Array<{ label: string; amount: string }>
  totalIncome: string
  totalDeductions: string
  netPay: string
  status: "paid" | "pending"

  // Employee + payment metadata (optional)
  employeeName?: string
  employeeId?: string
  department?: string
  role?: string
  paymentMethod?: string
  paymentReference?: string
}

interface SalarySlipSheetProps {
  slip: SalarySlip | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (slip: SalarySlip) => void
}

export const SalarySlipSheet = ({ slip, open, onOpenChange, onSave }: SalarySlipSheetProps) => {
  const { user } = useAuth()
  const isHr = user?.roles?.includes("ROLE_HR")

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<SalarySlip | null>(slip)

  useEffect(() => {
    setForm(slip)
    setIsEditing(false)
  }, [slip])

  if (!slip || !form) return null

  const totalAllowances = form.allowances.reduce((acc, cur) => {
    const parsed = Number(cur.amount.replace(/[^0-9.-]+/g, ""))
    return acc + (Number.isNaN(parsed) ? 0 : parsed)
  }, 0)

  const totalDeductions = form.deductions.reduce((acc, cur) => {
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

              <SheetDescription className="text-sm font-medium text-muted-foreground">
                {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_DESC}
              </SheetDescription>

              {isHr ? (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setForm(slip)
                          setIsEditing(false)
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (onSave && form) {
                            onSave(form)
                          }
                          setIsEditing(false)
                        }}
                      >
                        Lưu
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      Chỉnh sửa
                    </Button>
                  )}
                </div>
              ) : null}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {isHr ? (
                  <div className="space-y-1">
                    {form.employeeName ? (
                      <p className="text-sm font-semibold">{form.employeeName}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {form.employeeId ?? ""}
                      {form.department ? ` • ${form.department}` : ""}
                      {form.role ? ` • ${form.role}` : ""}
                    </p>
                  </div>
                ) : null}

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={form.status === "paid" ? "secondary" : "outline"}
                      className="text-[11px] px-2 py-1"
                    >
                      {form.status === "paid" ? "Đã thanh toán" : "Chờ thanh toán"}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_PERIOD}: {form.period}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_PAYMENT_DATE}: {form.paymentDate}
                  </p>

                  {isHr ? (
                    <>
                      {isEditing ? (
                        <div className="space-y-1">
                          <Input
                            value={form.paymentMethod ?? ""}
                            placeholder="Phương thức"
                            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                            className="text-xs"
                          />
                          <Input
                            value={form.paymentReference ?? ""}
                            placeholder="Mã tham chiếu"
                            onChange={(e) => setForm({ ...form, paymentReference: e.target.value })}
                            className="text-xs"
                          />
                        </div>
                      ) : (
                        <>
                          {form.paymentMethod ? (
                            <p className="text-xs text-muted-foreground">Phương thức: {form.paymentMethod}</p>
                          ) : null}
                          {form.paymentReference ? (
                            <p className="text-xs text-muted-foreground">Ref: {form.paymentReference}</p>
                          ) : null}
                        </>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
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
                  {isEditing ? (
                    <Input
                      value={form.baseSalary}
                      onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                      className="w-32"
                    />
                  ) : (
                    <span className="font-semibold text-foreground">{form.baseSalary}</span>
                  )}
                </div>
              </div>
            </section>

            {/* Bonus */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Thưởng</h3>
              </div>
              <div className="bg-muted/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Thưởng</span>
                  {isEditing ? (
                    <Input
                      value={form.bonus}
                      onChange={(e) => setForm({ ...form, bonus: e.target.value })}
                      className="w-32"
                    />
                  ) : (
                    <span className="font-semibold text-foreground">{form.bonus}</span>
                  )}
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
                {form.allowances.map((a, idx) => (
                  <div key={a.label} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{a.label}</span>
                    {isEditing ? (
                      <Input
                        value={a.amount}
                        onChange={(e) => {
                          const next = [...form.allowances]
                          const current = next[idx]
                          if (!current) return
                          next[idx] = { ...current, amount: e.target.value }
                          setForm({ ...form, allowances: next })
                        }}
                        className="w-28 text-right"
                      />
                    ) : (
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">+ {a.amount}</span>
                    )}
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

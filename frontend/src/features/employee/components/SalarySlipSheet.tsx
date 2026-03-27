import { DollarSign, Gift, Percent, FileText, Plus, X } from "lucide-react"
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
import { AUTH_ROLES } from "@/constants/auth"

export type SalarySlip = {
  id: number
  period: string
  paymentDate: string
  baseSalary: string
  bonus: Array<{ label: string; amount: string }>
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
  const isHr = user?.roles?.includes(AUTH_ROLES.HR)

  const normalizeSlip = (s: SalarySlip | null): SalarySlip | null =>
    s
      ? {
          ...s,
          bonus: s.bonus ?? [],
          allowances: s.allowances ?? [],
          deductions: s.deductions ?? [],
        }
      : null

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<SalarySlip | null>(normalizeSlip(slip))

  useEffect(() => {
    const t = setTimeout(() => {
      setForm(normalizeSlip(slip))
      setIsEditing(false)
    }, 0)
    return () => clearTimeout(t)
  }, [slip])

  if (!form) {
    return null
  }

  const totalAllowances = form.allowances.reduce((acc, cur) => {
    const parsed = Number(cur.amount.replace(/[^\d]/g, ""))
    return acc + (Number.isNaN(parsed) ? 0 : parsed)
  }, 0)

  const totalDeductions = form.deductions
    .filter(d => !d.label.toLowerCase().includes('thuế') && !d.label.toLowerCase().includes('tncn'))
    .reduce((acc, cur) => {
      const parsed = Number(cur.amount.replace(/[^\d]/g, ""))
      return acc + (Number.isNaN(parsed) ? 0 : parsed)
    }, 0)

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) {onOpenChange(false)} }}>
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
                          setForm(slip);
                          setIsEditing(false);
                        }}
                      >
                        {"Hủy"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (onSave && form) {
                            onSave(form);
                          }
                          setIsEditing(false);
                        }}
                      >
                        {"Lưu"}
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      {"Chỉnh sửa"}
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
                    {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_PERIOD}{": "}{form.period}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_PAYMENT_DATE}{": "}{form.paymentDate}
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


            {/* Allowances */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">{SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_ALLOWANCES}</h3>
              </div>
              <div className="bg-muted/20 rounded-xl p-4 space-y-3">
                {form.allowances.map((a, idx) => (
                  <div key={a.label} className="flex justify-between items-center">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={a.label}
                          onChange={(e) => {
                            const next = [...form.allowances]
                            const current = next[idx]
                            if (!current) {return}
                            next[idx] = { ...current, label: e.target.value }
                            setForm({ ...form, allowances: next })
                          }}
                          className="flex-1 text-sm"
                          placeholder="Loại phụ cấp"
                        />
                        <Input
                          value={a.amount}
                          onChange={(e) => {
                            const next = [...form.allowances]
                            const current = next[idx]
                            if (!current) {return}
                            next[idx] = { ...current, amount: e.target.value }
                            setForm({ ...form, allowances: next })
                          }}
                          className="w-28 text-right"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => {
                            const next = form.allowances.filter((_, i) => i !== idx)
                            setForm({ ...form, allowances: next })
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-between w-full">
                        <span className="text-sm text-muted-foreground">{a.label}</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{"+"}{" "}{a.amount}</span>
                      </div>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setForm({ ...form, allowances: [...form.allowances, { label: "", amount: "" }] })
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {"Thêm phụ cấp"}
                  </Button>
                )}
                <div className="pt-2 border-t border-border flex justify-between items-center font-semibold">
                  <span>{SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_TOTAL_ALLOWANCES}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{"+"}{" "}{totalAllowances.toLocaleString("vi-VN")}{" đ"}</span>
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
                {form.deductions.filter(d => !d.label.toLowerCase().includes('thuế') && !d.label.toLowerCase().includes('tncn')).map((d, idx) => (
                  <div key={d.label} className="flex justify-between items-center">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={d.label}
                          onChange={(e) => {
                            const next = [...form.deductions]
                            const current = next[idx]
                            if (!current) {return}
                            next[idx] = { ...current, label: e.target.value }
                            setForm({ ...form, deductions: next })
                          }}
                          className="flex-1 text-sm"
                          placeholder="Loại khấu trừ"
                        />
                        <Input
                          value={d.amount}
                          onChange={(e) => {
                            const next = [...form.deductions]
                            const current = next[idx]
                            if (!current) {return}
                            next[idx] = { ...current, amount: e.target.value }
                            setForm({ ...form, deductions: next })
                          }}
                          className="w-28 text-right"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => {
                            const next = form.deductions.filter((_, i) => i !== idx)
                            setForm({ ...form, deductions: next })
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-muted-foreground">{d.label}</span>
                        <span className="font-medium text-primary">{"-"}{" "}{d.amount}</span>
                      </>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setForm({ ...form, deductions: [...form.deductions, { label: "", amount: "" }] })
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {"Thêm khấu trừ"}
                  </Button>
                )}
                <div className="pt-2 border-t border-border flex justify-between items-center font-semibold">
                  <span>{SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_TOTAL_DEDUCTIONS}</span>
                  <span className="text-primary">{"-"}{" "}{totalDeductions.toLocaleString("vi-VN")}{" đ"}</span>
                </div>
              </div>
            </section>

            {/* Net salary */}
            <div className="bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                {SYSTEM_MESSAGES.SALARY_HISTORY.SHEET_NET_PAY}
              </span>
              <span className="text-4xl font-bold text-primary">{form.netPay}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t bg-muted/20 flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={() => {
              if (!form) { return }
              const allowanceRows = (form.allowances ?? [])
                .map(a => `<tr><td style="padding:5px 0 5px 8px;color:#444">${a.label}</td><td style="text-align:right;color:#16a34a">+ ${a.amount}</td></tr>`).join("")
              const deductionRows = (form.deductions ?? [])
                .filter((d: {label:string}) => !d.label.toLowerCase().includes('thuế') && !d.label.toLowerCase().includes('tncn'))
                .map((d: {label:string;amount:string}) => `<tr><td style="padding:5px 0 5px 8px;color:#444">${d.label}</td><td style="text-align:right;color:#dc2626">- ${d.amount}</td></tr>`).join("")
              const totalAllowancesNum = (form.allowances ?? []).reduce((s,a)=>s+Number(a.amount.replace(/[^\d]/g,"")||0),0)
              const totalAllowancesStr = totalAllowancesNum.toLocaleString("vi-VN") + "đ"
              const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"/><title>Phieu luong - ${form.period}</title>
              <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:13px;color:#111}
              .page{max-width:600px;margin:32px auto;padding:0 16px}
              .header{border-bottom:3px solid #e41b21;padding-bottom:12px;margin-bottom:20px}
              .header h1{font-size:22px;color:#e41b21}.meta{color:#666;font-size:12px;margin-top:4px}
              .badge{display:inline-block;background:#dcfce7;color:#15803d;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:bold}
              .section{margin-bottom:16px}.section-title{font-size:11px;font-weight:bold;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
              table{width:100%;border-collapse:collapse}.base-row{display:flex;justify-content:space-between;padding:6px 8px;background:#f9fafb;border-radius:4px}
              hr{border:none;border-top:1px solid #e5e7eb;margin:12px 0}
              .total-row{display:flex;justify-content:space-between;padding:6px 8px;font-weight:bold}
              .net-box{background:#fef2f2;border:2px solid #fca5a5;border-radius:10px;padding:24px;text-align:center;margin-top:20px}
              .net-label{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px}
              .net-amount{font-size:34px;font-weight:bold;color:#e41b21}
              @media print{.page{margin:0;padding:16px}}</style></head><body>
              <div class="page">
                <div class="header"><h1>Phieu luong</h1>
                  <div class="meta"><strong>${form.period}</strong> | Ngay thanh toan: ${form.paymentDate}
                    <span class="badge">${form.status === "paid" ? "Da thanh toan" : "Cho thanh toan"}</span></div></div>
                <div class="section"><div class="section-title">Luong co ban</div>
                  <div class="base-row"><span>Luong co ban</span><strong>${form.baseSalary}</strong></div></div>
                ${allowanceRows ? `<div class="section"><div class="section-title">Phu cap</div>
                  <table><tbody>${allowanceRows}</tbody></table>
                  <div class="total-row"><span>Tong phu cap</span><span style="color:#16a34a">+ ${totalAllowancesStr}</span></div></div>` : ""}
                <hr/>
                <div class="section"><div class="section-title">Khau tru</div>
                  <table><tbody>${deductionRows}</tbody></table>
                  <div class="total-row"><span>Tong khau tru</span><span style="color:#dc2626">- ${form.totalDeductions}</span></div></div>
                <div class="net-box"><div class="net-label">TONG THUC LINH</div>
                  <div class="net-amount">${form.netPay}</div></div>
              </div></body></html>`
              // Mở cửa sổ in → user chọn "Save as PDF" trong print dialog
              const printWin = window.open("", "_blank", "width=700,height=900")
              if (!printWin) {
                // Fallback nếu popup bị block: download HTML file
                const blob = new Blob([html], { type: "text/html;charset=utf-8" })
                const url  = URL.createObjectURL(blob)
                const a    = document.createElement("a")
                a.href = url
                a.download = `phieu-luong-${form.period ?? "export"}.html`
                document.body.appendChild(a); a.click(); document.body.removeChild(a)
                setTimeout(() => URL.revokeObjectURL(url), 10000)
                return
              }
              printWin.document.write(html)
              printWin.document.close()
              // Đợi load xong rồi mới in
              printWin.onload = () => {
                printWin.focus()
                printWin.print()
                // Đóng cửa sổ sau khi print dialog đóng
                printWin.onafterprint = () => printWin.close()
              }
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

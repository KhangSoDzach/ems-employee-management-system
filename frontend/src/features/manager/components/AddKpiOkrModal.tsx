import { useState } from "react"
import { X } from "lucide-react"
import { SYSTEM_MESSAGES } from "@/constants/messages"
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations"
import api from "@/lib/axios"
import { toast } from "sonner"

type KpiType = "KPI" | "OKR"
type MetricType = "PERCENT" | "VND" | "NUMBER"
type ScopeType = "COMPANY" | "DEPARTMENT" | "EMPLOYEE"

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddKpiOkrModal({ open, onClose, onSuccess }: Props) {
  const t = SYSTEM_MESSAGES.KPI_OKR

  const [name, setName] = useState("")
  const [type, setType] = useState<KpiType>("KPI")
  const [metricType, setMetricType] = useState<MetricType>("PERCENT")
  const [targetValue, setTargetValue] = useState("")
  const [weight, setWeight] = useState("")
  const [scopeType, setScopeType] = useState<ScopeType>("COMPANY")
  const [scopeId, setScopeId] = useState("")
  const [periodStart, setPeriodStart] = useState("2026-01-01")
  const [periodEnd, setPeriodEnd] = useState("2026-03-31")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!open) {return null}

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!name.trim()) {e.name = "Tên mục tiêu không được để trống"}
    if (!targetValue || Number(targetValue) <= 0) {e.targetValue = "Giá trị mục tiêu phải lớn hơn 0"}
    if (!weight || Number(weight) <= 0 || Number(weight) > 100) {e.weight = "Trọng số phải từ 0.01 đến 100"}
    if (!periodStart) {e.periodStart = "Chọn ngày bắt đầu"}
    if (!periodEnd) {e.periodEnd = "Chọn ngày kết thúc"}
    if (periodStart && periodEnd && periodStart >= periodEnd) {e.periodEnd = "Ngày kết thúc phải sau ngày bắt đầu"}
    if ((scopeType === "DEPARTMENT" || scopeType === "EMPLOYEE") && !scopeId) {e.scopeId = "Bắt buộc khi chọn Phòng ban / Nhân viên"}
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error(FORM_VALIDATION_MESSAGES.MISSING_CONTENT)
      return
    }
    const payload = {
      name: name.trim(), type, metricType,
      targetValue: Number(targetValue),
      weight: Number(weight),
      scopeType,
      scopeId: scopeType === "COMPANY" ? null : Number(scopeId),
      periodStart, periodEnd,
      description: description.trim() || undefined,
    }
    try {
      setLoading(true)
      await api.post("/kpi-objectives", payload)
      toast.success("Tạo mục tiêu KPI/OKR thành công!")
      handleClose()
      onSuccess?.()
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; errors?: Record<string, string> } } }
      const data = axiosError?.response?.data
      if (data?.errors) {setErrors(data.errors)}
      else {toast.error(data?.message || "Có lỗi xảy ra, vui lòng thử lại")}
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setName(""); setType("KPI"); setMetricType("PERCENT")
    setTargetValue(""); setWeight(""); setScopeType("COMPANY")
    setScopeId(""); setPeriodStart("2026-01-01"); setPeriodEnd("2026-03-31")
    setDescription(""); setErrors({})
    onClose()
  }

  const inputCls = (f: string) => `flex h-10 w-full rounded border ${errors[f] ? "border-red-400" : "border-slate-200"} bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary`
  const selectCls = (f: string) => `flex h-10 w-full rounded border ${errors[f] ? "border-red-400" : "border-slate-200"} bg-white px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary`
  const Err = ({ f }: { f: string }) => errors[f] ? <p className="text-xs text-red-500 mt-1">{errors[f]}</p> : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-8px" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">{t.MODAL_TITLE}</h2>
            <button onClick={handleClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-sm text-slate-500 mt-1">{t.MODAL_DESC}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 overflow-y-auto">

          {/* Tên */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-900">{t.LABEL_NAME}</label>
            <input className={inputCls("name")} placeholder={t.PLACEHOLDER_NAME} value={name} onChange={e => setName(e.target.value)} />
            <Err f="name" />
          </div>

          {/* Loại + Chỉ số */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Loại</label>
              <select className={selectCls("type")} value={type} onChange={e => setType(e.target.value as KpiType)}>
                <option value="KPI">KPI</option>
                <option value="OKR">OKR</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">{t.LABEL_METRIC}</label>
              <select className={selectCls("metricType")} value={metricType} onChange={e => setMetricType(e.target.value as MetricType)}>
                <option value="PERCENT">{t.METRIC_PERCENT}</option>
                <option value="VND">{t.METRIC_CURRENCY}</option>
                <option value="NUMBER">{t.METRIC_NUMBER}</option>
              </select>
            </div>
          </div>

          {/* Giá trị + Trọng số */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">{t.LABEL_TARGET}</label>
              <input className={inputCls("targetValue")} placeholder="0" type="number" min="0.01" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
              <Err f="targetValue" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">{t.LABEL_WEIGHT} (1–100)</label>
              <input className={inputCls("weight")} placeholder="0" type="number" min="0.01" max="100" value={weight} onChange={e => setWeight(e.target.value)} />
              <Err f="weight" />
            </div>
          </div>

          {/* Scope */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Phạm vi</label>
              <select className={selectCls("scopeType")} value={scopeType} onChange={e => { setScopeType(e.target.value as ScopeType); setScopeId("") }}>
                <option value="COMPANY">Toàn công ty</option>
                <option value="DEPARTMENT">Phòng ban</option>
                <option value="EMPLOYEE">Nhân viên</option>
              </select>
            </div>
            {scopeType !== "COMPANY" && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-900">{scopeType === "DEPARTMENT" ? "ID Phòng ban" : "ID Nhân viên"}</label>
                <input className={inputCls("scopeId")} placeholder="Nhập ID" type="number" value={scopeId} onChange={e => setScopeId(e.target.value)} />
                <Err f="scopeId" />
              </div>
            )}
          </div>

          {/* Kỳ đánh giá */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Ngày bắt đầu</label>
              <input className={inputCls("periodStart")} type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
              <Err f="periodStart" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Ngày kết thúc</label>
              <input className={inputCls("periodEnd")} type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
              <Err f="periodEnd" />
            </div>
          </div>

          {/* Mô tả */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-900">{t.LABEL_DESC}</label>
            <textarea className="flex min-h-[80px] w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder={t.PLACEHOLDER_DESC} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 border-t shrink-0">
          <button onClick={handleClose} disabled={loading} className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium border border-slate-200 bg-white hover:bg-slate-100 text-slate-900 disabled:opacity-50">
            {t.BTN_CANCEL}
          </button>
          <button onClick={handleSubmit} disabled={loading} className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium bg-[#e41b21] hover:bg-[#c9181d] text-white disabled:opacity-60 min-w-[120px]">
            {loading ? "Đang lưu..." : t.BTN_SAVE}
          </button>
        </div>
      </div>
    </div>
  )
}

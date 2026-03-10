import { X } from "lucide-react"
import { SYSTEM_MESSAGES } from "@/constants/messages"

interface Props {
  open: boolean
  onClose: () => void
}

export function AddKpiOkrModal({ open, onClose }: Props) {
  if (!open) return null

  const t = SYSTEM_MESSAGES.KPI_OKR

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[8px]"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
              {t.MODAL_TITLE}
            </h2>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {t.MODAL_DESC}
          </p>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Tên mục tiêu */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-900">
              {t.LABEL_NAME}
            </label>
            <input 
              className="flex h-10 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" 
              placeholder={t.PLACEHOLDER_NAME} 
              type="text" 
            />
          </div>

          {/* Chỉ số đo lường */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-900">
              {t.LABEL_METRIC}
            </label>
            <div className="relative">
              <select 
                className="flex h-10 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                defaultValue=""
              >
                <option disabled value="">{t.PLACEHOLDER_METRIC}</option>
                <option value="percentage">{t.METRIC_PERCENT}</option>
                <option value="currency">{t.METRIC_CURRENCY}</option>
                <option value="quantity">{t.METRIC_NUMBER}</option>
                <option value="rating">{t.METRIC_RATING}</option>
              </select>
            </div>
          </div>

          {/* Dual Column: Giá trị & Trọng số */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-slate-900">
                {t.LABEL_TARGET}
              </label>
              <input 
                className="flex h-10 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" 
                placeholder="0" 
                type="number" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-slate-900">
                {t.LABEL_WEIGHT}
              </label>
              <input 
                className="flex h-10 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" 
                placeholder="0" 
                type="number" 
              />
            </div>
          </div>

          {/* Ghi chú thêm */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-900">
              {t.LABEL_DESC}
            </label>
            <textarea 
              className="flex min-h-[80px] w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" 
              placeholder={t.PLACEHOLDER_DESC}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-6 bg-slate-50/50">
          <button 
            onClick={onClose}
            className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition-colors border border-slate-200 bg-white hover:bg-slate-100 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {t.BTN_CANCEL}
          </button>
          <button 
            className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition-colors bg-primary text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
          >
            {t.BTN_SAVE}
          </button>
        </div>
      </div>
    </div>
  )
}

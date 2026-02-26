import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

/* ================= SCHEMA ================= */

const leaveSchema = z
  .object({
    leaveType: z.string().min(1, "Vui lòng chọn loại phép"),
    startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
    endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
    reason: z.string().min(5, "Lý do tối thiểu 5 ký tự"),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true
      return new Date(data.endDate) >= new Date(data.startDate)
    },
    {
      message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
      path: ["endDate"],
    }
  )

type LeaveFormValues = z.infer<typeof leaveSchema>

/* ================= PAGE ================= */

const TEXT = {
  title: "Tạo đơn nghỉ phép",
  sectionInfo: "Thông tin nghỉ phép",
  labelType: "Loại phép",
  optSelect: "Chọn loại phép",
  optAnnual: "Nghỉ phép năm",
  optSick: "Nghỉ ốm",
  optUnpaid: "Nghỉ không lương",
  optPersonal: "Việc riêng",
  labelStart: "Ngày bắt đầu",
  labelEnd: "Ngày kết thúc",
  labelReason: "Lý do nghỉ",
  placeholderReason: "Nhập lý do chi tiết...",
  infoNote: "Đơn xin nghỉ phép sẽ được gửi đến quản lý trực tiếp của bạn để phê duyệt.",
  btnSubmit: "Gửi đơn",
  btnCancel: "Hủy bỏ",
  summaryTitle: "Tóm tắt quỹ phép",
  summaryRemainingLabel: "Số ngày còn lại",
  summaryRemainingValue: "12.5 ngày",
  summaryUsedLabel: "Phép đã dùng",
  summaryUsedValue: "2.5 ngày",
  iconArrowBack: "arrow_back",
  iconInfo: "info",
  iconExpandMore: "expand_more",
  iconCalendarMonth: "calendar_month",
};

const LeaveRequestPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveSchema),
    mode: "onChange",
  })

  const onSubmit = (data: LeaveFormValues) => {
    console.log(data)
    alert("Gửi đơn thành công!")
    reset()
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">

      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-10 flex items-center bg-surface dark:bg-background-dark/95 border-b border-border-color dark:border-primary/20 px-4 py-3 h-16 relative">
        <Link
          to="/dashboard"
          className="text-foreground dark:text-slate-100 p-2 hover:bg-slate-100 dark:hover:bg-primary/20 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined align-middle">
            {TEXT.iconArrowBack}
          </span>
        </Link>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-foreground dark:text-slate-100">
          {TEXT.title}
        </h1>
      </div>

      <main className="max-w-md mx-auto p-4 md:p-6">

        {/* Main Form Card */}
        <div className="bg-surface dark:bg-slate-900/50 rounded-lg border border-border-color dark:border-primary/10 p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground dark:text-slate-100 mb-6">
            {TEXT.sectionInfo}
          </h2>

          <form className="space-y-4">

            {/* Leave Type */}
            <FormSelect
              label={TEXT.labelType}
              options={[
                { value: "", label: TEXT.optSelect },
                { value: "annual", label: TEXT.optAnnual },
                { value: "sick", label: TEXT.optSick },
                { value: "unpaid", label: TEXT.optUnpaid },
                { value: "personal", label: TEXT.optPersonal },
              ]}
            />

            {/* Start Date */}
            <FormDate label={TEXT.labelStart} />

            {/* End Date */}
            <FormDate label={TEXT.labelEnd} />

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground dark:text-slate-200">
                {TEXT.labelReason}
              </label>
              <textarea
                rows={4}
                placeholder={TEXT.placeholderReason}
                className="w-full p-3 bg-surface dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-md text-foreground dark:text-slate-200 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
              />
            </div>

            {/* Info Box */}
            <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-md border border-primary/10">
              <div className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-sm">
                  {TEXT.iconInfo}
                </span>
                <p className="text-xs text-muted-foreground dark:text-slate-400">
                  {TEXT.infoNote}
                </p>
              </div>
            </div>

          </form>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-md shadow-md shadow-primary/20 transition-all active:scale-[0.98]">
            {TEXT.btnSubmit}
          </button>

          <button className="w-full h-12 bg-transparent border border-border-color dark:border-slate-700 text-foreground dark:text-slate-200 font-medium rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            {TEXT.btnCancel}
          </button>
        </div>

        {/* Summary Card */}
        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-dashed border-border-color dark:border-slate-700">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            {TEXT.summaryTitle}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{TEXT.summaryRemainingLabel}</p>
              <p className="text-lg font-bold text-foreground dark:text-slate-100">
                {TEXT.summaryRemainingValue}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">{TEXT.summaryUsedLabel}</p>
              <p className="text-lg font-bold text-foreground dark:text-slate-100">
                {TEXT.summaryUsedValue}
              </p>
            </div>

          </div>
        </div>

      </main>

      {/* Bottom spacing */}
      <div className="h-8"></div>
    </div>
  );
};

export default LeaveRequestPage;

/* ================= COMPONENTS ================= */

type SelectOption = {
  value: string;
  label: string;
};

const FormSelect: React.FC<{
  label: string;
  options: SelectOption[];
}> = ({ label, options }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-foreground dark:text-slate-200">
      {label}
    </label>
    <div className="relative">
      <select className="w-full h-11 px-3 bg-surface dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-md text-foreground dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
        <span className="material-symbols-outlined text-sm">
          {TEXT.iconExpandMore}
        </span>
      </div>
    </div>
  </div>
);

const FormDate: React.FC<{ label: string }> = ({ label }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-foreground dark:text-slate-200">
      {label}
    </label>
    <div className="relative">
      <input
        type="date"
        className="w-full h-11 px-3 bg-surface dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-md text-foreground dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
      />
      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
        <span className="material-symbols-outlined text-sm">
          {TEXT.iconCalendarMonth}
        </span>
      </div>
    </div>
  </div>
);

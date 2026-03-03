import React from "react";
import { Link } from "react-router-dom";

const LeaveRequestPage: React.FC = () => {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">

      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-10 flex items-center bg-surface dark:bg-background-dark/95 border-b border-border-color dark:border-primary/20 px-4 py-3 h-16 relative">
        <Link
          to="/dashboard"
          className="text-foreground dark:text-slate-100 p-2 hover:bg-slate-100 dark:hover:bg-primary/20 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined align-middle">
            arrow_back
          </span>
        </Link>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-foreground dark:text-slate-100">
          Tạo đơn nghỉ phép
        </h1>
      </div>

      <main className="max-w-md mx-auto p-4 md:p-6">

        {/* Main Form Card */}
        <div className="bg-surface dark:bg-slate-900/50 rounded-lg border border-border-color dark:border-primary/10 p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground dark:text-slate-100 mb-6">
            Thông tin nghỉ phép
          </h2>

          <form className="space-y-4">

            {/* Leave Type */}
            <FormSelect
              label="Loại phép"
              options={[
                { value: "", label: "Chọn loại phép" },
                { value: "annual", label: "Nghỉ phép năm" },
                { value: "sick", label: "Nghỉ ốm" },
                { value: "unpaid", label: "Nghỉ không lương" },
                { value: "personal", label: "Việc riêng" },
              ]}
            />

            {/* Start Date */}
            <FormDate label="Ngày bắt đầu" />

            {/* End Date */}
            <FormDate label="Ngày kết thúc" />

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground dark:text-slate-200">
                Lý do nghỉ
              </label>
              <textarea
                rows={4}
                placeholder="Nhập lý do chi tiết..."
                className="w-full p-3 bg-surface dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-md text-foreground dark:text-slate-200 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
              />
            </div>

            {/* Info Box */}
            <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-md border border-primary/10">
              <div className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-sm">
                  info
                </span>
                <p className="text-xs text-muted-foreground dark:text-slate-400">
                  Đơn xin nghỉ phép sẽ được gửi đến quản lý trực tiếp của bạn để phê duyệt.
                </p>
              </div>
            </div>

          </form>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-md shadow-md shadow-primary/20 transition-all active:scale-[0.98]">
            Gửi đơn
          </button>

          <button className="w-full h-12 bg-transparent border border-border-color dark:border-slate-700 text-foreground dark:text-slate-200 font-medium rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            Hủy bỏ
          </button>
        </div>

        {/* Summary Card */}
        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-dashed border-border-color dark:border-slate-700">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Tóm tắt quỹ phép
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Số ngày còn lại</p>
              <p className="text-lg font-bold text-foreground dark:text-slate-100">
                12.5 ngày
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Phép đã dùng</p>
              <p className="text-lg font-bold text-foreground dark:text-slate-100">
                2.5 ngày
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
          expand_more
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
          calendar_month
        </span>
      </div>
    </div>
  </div>
);
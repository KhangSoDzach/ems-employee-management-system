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
    <SidebarProvider>
      <AppSidebar role="employee" variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="flex flex-1 flex-col p-6 gap-8 pb-28 bg-gray-50 dark:bg-gray-950">
          
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Tạo đơn nghỉ phép
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Vui lòng điền đầy đủ thông tin để gửi đơn nghỉ phép
            </p>
          </div>

          {/* ====== 2 COLUMN LAYOUT ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* ================= FORM ================= */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">

              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                Thông tin nghỉ phép
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">

                {/* Leave Type */}
                <div className="space-y-2">
                  <label className="font-medium">Loại phép</label>
                  <select
                    {...register("leaveType")}
                    value={watch("leaveType") || ""}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  >
                    <option value="">Chọn loại phép</option>
                    <option value="annual">Nghỉ phép năm</option>
                    <option value="sick">Nghỉ ốm</option>
                    <option value="unpaid">Nghỉ không lương</option>
                    <option value="personal">Việc riêng</option>
                  </select>
                  {errors.leaveType && (
                    <p className="text-sm text-red-500">
                      {errors.leaveType.message}
                    </p>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <label className="font-medium">Ngày bắt đầu</label>
                  <input
                    type="date"
                    {...register("startDate")}
                    className="w-full mt-2 px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label className="font-medium">Ngày kết thúc</label>
                  <input
                    type="date"
                    {...register("endDate")}
                    className="w-full mt-2 px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  {errors.endDate && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.endDate.message}
                    </p>
                  )}
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <label className="font-medium">Lý do nghỉ</label>
                  <textarea
                    rows={4}
                    placeholder="Nhập lý do chi tiết..."
                    {...register("reason")}
                    className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none"
                  />
                  {errors.reason && (
                    <p className="text-sm text-red-500">
                      {errors.reason.message}
                    </p>
                  )}
                </div>

                {/* Info Box */}
                <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/10 text-sm text-gray-600 dark:text-gray-400">
                  Đơn xin nghỉ phép sẽ được gửi đến quản lý trực tiếp của bạn để phê duyệt.
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => reset()}
                    className="px-6 py-3 rounded-xl border"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={!isValid}
                    className={`px-8 py-3 font-semibold rounded-xl text-white transition
                      ${isValid 
                        ? "bg-primary hover:bg-primary/90"
                        : "bg-gray-400 cursor-not-allowed"
                      }`}
                  >
                    Gửi đơn
                  </button>
                </div>

              </form>
            </div>

            {/* ================= SUMMARY CARD ================= */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm sticky top-24">

              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6">
                Tóm tắt quỹ phép
              </h3>

              <div className="space-y-6">

                <div>
                  <p className="text-sm text-gray-500">Số ngày còn lại</p>
                  <p className="text-2xl font-bold text-primary">
                    12.5 ngày
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Phép đã dùng</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    2.5 ngày
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Tổng phép năm</p>
                  <p className="text-lg font-semibold">
                    15 ngày
                  </p>
                </div>

              </div>
            </div>

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default LeaveRequestPage
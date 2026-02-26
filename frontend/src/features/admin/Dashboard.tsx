import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { differenceInYears } from "date-fns"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

/* ====================== */
/* ====== SCHEMA ======== */
/* ====================== */

const employeeSchema = z.object({
  fullName: z
    .string()
    .min(2, "Họ tên phải có ít nhất 2 ký tự")
    .max(255, "Họ tên không quá 255 ký tự"),

  nationalId: z
    .string()
    .regex(/^(\d{9}|\d{12})$/, "CMND/CCCD phải là 9 hoặc 12 số"),

  companyEmail: z
    .string()
    .email("Email không hợp lệ"),

  phoneNumber: z
    .string()
    .regex(/^\d{10,13}$/, "Số điện thoại phải từ 10-13 số"),

  dateOfBirth: z
    .string()
    .refine(
      (date) =>
        differenceInYears(new Date(), new Date(date)) >= 18,
      "Nhân viên phải từ 18 tuổi trở lên"
    ),
})

type EmployeeFormValues = z.infer<typeof employeeSchema>

/* ====================== */
/* ====== CARD ========== */
/* ====================== */

interface EmployeeCardProps {
  name: string
  code: string
  status: string
  statusColor: string
  avatar?: string
  id: string | number
  email: string
  phone: string
}

function EmployeeCard({
  name,
  code,
  status,
  statusColor,
  avatar,
  id,
  email,
  phone,
}: EmployeeCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {avatar ? (
              <img src={avatar} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-xl font-bold">
                {name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{name}</h3>
            <p className="text-xs text-primary font-medium">Mã: {code}</p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${statusColor}`}
        >
          {status}
        </span>
      </div>

      <div className="grid gap-2 border-t border-gray-50 dark:border-gray-700 pt-3 text-sm text-gray-600 dark:text-gray-400">
        <div>ID: {id}</div>
        <div className="truncate">Email: {email}</div>
        <div>Phone: {phone}</div>
      </div>
    </div>
  )
}

/* ====================== */
/* ====== PAGE ========== */
/* ====================== */

export default function Page() {
  const [open, setOpen] = useState(false)

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    mode: "onChange",
  })

  function onSubmit(data: EmployeeFormValues) {
    console.log("Employee created:", data)
    alert("Tạo nhân viên thành công!")
    setOpen(false)
    form.reset()
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="flex flex-1 flex-col p-6 gap-6 pb-28 bg-gray-50 dark:bg-gray-950">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Danh sách nhân viên
            </h1>

            <button
              onClick={() => setOpen(true)}
              className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              + Thêm nhân viên
            </button>
          </div>

          {/* Employee list */}
          <div className="space-y-4">
            <EmployeeCard
              name="Nguyễn Văn An"
              code="NV001"
              status="Hoạt động"
              statusColor="bg-green-100 text-green-600"
              id="123456789012"
              email="an.nguyen@company.vn"
              phone="0912345678"
            />
          </div>

          {/* ================= MODAL ================= */}
          {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-center px-8 py-6 border-b">
                  <h2 className="text-2xl font-semibold">
                    Thêm nhân viên mới
                  </h2>

                  <button onClick={() => setOpen(false)}>✕</button>
                </div>

                {/* Body */}
                <div className="p-10">
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  >
                    {/* Họ tên */}
                    <div>
                      <label className="font-medium">Họ và tên</label>
                      <input
                        {...form.register("fullName")}
                        className={`w-full mt-2 px-5 py-3 rounded-xl border ${form.formState.errors.fullName
                          ? "border-red-500"
                          : "border-gray-300"
                          }`}
                        placeholder="Vui lòng nhập họ và tên của nhân viên"
                      />
                      <p className="text-sm text-red-500 mt-2">
                        {form.formState.errors.fullName?.message}
                      </p>
                    </div>

                    {/* CCCD */}
                    <div>
                      <label className="font-medium">CMND / CCCD</label>
                      <input
                        {...form.register("nationalId")}
                        className={`w-full mt-2 px-5 py-3 rounded-xl border ${form.formState.errors.nationalId
                          ? "border-red-500"
                          : "border-gray-300"
                          }`}
                        placeholder="Vui lòng nhập CCCD của nhân viên"
                      />
                      <p className="text-sm text-red-500 mt-2">
                        {form.formState.errors.nationalId?.message}
                      </p>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="font-medium">Email công ty</label>
                      <input
                        type="email"
                        {...form.register("companyEmail")}
                        className={`w-full mt-2 px-5 py-3 rounded-xl border ${form.formState.errors.companyEmail
                          ? "border-red-500"
                          : "border-gray-300"
                          }`}
                        placeholder="Vui lòng nhập email công ty của nhân viên"
                      />
                      <p className="text-sm text-red-500 mt-2">
                        {form.formState.errors.companyEmail?.message}
                      </p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="font-medium">Số điện thoại</label>
                      <input
                        {...form.register("phoneNumber")}
                        className={`w-full mt-2 px-5 py-3 rounded-xl border ${form.formState.errors.phoneNumber
                          ? "border-red-500"
                          : "border-gray-300"
                          }`}
                        placeholder="Vui lòng nhập số điện thoại của nhân viên"
                      />
                      <p className="text-sm text-red-500 mt-2">
                        {form.formState.errors.phoneNumber?.message}
                      </p>
                    </div>

                    {/* Ngày sinh */}
                    <div>
                      <label className="font-medium">Ngày sinh</label>
                      <input
                        type="date"
                        {...form.register("dateOfBirth")}
                        className={`w-full mt-2 px-5 py-3 rounded-xl border ${form.formState.errors.dateOfBirth
                          ? "border-red-500"
                          : "border-gray-300"
                          }`}
                      />
                      <p className="text-sm text-red-500 mt-2">
                        {form.formState.errors.dateOfBirth?.message}
                      </p>
                    </div>

                    {/* Footer Buttons */}
                    <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="px-6 py-3 rounded-xl border"
                      >
                        Hủy
                      </button>

                      <button
                        type="submit"
                        disabled={!form.formState.isValid}
                        className="px-8 py-3 font-semibold rounded-xl bg-primary text-white disabled:opacity-50"
                      >
                        Lưu & Tạo tài khoản
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
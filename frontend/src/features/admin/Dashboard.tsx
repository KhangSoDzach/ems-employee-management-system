import React, { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

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

export default function Page() {
  const [open, setOpen] = useState(false)

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
              phone="0912 345 678"
            />
          </div>

          {/* ================= MODAL ================= */}
         {open && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

    <div className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">

      {/* Header */}
      <div className="flex justify-between items-center px-8 py-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Thêm nhân viên mới
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Điền thông tin cơ bản để khởi tạo hồ sơ nhân sự trong hệ thống.
          </p>
        </div>

        <button
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="max-h-[75vh] overflow-y-auto">

        {/* Section header */}
        <div className="px-8 py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Thông tin cơ bản
          </h3>
        </div>

        <div className="p-10">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Employee ID */}
            <div className="md:col-span-2">
              <label className="text-base font-medium text-gray-600 dark:text-gray-300">
                Employee ID
              </label>
              <input
                readOnly
                value="EMP-2026-0004"
                className="w-full mt-2 px-5 py-3.5 text-base rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
              />
              <p className="text-sm text-gray-400 mt-2">
                ID được tạo tự động bởi hệ thống.
              </p>
            </div>

            {/* Họ tên */}
            <div>
              <label className="text-base font-medium text-gray-600 dark:text-gray-300">
                Họ và tên
              </label>
              <input
                placeholder="Nguyễn Văn A"
                className="w-full mt-2 px-5 py-3.5 text-base rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* CCCD */}
            <div>
              <label className="text-base font-medium text-gray-600 dark:text-gray-300">
                CMND / CCCD
              </label>
              <input
                placeholder="0123456789"
                className="w-full mt-2 px-5 py-3.5 text-base rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-base font-medium text-gray-600 dark:text-gray-300">
                Email công ty
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                className="w-full mt-2 px-5 py-3.5 text-base rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-base font-medium text-gray-600 dark:text-gray-300">
                Số điện thoại
              </label>
              <div className="flex gap-3 mt-2">
                <select className="w-32 px-4 py-3.5 text-base rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none">
                  <option>+84</option>
                  <option>+60</option>
                  <option>+65</option>
                  <option>+1</option>
                </select>

                <input
                  type="tel"
                  placeholder="0912 345 678"
                  className="flex-1 px-5 py-3.5 text-base rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            {/* Ngày sinh */}
            <div>
              <label className="text-base font-medium text-gray-600 dark:text-gray-300">
                Ngày sinh
              </label>
              <input
                type="date"
                className="w-full mt-2 px-5 py-3.5 text-base rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-4 px-8 py-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
        <button
          onClick={() => setOpen(false)}
          className="px-6 py-3 text-base rounded-xl border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          Hủy
        </button>

        <button
          type="submit"
          className="px-8 py-3 text-base font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 shadow-sm transition"
        >
          Lưu & Tạo tài khoản
        </button>
      </div>

    </div>
  </div>
)}

        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
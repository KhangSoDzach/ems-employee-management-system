import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { differenceInYears } from "date-fns";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/* ====================== */
/* ====== SCHEMA ======== */
/* ====================== */

const employeeSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  nationalId: z
    .string()
    .regex(/^(\d{9}|\d{12})$/, "CMND/CCCD phải là 9 hoặc 12 số"),
  companyEmail: z.string().email("Email không hợp lệ"),
  phoneNumber: z
    .string()
    .regex(/^\d{10,13}$/, "Số điện thoại phải từ 10-13 số"),
  dateOfBirth: z
    .string()
    .refine(
      (date) => differenceInYears(new Date(), new Date(date)) >= 18,
      "Nhân viên phải từ 18 tuổi trở lên",
    ),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

/* ====================== */
/* ====== CARD ========== */
/* ====================== */

interface EmployeeCardProps {
  name: string;
  code: string;
  status: string;
  statusColor: string;
  avatar?: string;
  id: string | number;
  email: string;
  phone: string;
  onEdit?: () => void;
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
  onEdit,
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

            <button
              onClick={onEdit}
              className="mt-2 text-xs text-blue-600 hover:underline font-medium"
            >
              ✏ Chỉnh sửa
            </button>
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
  );
}

/* ====================== */
/* ====== PAGE ========== */
/* ====================== */

export default function Page() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeCardProps | null>(null);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (selectedEmployee) {
      form.reset({
        fullName: selectedEmployee.name,
        nationalId: String(selectedEmployee.id),
        companyEmail: selectedEmployee.email,
        phoneNumber: selectedEmployee.phone,
        dateOfBirth: "1995-05-15",
      });
    } else {
      form.reset();
    }
  }, [selectedEmployee]);

  function onSubmit(data: EmployeeFormValues) {
    if (selectedEmployee) {
      console.log("Updated employee:", data);
      alert("Cập nhật nhân viên thành công!");
    } else {
      console.log("Created employee:", data);
      alert("Tạo nhân viên thành công!");
    }

    setOpen(false);
    setSelectedEmployee(null);
    form.reset();
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="flex flex-1 flex-col p-6 gap-6 pb-28 bg-gray-50 dark:bg-gray-950">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Danh sách nhân viên</h1>

            <button
              onClick={() => {
                setSelectedEmployee(null);
                setOpen(true);
              }}
              className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
            >
              + Thêm nhân viên
            </button>
          </div>

          <div className="space-y-4">
            <EmployeeCard
              name="Nguyễn Văn An"
              code="NV001"
              status="Hoạt động"
              statusColor="bg-green-100 text-green-600"
              id="123456789012"
              email="an.nguyen@company.vn"
              phone="0912345678"
              onEdit={() => {
                setSelectedEmployee({
                  name: "Nguyễn Văn An",
                  code: "NV001",
                  status: "Hoạt động",
                  statusColor: "bg-green-100 text-green-600",
                  id: "123456789012",
                  email: "an.nguyen@company.vn",
                  phone: "0912345678",
                });
                setOpen(true);
              }}
            />
          </div>

          {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-lg shadow-2xl flex flex-col">
                {/* ================= HEADER ================= */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    {selectedEmployee
                      ? "Cập nhật hồ sơ nhân viên"
                      : "Thêm nhân viên mới"}
                  </h2>

                  <button
                    onClick={() => {
                      setOpen(false);
                      setSelectedEmployee(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* ================= BODY ================= */}
                <div className="flex-1 overflow-y-auto p-6">
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* ================= CỘT 1 ================= */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-primary border-b border-slate-100 pb-2">
                          <span className="material-symbols-outlined">
                            person
                          </span>
                          <h3 className="font-bold uppercase text-sm tracking-wider">
                            Thông tin cá nhân
                          </h3>
                        </div>

                        {/* Avatar */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative group">
                            <img
                              src={
                                selectedEmployee?.avatar ||
                                "https://i.pravatar.cc/150"
                              }
                              className="size-20 rounded-full ring-2 ring-slate-100 object-cover"
                            />
                            <button
                              type="button"
                              className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full border-2 border-white shadow-sm"
                            >
                              <span className="material-symbols-outlined text-xs">
                                photo_camera
                              </span>
                            </button>
                          </div>

                          <div>
                            <div className="text-xs font-semibold text-slate-400 uppercase">
                              Mã nhân viên
                            </div>
                            <div className="font-mono font-bold">
                              {selectedEmployee?.code || "NV--"}
                            </div>

                            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                              {selectedEmployee?.status || "Chưa xác định"}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">
                              Họ và tên
                            </label>
                            <input
                              {...form.register("fullName")}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-primary focus:border-primary"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">
                              CMND/CCCD
                            </label>
                            <input
                              {...form.register("nationalId")}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-primary focus:border-primary"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">
                              Ngày sinh
                            </label>
                            <input
                              type="date"
                              {...form.register("dateOfBirth")}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-primary focus:border-primary"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">
                              Giới tính
                            </label>
                            <select
                              {...form.register("gender")}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-primary focus:border-primary"
                            >
                              <option>Nam</option>
                              <option>Nữ</option>
                              <option>Khác</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">
                              Số điện thoại
                            </label>
                            <input
                              {...form.register("phoneNumber")}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-primary focus:border-primary"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">
                              Email liên hệ
                            </label>
                            <input
                              {...form.register("companyEmail")}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-primary focus:border-primary"
                            />
                          </div>

                          <div className="space-y-1 col-span-2">
                            <label className="text-xs font-bold text-slate-500">
                              Địa chỉ thường trú
                            </label>
                            <textarea
                              rows={2}
                              {...form.register("address")}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm resize-none focus:ring-primary focus:border-primary"
                            />
                          </div>
                        </div>
                      </div>

                      {/* ================= CỘT 2 ================= */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-primary border-b border-slate-100 pb-2">
                          <span className="material-symbols-outlined">
                            badge
                          </span>
                          <h3 className="font-bold uppercase text-sm tracking-wider">
                            Thông tin công việc
                          </h3>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">
                              Phòng ban
                            </label>
                            <select
                              {...form.register("department")}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-primary focus:border-primary"
                            >
                              <option>Phòng Phần mềm</option>
                              <option>Phòng Nhân sự</option>
                              <option>Phòng Kinh doanh</option>
                              <option>Ban Giám đốc</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">
                              Vị trí công việc
                            </label>
                            <input
                              {...form.register("position")}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-medium focus:ring-primary focus:border-primary"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">
                              Quản lý trực tiếp
                            </label>
                            <select
                              {...form.register("manager")}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-primary focus:border-primary"
                            >
                              <option>Nguyễn Văn A</option>
                              <option>Trần Thị B</option>
                              <option>Lê Văn C</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">
                                Ngày vào làm
                              </label>
                              <input
                                type="date"
                                {...form.register("joinDate")}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-primary focus:border-primary"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">
                                Ngày kết thúc (tùy chọn)
                              </label>
                              <input
                                type="date"
                                {...form.register("endDate")}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-primary focus:border-primary"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">
                              Loại hợp đồng
                            </label>
                            <select
                              {...form.register("contractType")}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-primary focus:border-primary"
                            >
                              <option>Hợp đồng không xác định thời hạn</option>
                              <option>Hợp đồng 1 năm</option>
                              <option>Thử việc</option>
                            </select>
                          </div>

                          {/* Info box */}
                          <div className="p-4 bg-primary/5 border border-primary/10 rounded-md mt-4">
                            <div className="flex items-start gap-3">
                              <span className="material-symbols-outlined text-primary text-lg">
                                info
                              </span>
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                Các thay đổi về chức danh và phòng ban sẽ cần sự
                                phê duyệt của trưởng bộ phận.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* ================= FOOTER ================= */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setSelectedEmployee(null);
                    }}
                    className="px-6 py-2 text-sm font-semibold border border-slate-200 bg-white rounded-md hover:bg-slate-50 transition-colors text-slate-600"
                  >
                    Hủy
                  </button>

                  <button
                    onClick={form.handleSubmit(onSubmit)}
                    className="px-8 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary/90 transition-all shadow-md"
                  >
                    {selectedEmployee ? "Cập nhật" : "Tạo mới"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

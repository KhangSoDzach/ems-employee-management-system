import React from "react"
import { X, Edit, MapPin, History, FileText } from "lucide-react"

interface AssetDetailModalProps {
  open: boolean
  onClose: () => void
}

export default function AssetDetailModal({
  open,
  onClose,
}: AssetDetailModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl flex flex-col">

        {/* ===== HEADER ===== */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              MacBook Pro M2 2023
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Mã tài sản: AST-984210
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:text-primary">
              <Edit size={18} />
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:text-primary"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ===== BODY ===== */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/40">
          <div className="grid grid-cols-12 gap-6">

            {/* LEFT COLUMN */}
            <div className="col-span-12 lg:col-span-4 space-y-6">

              {/* Image Card */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border shadow-sm overflow-hidden">
                <div className="aspect-video bg-slate-100 relative">
                  <img
                    src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8"
                    alt="MacBook"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      ĐANG SẴN SÀNG
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={16} className="text-primary" />
                    Kho trung tâm (Khu A-12)
                  </div>

                  <button className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-lg text-sm font-semibold">
                    Cấp phát tài sản
                  </button>

                  <button className="w-full bg-slate-100 hover:bg-slate-200 py-2 rounded-lg text-sm font-semibold">
                    Thu hồi tài sản
                  </button>
                </div>
              </div>

              {/* Extra Info */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border shadow-sm p-4">
                <h3 className="text-sm font-bold mb-3">
                  Thông tin phụ trợ
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bảo hành:</span>
                    <span>15/06/2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nhà cung cấp:</span>
                    <span>FPT Retail</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hợp đồng:</span>
                    <span className="text-primary">HD-2023-084</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="col-span-12 lg:col-span-8 space-y-6">

              {/* Basic Info */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border shadow-sm">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <h3 className="font-bold text-sm">
                    Thông tin cơ bản
                  </h3>
                  <FileText size={18} />
                </div>

                <div className="p-5 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">Mã tài sản</p>
                    <p className="font-medium">AST-984210</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Loại</p>
                    <p className="font-medium">Thiết bị Công nghệ</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Giá trị</p>
                    <p className="font-medium">45,900,000 VNĐ</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Ngày mua</p>
                    <p className="font-medium">12/05/2023</p>
                  </div>
                </div>
              </div>

              {/* History */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border shadow-sm">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <h3 className="font-bold text-sm">
                    Lịch sử tài sản
                  </h3>
                  <History size={18} />
                </div>

                <div className="p-5 space-y-4 text-sm">
                  <div className="border-l-2 border-primary pl-4">
                    <p className="font-semibold">
                      Thu hồi tài sản
                    </p>
                    <p className="text-slate-500 text-xs">
                      10:30, 20/01/2024
                    </p>
                    <p className="text-slate-600">
                      Thu hồi từ Nguyễn Văn A.
                    </p>
                  </div>

                  <div className="border-l-2 border-blue-500 pl-4">
                    <p className="font-semibold">
                      Cấp phát tài sản
                    </p>
                    <p className="text-slate-500 text-xs">
                      14:00, 15/05/2023
                    </p>
                    <p className="text-slate-600">
                      Cấp phát cho Nguyễn Văn A.
                    </p>
                  </div>
                </div>

                <button className="w-full border-t py-2 text-xs text-slate-500 hover:text-primary">
                  XEM TOÀN BỘ LỊCH SỬ
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
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

  const asset = {
    name: "MacBook Pro M2 2023",
    code: "AST-984210",
    type: "Thiết bị Công nghệ",
    value: "45,900,000 VNĐ",
    purchaseDate: "12/05/2023",
    status: "ĐANG SẴN SÀNG",
    condition: "Tốt",
    warranty: "15/06/2025",
    supplier: "FPT Retail",
    contract: "HD-2023-084",
    location: "Kho trung tâm (Khu A-12)",
    description:
      "MacBook Pro M2 2023 - RAM 16GB, SSD 512GB. Thiết bị còn mới, không trầy xước, pin 100%. Được sử dụng cho bộ phận IT Development.",
  }

  const getConditionStyle = (condition: string) => {
    switch (condition) {
      case "Mới":
      case "Tốt":
        return "bg-emerald-100 text-emerald-700"
      case "Hỏng":
        return "bg-amber-100 text-amber-700"
      case "Thất lạc":
        return "bg-red-100 text-red-700"
      case "Thanh lý":
        return "bg-slate-200 text-slate-700"
      default:
        return "bg-slate-100 text-slate-600"
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl flex flex-col">

        {/* HEADER */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{asset.name}</h2>
            <p className="text-xs text-slate-500 font-mono">
              Mã tài sản: {asset.code}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:text-primary">
              <Edit size={18} />
            </button>
            <button onClick={onClose} className="p-2 hover:text-primary">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/40">
          <div className="grid grid-cols-12 gap-6">

            {/* LEFT COLUMN */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-lg border shadow-sm overflow-hidden">
                <div className="aspect-video bg-slate-100 relative">
                  <img
                    src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8"
                    alt="asset"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      {asset.status}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={16} className="text-primary" />
                    {asset.location}
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
                    <span>{asset.warranty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nhà cung cấp:</span>
                    <span>{asset.supplier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hợp đồng:</span>
                    <span className="text-primary">
                      {asset.contract}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="col-span-12 lg:col-span-8 space-y-6">

              {/* BASIC INFO */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border shadow-sm">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <h3 className="font-bold text-sm">
                    Thông tin cơ bản
                  </h3>
                  <FileText size={18} />
                </div>

                <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">

                  <div>
                    <p className="text-slate-400 text-xs">Mã tài sản</p>
                    <p className="font-medium">{asset.code}</p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-xs">Loại</p>
                    <p className="font-medium">{asset.type}</p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-xs">Giá trị</p>
                    <p className="font-medium">{asset.value}</p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-xs">Ngày mua</p>
                    <p className="font-medium">{asset.purchaseDate}</p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-xs">Tình trạng</p>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getConditionStyle(
                        asset.condition
                      )}`}
                    >
                      {asset.condition}
                    </span>
                  </div>

                  {/* DESCRIPTION FULL WIDTH */}
                  <div className="col-span-2 md:col-span-3 pt-3 border-t">
                    <p className="text-slate-400 text-xs mb-2">
                      Mô tả chi tiết
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      {asset.description}
                    </p>
                  </div>

                </div>
              </div>

              {/* HISTORY */}
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
import React from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AssetCreateModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Thêm tài sản mới
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Mã tài sản */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Mã tài sản
              </label>
              <input
                disabled
                value="ASSET-2024-XXXX"
                className="w-full bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500"
              />
              <p className="text-xs text-gray-400 italic">
                * Mã này được tạo tự động khi lưu
              </p>
            </div>

            {/* Tên tài sản */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Tên tài sản <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Nhập tên tài sản..."
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Loại */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Loại tài sản
              </label>
              <select className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary">
                <option>Chọn loại tài sản</option>
                <option>Thiết bị IT</option>
                <option>Nội thất văn phòng</option>
                <option>Điện máy</option>
              </select>
            </div>

            {/* Giá trị */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Giá trị (VNĐ)
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  ₫
                </span>
              </div>
            </div>

            {/* Ngày mua */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Ngày mua
              </label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Trạng thái */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Trạng thái khởi tạo
              </label>
              <select className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary">
                <option>Sẵn có (Available)</option>
                <option>Đã cấp phát (Assigned)</option>
                <option>Thu hồi (Retired)</option>
              </select>
            </div>

          </div>

          {/* Tình trạng */}
          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium text-gray-700">
              Tình trạng tài sản
            </label>

            <div className="flex flex-wrap gap-5">

              {["Mới", "Tốt", "Hỏng hóc", "Thất lạc", "Đã thanh lý"].map(
                (item, index) => (
                  <label key={item} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="radio"
                      name="condition"
                      defaultChecked={index === 0}
                      className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                    />
                    {item}
                  </label>
                ),
              )}

            </div>
          </div>

          {/* Ghi chú */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Ghi chú / Mô tả chi tiết
            </label>
            <textarea
              rows={3}
              placeholder="Nhập mô tả thêm về cấu hình, thông số hoặc tình trạng cụ thể..."
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t">

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-white"
          >
            Hủy
          </button>

          <button className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary/90 shadow-sm">
            Lưu tài sản
          </button>

        </div>
      </div>
    </div>
  );
}
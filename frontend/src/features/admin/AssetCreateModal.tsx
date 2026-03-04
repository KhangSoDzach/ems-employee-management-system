import React, { useState } from "react";
import { X, UploadCloud } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AssetCreateModal({ open, onClose }: Props) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  if (!open) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-5 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Thêm tài sản mới
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8 max-h-[80vh] overflow-y-auto">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-6">

            {/* IMAGE UPLOAD */}
            <div className="bg-gray-50 rounded-xl border p-4">
              <label className="text-sm font-semibold text-gray-700 block mb-3">
                Hình ảnh tài sản
              </label>

              <div className="w-full aspect-video bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <UploadCloud className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">Tải hình ảnh lên</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* THÔNG TIN PHỤ */}
            <div className="bg-gray-50 rounded-xl border p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">
                Thông tin bổ sung
              </h3>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Bảo hành đến
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Nhà cung cấp
                </label>
                <input
                  placeholder="Nhập tên nhà cung cấp..."
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Hợp đồng đến
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Mã tài sản */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Mã tài sản
                </label>
                <input
                  disabled
                  value="ASSET-2026-XXXX"
                  className="w-full bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500"
                />
                <p className="text-xs text-gray-400 italic">
                  * Tự động tạo khi lưu
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
                  <option>Thiết bị IT</option>
                  <option>Nội thất</option>
                  <option>Điện máy</option>
                </select>
              </div>

              {/* Giá trị */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Giá trị (VNĐ)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
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
                  <option>Sẵn có</option>
                  <option>Đã cấp phát</option>
                  <option>Thu hồi</option>
                </select>
              </div>

            </div>

            {/* Tình trạng */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Tình trạng tài sản
              </label>

              <div className="flex flex-wrap gap-6">
                {["Mới", "Tốt", "Hỏng", "Thất lạc", "Thanh lý"].map(
                  (item, index) => (
                    <label key={item} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="radio"
                        name="condition"
                        defaultChecked={index === 0}
                        className="w-4 h-4 text-primary"
                      />
                      {item}
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Ghi chú */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Ghi chú
              </label>
              <textarea
                rows={4}
                placeholder="Mô tả thêm về cấu hình, tình trạng..."
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-8 py-5 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-white"
          >
            Hủy
          </button>

          <button className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary/90 shadow">
            Lưu tài sản
          </button>
        </div>
      </div>
    </div>
  );
}
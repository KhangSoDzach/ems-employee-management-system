import React, { useState, useEffect } from "react";
import { X, UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  assetService,
  AssetUpdatePayload,
  AssetCondition,
  ASSET_CONDITION_LABELS,
} from "@/services/assetService";

interface Props {
  open: boolean;
  assetId: string | number | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function AssetEditModal({ open, assetId, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState<AssetUpdatePayload>({});

  useEffect(() => {
    if (!open || !assetId) return;
    setLoading(true);
    assetService.getAssetById(assetId).then((a) => {
      setForm({
        name:           a.name,
        type:           a.type ?? "",
        description:    a.description ?? "",
        value:          undefined,
        purchaseDate:   a.purchaseDate ?? undefined,
        warrantyDate:   a.warranty ?? "",
        supplier:       a.supplier ?? "",
        contractDate:   a.contract ?? "",
        condition:      a.condition,
        note:           "",
        image:          a.imageUrl ?? "",
        locationOrUser: a.location ?? "",
      });
      setImagePreview(a.imageUrl ?? null);
    }).catch(() => toast.error("Không tải được dữ liệu tài sản"))
      .finally(() => setLoading(false));
  }, [open, assetId]);

  if (!open) return null;

  const set = (field: keyof AssetUpdatePayload, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const url = URL.createObjectURL(file); setImagePreview(url); set("image", url); }
  };

  const handleSubmit = async () => {
    if (!assetId) return;
    setSaving(true);
    try {
      await assetService.updateAsset(assetId, form);
      toast.success("Cập nhật tài sản thành công");
      onSaved();
    } catch { toast.error("Không thể cập nhật tài sản"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-5 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa tài sản</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mr-3" /> Đang tải...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8 max-h-[80vh] overflow-y-auto">
            {/* LEFT */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gray-50 rounded-xl border p-4">
                <label className="text-sm font-semibold text-gray-700 block mb-3">Hình ảnh tài sản</label>
                <div className="w-full aspect-video bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative">
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="object-cover w-full h-full" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <UploadCloud className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs">Tải hình ảnh lên</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <input placeholder="Hoặc nhập URL hình ảnh..." value={form.image ?? ""}
                  onChange={(e) => set("image", e.target.value)}
                  className="mt-2 w-full border border-gray-200 rounded-md px-3 py-2 text-xs" />
              </div>

              <div className="bg-gray-50 rounded-xl border p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-800">Thông tin bổ sung</h3>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Bảo hành đến</label>
                  <input type="date" value={form.warrantyDate ?? ""}
                    onChange={(e) => set("warrantyDate", e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Nhà cung cấp</label>
                  <input placeholder="Nhập tên nhà cung cấp..." value={form.supplier ?? ""}
                    onChange={(e) => set("supplier", e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Hợp đồng đến</label>
                  <input type="date" value={form.contractDate ?? ""}
                    onChange={(e) => set("contractDate", e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Tên tài sản *</label>
                  <input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Loại tài sản</label>
                  <input placeholder="VD: Laptop, Màn hình..." value={form.type ?? ""}
                    onChange={(e) => set("type", e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Giá trị (VNĐ)</label>
                  <input type="number" min={0} placeholder="Không đổi nếu để trống"
                    value={form.value ?? ""}
                    onChange={(e) => set("value", e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Ngày mua</label>
                  <input type="date" value={form.purchaseDate ?? ""}
                    onChange={(e) => set("purchaseDate", e.target.value ? e.target.value as unknown as undefined : undefined)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Vị trí / Người sử dụng</label>
                  <input placeholder="VD: Kho HN hoặc Nguyễn Văn A..." value={form.locationOrUser ?? ""}
                    onChange={(e) => set("locationOrUser", e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              {/* Tình trạng */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Tình trạng tài sản</label>
                <div className="grid grid-cols-5 gap-3">
                  {(Object.keys(ASSET_CONDITION_LABELS) as AssetCondition[]).map((cond) => (
                    <label key={cond} className="cursor-pointer">
                      <input type="radio" name="condition" value={cond}
                        checked={form.condition === cond}
                        onChange={() => set("condition", cond)}
                        className="peer hidden" />
                      <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 bg-white text-gray-500 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary">
                        <span className="text-xs font-semibold">{ASSET_CONDITION_LABELS[cond]}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ghi chú */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                <textarea rows={3} placeholder="Ghi chú cập nhật..." value={form.note ?? ""}
                  onChange={(e) => set("note", e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-8 py-5 border-t bg-gray-50">
          <button onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-white">
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={saving || loading}
            className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary/90 shadow flex items-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}


interface Asset {
  id: string;
  code: string;
  name: string;
  type: string;
  value: number;
  purchaseDate: string;
  status: string;
  warrantyDate?: string;
  supplier?: string;
  contractDate?: string;
  condition: string;
  note?: string;
  image?: string;
  locationOrUser?: string;
}

interface Props {
  open: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSave: (updatedAsset: Asset) => void;
}

export default function AssetEditModal({
  open,
  asset,
  onClose,
  onSave,
}: Props) {
  const [formData, setFormData] = useState<Asset | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (asset) {
      setFormData(asset);
      setImagePreview(asset.image || null);
    }
  }, [asset]);

  if (!open || !formData) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      setFormData((prev) => (prev ? { ...prev, image: preview } : prev));
    }
  };

  const handleSubmit = () => {
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-5 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Chỉnh sửa tài sản
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8 max-h-[80vh] overflow-y-auto">
          {/* LEFT */}
          <div className="lg:col-span-1 space-y-6">
            {/* IMAGE */}
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

            {/* INFO PHỤ */}
            <div className="bg-gray-50 rounded-xl border p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">
                Thông tin bổ sung
              </h3>

              <div className="space-y-1">
                <label className="text-xs text-gray-600">Bảo hành đến</label>
                <input
                  type="date"
                  name="warrantyDate"
                  value={formData.warrantyDate || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-600">Nhà cung cấp</label>
                <input
                  name="supplier"
                  value={formData.supplier || ""}
                  onChange={handleChange}
                  placeholder="Nhập tên nhà cung cấp..."
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-600">Hợp đồng đến</label>
                <input
                  type="date"
                  name="contractDate"
                  value={formData.contractDate || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Mã tài sản
                </label>
                <input
                  value={formData.code}
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Tên tài sản *
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Loại tài sản
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option>Thiết bị IT</option>
                  <option>Nội thất</option>
                  <option>Điện máy</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Giá trị (VNĐ)
                </label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Ngày mua
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Trạng thái
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option>Sẵn có</option>
                  <option>Đã cấp phát</option>
                  <option>Thu hồi</option>
                </select>
              </div>

              {/* LOCATION */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Vị trí / Người sử dụng
                </label>
                <input
                  name="locationOrUser"
                  value={formData.locationOrUser || ""}
                  onChange={handleChange}
                  placeholder="VD: Kho HN hoặc Nguyễn Văn A..."
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-gray-400">
                  Có thể nhập tên nhân viên hoặc vị trí lưu trữ
                </p>
              </div>
            </div>

            {/* Tình trạng */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Tình trạng tài sản
              </label>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Mới", value: "NEW", icon: "new_releases" },
                  { label: "Tốt", value: "GOOD", icon: "thumb_up" },
                  { label: "Hỏng", value: "DAMAGED", icon: "report_problem" },
                  { label: "Thất lạc", value: "LOST", icon: "search_off" },
                  {
                    label: "Thanh lý",
                    value: "DISPOSED",
                    icon: "delete_forever",
                  },
                ].map((item, index) => (
                  <label key={item.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="condition"
                      value={item.value}
                      defaultChecked={index === 0}
                      className="peer hidden"
                    />

                    <div
                      className="
          flex flex-col items-center justify-center
          p-4 rounded-xl border
          border-gray-200 bg-white
          text-gray-500
          transition-all duration-200
          peer-checked:border-primary
          peer-checked:bg-primary/5
          peer-checked:text-primary
        "
                    >
                      <span className="material-symbols-outlined mb-1 text-lg">
                        {item.icon}
                      </span>
                      <span className="text-xs font-semibold">
                        {item.label}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* NOTE */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Ghi chú
              </label>
              <textarea
                name="note"
                value={formData.note || ""}
                onChange={handleChange}
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

          <button
            onClick={handleSubmit}
            className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary/90 shadow"
          >
            Cập nhật tài sản
          </button>
        </div>
      </div>
    </div>
  );
}

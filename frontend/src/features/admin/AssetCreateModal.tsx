import React, { useState, useEffect } from "react";
import { X, UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  assetService,
  AssetCreatePayload,
  AssetStatus,
  AssetCondition,
  ASSET_STATUS_LABELS,
  ASSET_CONDITION_LABELS,
} from "@/services/assetService";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "AVAILABLE", label: ASSET_STATUS_LABELS.AVAILABLE },
  { value: "RETIRED", label: ASSET_STATUS_LABELS.RETIRED },
];

const CONDITION_OPTIONS: { value: AssetCondition; label: string }[] = [
  { value: "NEW", label: ASSET_CONDITION_LABELS.NEW },
  { value: "GOOD", label: ASSET_CONDITION_LABELS.GOOD },
  { value: "DAMAGED", label: ASSET_CONDITION_LABELS.DAMAGED },
  { value: "LOST", label: ASSET_CONDITION_LABELS.LOST },
  { value: "DISPOSED", label: ASSET_CONDITION_LABELS.DISPOSED },
];

export default function AssetCreateModal({ open, onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [nextCode, setNextCode] = useState("—");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState<AssetCreatePayload>({
    assetName: "",
    assetType: "",
    assetValue: undefined,
    purchaseDate: "",
    initialStatus: "AVAILABLE",
    condition: "NEW",
    location: "",
    warrantyUntil: "",
    supplierName: "",
    contractUntil: "",
    contractNumber: "",
    notes: "",
    description: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (!open) return;
    assetService.getNextCode().then(setNextCode).catch(() => setNextCode("—"));
    setForm({
      assetName: "", assetType: "", assetValue: undefined,
      purchaseDate: "", initialStatus: "AVAILABLE", condition: "NEW",
      location: "", warrantyUntil: "", supplierName: "",
      contractUntil: "", contractNumber: "", notes: "", description: "", imageUrl: "",
    });
    setImagePreview(null);
  }, [open]);

  if (!open) return null;

  const set = (field: keyof AssetCreatePayload, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.assetName.trim()) { toast.error("Tên tài sản là bắt buộc"); return; }
    setSaving(true);
    try {
      const payload: AssetCreatePayload = {
        ...form,
        purchaseDate: form.purchaseDate || undefined,
        warrantyUntil: form.warrantyUntil || undefined,
        contractUntil: form.contractUntil || undefined,
        assetValue: form.assetValue || undefined,
      };
      await assetService.createAsset(payload);
      toast.success("Tạo tài sản thành công");
      onCreated();
    } catch {
      toast.error("Không thể tạo tài sản");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-5 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Thêm tài sản mới</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8 max-h-[80vh] overflow-y-auto">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-6">
            {/* IMAGE UPLOAD */}
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
              <input placeholder="Hoặc nhập URL hình ảnh..." value={form.imageUrl ?? ""}
                onChange={(e) => set("imageUrl", e.target.value)}
                className="mt-2 w-full border border-gray-200 rounded-md px-3 py-2 text-xs" />
            </div>

            {/* THÔNG TIN PHỤ */}
            <div className="bg-gray-50 rounded-xl border p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Thông tin bổ sung</h3>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Bảo hành đến</label>
                <input type="date" value={form.warrantyUntil ?? ""}
                  onChange={(e) => set("warrantyUntil", e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Nhà cung cấp</label>
                <input placeholder="Nhập tên nhà cung cấp..." value={form.supplierName ?? ""}
                  onChange={(e) => set("supplierName", e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Số hợp đồng</label>
                <input placeholder="HD-2026-XXX" value={form.contractNumber ?? ""}
                  onChange={(e) => set("contractNumber", e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Hợp đồng đến</label>
                <input type="date" value={form.contractUntil ?? ""}
                  onChange={(e) => set("contractUntil", e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Mã tài sản */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Mã tài sản</label>
                <input disabled value={nextCode}
                  className="w-full bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500" />
                <p className="text-xs text-gray-400 italic">* Tự động tạo khi lưu</p>
              </div>

              {/* Tên tài sản */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Tên tài sản <span className="text-red-500">*</span>
                </label>
                <input placeholder="Nhập tên tài sản..." value={form.assetName}
                  onChange={(e) => set("assetName", e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
              </div>

              {/* Loại */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Loại tài sản</label>
                <input placeholder="VD: Laptop, Màn hình, Thẻ xe..." value={form.assetType ?? ""}
                  onChange={(e) => set("assetType", e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
              </div>

              {/* Giá trị */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Giá trị (VNĐ)</label>
                <input type="number" min={0} placeholder="0"
                  value={form.assetValue ?? ""}
                  onChange={(e) => set("assetValue", e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
              </div>

              {/* Ngày mua */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Ngày mua</label>
                <input type="date" value={form.purchaseDate ?? ""}
                  onChange={(e) => set("purchaseDate", e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
              </div>

              {/* Trạng thái */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Trạng thái khởi tạo</label>
                <select value={form.initialStatus ?? "AVAILABLE"}
                  onChange={(e) => set("initialStatus", e.target.value as AssetStatus)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                  {INITIAL_STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Vị trí */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Vị trí lưu trữ</label>
                <input placeholder="VD: Kho HN, Khu A-12..." value={form.location ?? ""}
                  onChange={(e) => set("location", e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
              </div>
            </div>

            {/* Tình trạng */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Tình trạng tài sản</label>
              <div className="grid grid-cols-5 gap-3">
                {CONDITION_OPTIONS.map((item) => (
                  <label key={item.value} className="cursor-pointer">
                    <input type="radio" name="condition" value={item.value}
                      checked={form.condition === item.value}
                      onChange={() => set("condition", item.value)}
                      className="peer hidden" />
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 bg-white text-gray-500 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary">
                      <span className="text-xs font-semibold">{item.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Ghi chú */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Ghi chú / Mô tả</label>
              <textarea rows={3} placeholder="Mô tả thêm về cấu hình, tình trạng..."
                value={form.notes ?? ""}
                onChange={(e) => set("notes", e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-8 py-5 border-t bg-gray-50">
          <button onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-white">
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary/90 shadow flex items-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Lưu tài sản
          </button>
        </div>
      </div>
    </div>
  );
}

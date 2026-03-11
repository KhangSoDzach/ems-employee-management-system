import React, { useState, useEffect } from "react";
import { X, UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  assetService,
  AssetDetail,
  AssetUpdatePayload,
  AssetCondition,
  ASSET_CONDITION_LABELS,
} from "@/services/assetService";
import { SYSTEM_MESSAGES } from "@/constants/messages";

interface Props {
  open: boolean;
  asset: AssetDetail | null;
  assetId: string | number | null;
  onClose: () => void;
  onSave: (updated: AssetDetail) => void;
}

const CONDITION_OPTIONS: { value: AssetCondition; label: string }[] = [
  { value: "NEW", label: ASSET_CONDITION_LABELS.NEW },
  { value: "GOOD", label: ASSET_CONDITION_LABELS.GOOD },
  { value: "DAMAGED", label: ASSET_CONDITION_LABELS.DAMAGED },
  { value: "LOST", label: ASSET_CONDITION_LABELS.LOST },
  { value: "DISPOSED", label: ASSET_CONDITION_LABELS.DISPOSED },
];

export default function AssetEditModal({ open, asset, assetId, onClose, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<AssetUpdatePayload>({
    name: "",
    type: "",
    value: undefined,
    purchaseDate: "",
    condition: "NEW",
    locationOrUser: "",
    warrantyDate: "",
    supplier: "",
    contractDate: "",
    contractNumber: "",
    note: "",
    description: "",
    image: "",
  });

  useEffect(() => {
    if (!open || !asset) return;
    setForm({
      name: asset.name,
      type: asset.type ?? "",
      value: asset.value ? Number(asset.value.replace(/[^0-9]/g, "")) : undefined,
      purchaseDate: asset.purchaseDate ?? "",
      condition: asset.condition,
      locationOrUser: asset.location ?? "",
      warrantyDate: asset.warranty ?? "",
      supplier: asset.supplier ?? "",
      contractDate: asset.contract ?? "",
      contractNumber: "",
      note: "",
      description: asset.description ?? "",
      image: asset.imageUrl ?? "",
    });
    setImagePreview(asset.imageUrl ?? null);
    setErrors({});
  }, [open, asset]);

  if (!open || !asset || !assetId) return null;

  const set = (field: keyof AssetUpdatePayload, value: unknown) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!form.name?.trim()) newErrors.name = SYSTEM_MESSAGES.ASSET_CREATE.MSG_REQUIRE_NAME;
    if (!form.type?.trim()) newErrors.type = "Vui lòng nhập loại tài sản";
    if (!form.locationOrUser?.trim()) newErrors.locationOrUser = "Vui lòng nhập vị trí";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSaving(true);
    try {
      const payload: AssetUpdatePayload = {
        ...form,
        purchaseDate: form.purchaseDate || undefined,
        warrantyDate: form.warrantyDate || undefined,
        contractDate: form.contractDate || undefined,
        value: form.value || undefined,
      };
      const updated = await assetService.updateAsset(assetId, payload);
      toast.success(SYSTEM_MESSAGES.SUCCESS_UPDATE);
      onSave(updated);
    } catch {
      toast.error(SYSTEM_MESSAGES.ERROR);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-5 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {SYSTEM_MESSAGES.ASSET_CREATE.TITLE_EDIT}{SYSTEM_MESSAGES.ASSET_CREATE.TXT_CODE_BRACKET_START}{asset.code}{SYSTEM_MESSAGES.ASSET_CREATE.TXT_CODE_BRACKET_END}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8 max-h-[80vh] overflow-y-auto">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-50 rounded-xl border p-4">
              <label className="text-sm font-semibold text-gray-700 block mb-3">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_IMAGE}</label>
              <div className="w-full aspect-video bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative text-gray-400">
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="object-cover w-full h-full" />
                ) : (
                  <div className="text-center">
                    <UploadCloud className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">{SYSTEM_MESSAGES.ASSET_CREATE.UPLOAD_IMAGE}</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <input placeholder={SYSTEM_MESSAGES.ASSET_CREATE.PLACEHOLDER_IMAGE_URL} value={form.image ?? ""}
                onChange={(e) => set("image", e.target.value)}
                className="mt-2 w-full border border-gray-200 rounded-md px-3 py-2 text-xs" />
            </div>

            <div className="bg-gray-50 rounded-xl border p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">{SYSTEM_MESSAGES.ASSET_CREATE.SECTION_ADDITIONAL}</h3>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_WARRANTY}</label>
                <input type="date" value={form.warrantyDate ?? ""} onChange={(e) => set("warrantyDate", e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_SUPPLIER}</label>
                <input value={form.supplier ?? ""} onChange={(e) => set("supplier", e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_CONTRACT_UNTIL}</label>
                <input type="date" value={form.contractDate ?? ""} onChange={(e) => set("contractDate", e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {SYSTEM_MESSAGES.ASSET_CREATE.LABEL_NAME} <span className="text-red-500">{"*"}</span>
                </label>
                <input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 text-sm ${errors.name ? "border-red-500" : "border-gray-200"}`} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {SYSTEM_MESSAGES.ASSET_CREATE.LABEL_TYPE} <span className="text-red-500">{"*"}</span>
                </label>
                <input value={form.type ?? ""} onChange={(e) => set("type", e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 text-sm ${errors.type ? "border-red-500" : "border-gray-200"}`} />
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_VALUE}</label>
                <input type="number" value={form.value ?? ""} onChange={(e) => set("value", e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_PURCHASE_DATE}</label>
                <input type="date" value={form.purchaseDate ?? ""} onChange={(e) => set("purchaseDate", e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1 group relative">
                <label className="text-sm font-medium text-gray-700">
                  {SYSTEM_MESSAGES.ASSET_CREATE.LABEL_LOCATION_ONLY} <span className="text-red-500">{"*"}</span>
                </label>
                <input value={form.locationOrUser ?? ""} onChange={(e) => set("locationOrUser", e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 text-sm ${errors.locationOrUser ? "border-red-500" : "border-gray-200"}`} />
                {errors.locationOrUser && <p className="text-red-500 text-xs mt-1">{errors.locationOrUser}</p>}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_CONDITION_ONLY}</label>
              <div className="grid grid-cols-5 gap-3">
                {CONDITION_OPTIONS.map((item) => (
                  <label key={item.value} className="cursor-pointer">
                    <input type="radio" value={item.value} checked={form.condition === item.value}
                      onChange={() => set("condition", item.value)} className="peer hidden" />
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 bg-white text-gray-500 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary">
                      <span className="text-xs font-semibold">{item.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_NOTES}</label>
              <textarea rows={3} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-8 py-5 border-t bg-gray-50">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-white">{SYSTEM_MESSAGES.BTN_CANCEL}</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary/90 shadow flex items-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} {SYSTEM_MESSAGES.BTN_SAVE}
          </button>
        </div>
      </div>
    </div>
  );
}

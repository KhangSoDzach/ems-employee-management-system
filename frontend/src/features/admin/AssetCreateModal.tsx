import React, { useState, useEffect } from "react";
import { X, UploadCloud, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  assetService,
  AssetCreatePayload,
  AssetStatus,
  AssetCondition,
  EmployeeOption,
  ASSET_STATUS_LABELS,
  ASSET_CONDITION_LABELS,
} from "@/services/assetService";
import { SYSTEM_MESSAGES } from "@/constants/messages";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [employeeKeyword, setEmployeeKeyword] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);
  const [openEmployeeDropdown, setOpenEmployeeDropdown] = useState(false);

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
    setErrors({});
    setEmployeeKeyword("");
    setEmployeeOptions([]);
    setSelectedEmployee(null);
    setOpenEmployeeDropdown(false);
  }, [open]);

  useEffect(() => {
    if (!open || !openEmployeeDropdown) return;
    const timer = setTimeout(() => {
      setEmployeeLoading(true);
      assetService.searchEmployees(employeeKeyword)
        .then((res) => setEmployeeOptions(res.content))
        .catch(() => setEmployeeOptions([]))
        .finally(() => setEmployeeLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [open, openEmployeeDropdown, employeeKeyword]);

  if (!open) return null;

  const set = (field: keyof AssetCreatePayload, value: unknown) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!form.assetName.trim()) newErrors.assetName = SYSTEM_MESSAGES.ASSET_CREATE.MSG_REQUIRE_NAME;
    if (!form.assetType?.trim()) newErrors.assetType = SYSTEM_MESSAGES.ASSET_CREATE.MSG_REQUIRE_TYPE;
    if (!selectedEmployee || !form.location?.trim()) newErrors.location = SYSTEM_MESSAGES.ASSET_CREATE.MSG_REQUIRE_LOCATION;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(Object.values(newErrors)[0]);
      return;
    }

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
      toast.success(SYSTEM_MESSAGES.ASSET_CREATE.MSG_CREATE_SUCCESS);
      onCreated();
    } catch {
      toast.error(SYSTEM_MESSAGES.ASSET_CREATE.MSG_CREATE_ERROR);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-5 border-b flex-none">
          <h1 className="text-xl font-semibold text-gray-900">{SYSTEM_MESSAGES.ASSET_CREATE.TITLE_ADD}</h1>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8 min-h-0">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-1 space-y-6">
              {/* IMAGE UPLOAD */}
              <div className="bg-gray-50 rounded-xl border p-4">
                <label className="text-sm font-semibold text-gray-700 block mb-3">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_IMAGE}</label>
                <div className="w-full aspect-video bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative">
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="object-cover w-full h-full" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <UploadCloud className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs">{SYSTEM_MESSAGES.ASSET_CREATE.UPLOAD_IMAGE}</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <input placeholder={SYSTEM_MESSAGES.ASSET_CREATE.PLACEHOLDER_IMAGE_URL} value={form.imageUrl ?? ""}
                  onChange={(e) => set("imageUrl", e.target.value)}
                  className="mt-2 w-full border border-gray-200 rounded-md px-3 py-2 text-xs" />
              </div>

              {/* THÔNG TIN PHỤ */}
              <div className="bg-gray-50 rounded-xl border p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-800">{SYSTEM_MESSAGES.ASSET_CREATE.SECTION_ADDITIONAL}</h3>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_WARRANTY}</label>
                  <input type="date" value={form.warrantyUntil ?? ""}
                    onChange={(e) => set("warrantyUntil", e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_SUPPLIER}</label>
                  <input placeholder={SYSTEM_MESSAGES.ASSET_CREATE.PLACEHOLDER_SUPPLIER} value={form.supplierName ?? ""}
                    onChange={(e) => set("supplierName", e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_CONTRACT_NUM}</label>
                  <input placeholder={SYSTEM_MESSAGES.ASSET_CREATE.PLACEHOLDER_CONTRACT_NUM} value={form.contractNumber ?? ""}
                    onChange={(e) => set("contractNumber", e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_CONTRACT_UNTIL}</label>
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
                  <label className="text-sm font-medium text-gray-700">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_CODE}</label>
                  <input disabled value={nextCode}
                    className="w-full bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500" />
                  <p className="text-xs text-gray-400 italic">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_AUTO_CODE}</p>
                </div>

                {/* Tên tài sản */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    {/* eslint-disable-next-line react/jsx-no-literals */}
                    {SYSTEM_MESSAGES.ASSET_CREATE.LABEL_NAME} <span className="text-red-500">*</span>
                  </label>
                  <input placeholder={SYSTEM_MESSAGES.ASSET_CREATE.PLACEHOLDER_NAME} value={form.assetName}
                    onChange={(e) => set("assetName", e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary ${errors.assetName ? "border-red-500" : "border-gray-200"}`} />
                  {errors.assetName && <p className="text-red-500 text-xs mt-1">{errors.assetName}</p>}
                </div>

                {/* Loại */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    {/* eslint-disable-next-line react/jsx-no-literals */}
                    {SYSTEM_MESSAGES.ASSET_CREATE.LABEL_TYPE} <span className="text-red-500">*</span>
                  </label>
                  <input placeholder="VD: Laptop, Màn hình, Thẻ xe..." value={form.assetType ?? ""}
                    onChange={(e) => set("assetType", e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary ${errors.assetType ? "border-red-500" : "border-gray-200"}`} />
                  {errors.assetType && <p className="text-red-500 text-xs mt-1">{errors.assetType}</p>}
                </div>

                {/* Giá trị */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_VALUE}</label>
                  <input type="number" min={0} placeholder={SYSTEM_MESSAGES.ASSET_CREATE.PLACEHOLDER_VALUE}
                    value={form.assetValue ?? ""}
                    onChange={(e) => set("assetValue", e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
                </div>

                {/* Ngày mua */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_PURCHASE_DATE}</label>
                  <input type="date" value={form.purchaseDate ?? ""}
                    onChange={(e) => set("purchaseDate", e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
                </div>

                {/* Trạng thái */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_INITIAL_STATUS}</label>
                  <select value={form.initialStatus ?? "AVAILABLE"}
                    onChange={(e) => set("initialStatus", e.target.value as AssetStatus)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                    {INITIAL_STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Người sử dụng */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    {/* eslint-disable-next-line react/jsx-no-literals */}
                    {SYSTEM_MESSAGES.ASSET_CREATE.LABEL_USER_ONLY} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      placeholder={SYSTEM_MESSAGES.ASSET_CREATE.PLACEHOLDER_USER_SEARCH}
                      value={employeeKeyword}
                      onFocus={() => setOpenEmployeeDropdown(true)}
                      onChange={(e) => {
                        setEmployeeKeyword(e.target.value);
                        setSelectedEmployee(null);
                        set("location", "");
                        setOpenEmployeeDropdown(true);
                      }}
                      className={`w-full border rounded-md pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary ${errors.location ? "border-red-500" : "border-gray-200"}`}
                    />

                    {openEmployeeDropdown && (
                      <div className="absolute z-20 mt-2 w-full max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                        {employeeLoading ? (
                          <div className="px-3 py-3 text-sm text-gray-500 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {SYSTEM_MESSAGES.LOADING}
                          </div>
                        ) : employeeOptions.length === 0 ? (
                          <div className="px-3 py-3 text-sm text-gray-500">{SYSTEM_MESSAGES.NO_DATA}</div>
                        ) : (
                          employeeOptions.map((employee) => {
                            const fullName = `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim();
                            return (
                              <button
                                key={employee.id}
                                type="button"
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  set("location", fullName);
                                  setEmployeeKeyword(fullName);
                                  setOpenEmployeeDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                              >
                                <div className="font-medium text-gray-800">{fullName}</div>
                                <div className="text-xs text-gray-500">{employee.department ?? SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}</div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                  {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                </div>
              </div>

              {/* Tình trạng */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_CONDITION_ONLY}</label>
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
                <label className="text-sm font-medium text-gray-700">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_NOTES}</label>
                <textarea rows={3} placeholder={SYSTEM_MESSAGES.ASSET_CREATE.PLACEHOLDER_DESC}
                  value={form.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-8 py-5 border-t bg-gray-50 flex-none">
          <button onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-white">
            {SYSTEM_MESSAGES.BTN_CANCEL}
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary/90 shadow flex items-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {SYSTEM_MESSAGES.BTN_SAVE}
          </button>
        </div>
      </div>
    </div>
  );
}

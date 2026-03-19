import React, { useState, useEffect } from "react";
import { UploadCloud, Loader2, Search } from "lucide-react";
import {
  assetService,
  AssetCondition,
  AssetStatus,
  EmployeeOption,
  ASSET_STATUS_LABELS,
  ASSET_CONDITION_LABELS,
} from "@/services/assetService";
import { SYSTEM_MESSAGES } from "@/constants/messages";

export interface AssetFormData {
  name: string;
  type: string;
  value?: number;
  purchaseDate?: string;
  condition: AssetCondition;
  locationOrUser: string;
  warrantyDate?: string;
  supplier?: string;
  contractDate?: string;
  contractNumber?: string;
  note?: string;
  description?: string;
  image?: string;
  initialStatus?: AssetStatus;
}

interface Props {
  initialData?: Partial<AssetFormData>;
  isEdit?: boolean;
  onSubmit: (data: AssetFormData) => void;
  onCancel: () => void;
  loading: boolean;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const CONDITION_OPTIONS: { value: AssetCondition; label: string }[] = [
  { value: "NEW", label: ASSET_CONDITION_LABELS.NEW },
  { value: "GOOD", label: ASSET_CONDITION_LABELS.GOOD },
  { value: "DAMAGED", label: ASSET_CONDITION_LABELS.DAMAGED },
  { value: "LOST", label: ASSET_CONDITION_LABELS.LOST },
  { value: "DISPOSED", label: ASSET_CONDITION_LABELS.DISPOSED },
];

const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "AVAILABLE", label: ASSET_STATUS_LABELS.AVAILABLE },
  { value: "RETIRED", label: ASSET_STATUS_LABELS.RETIRED },
];

// --- Sub-components for lower complexity ---

const ImageUploadField = ({ 
  imagePreview, 
  imageUrl, 
  onImageChange, 
  onUrlChange 
}: { 
  imagePreview: string | null, 
  imageUrl: string, 
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  onUrlChange: (url: string) => void 
}) => (
  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
    <label className="form-label-secondary mb-3 block">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_IMAGE}</label>
    <div className="w-full aspect-video bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center overflow-hidden relative group">
      {imagePreview ? (
        <img src={imagePreview} alt="preview" className="object-cover w-full h-full" />
      ) : (
        <div className="text-center text-slate-400">
          <UploadCloud className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">{SYSTEM_MESSAGES.ASSET_CREATE.UPLOAD_IMAGE}</p>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors cursor-pointer" />
      <input type="file" accept="image/*" onChange={onImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
    </div>
    <input
      placeholder={SYSTEM_MESSAGES.ASSET_CREATE.PLACEHOLDER_IMAGE_URL}
      value={imageUrl || ""}
      onChange={(e) => onUrlChange(e.target.value)}
      className="form-input mt-3 text-xs" />
  </div>
);

const SectionHeader = ({ icon, title }: { icon: string, title: string }) => (
  <div className="section-header">
    <span className="material-symbols-outlined text-xl">{icon}</span>
    <h3 className="section-header-title">{title}</h3>
  </div>
);

const AdditionalInfoSection = ({ 
  form, 
  setField 
}: { 
  form: AssetFormData, 
  setField: <K extends keyof AssetFormData>(f: K, v: AssetFormData[K]) => void 
}) => (
  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-6">
    <SectionHeader icon="info" title={SYSTEM_MESSAGES.ASSET_CREATE.SECTION_ADDITIONAL} />
    <div className="form-group">
      <label className="form-label-secondary">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_WARRANTY}</label>
      <input type="date" value={form.warrantyDate || ""} onChange={(e) => setField("warrantyDate", e.target.value)} className="form-input" />
    </div>
    <div className="form-group">
      <label className="form-label-secondary">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_SUPPLIER}</label>
      <input placeholder={SYSTEM_MESSAGES.ASSET_CREATE.PLACEHOLDER_SUPPLIER} value={form.supplier || ""} onChange={(e) => setField("supplier", e.target.value)} className="form-input" />
    </div>
    <div className="form-group">
      <label className="form-label-secondary">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_CONTRACT_NUM}</label>
      <input placeholder={SYSTEM_MESSAGES.ASSET_CREATE.PLACEHOLDER_CONTRACT_NUM} value={form.contractNumber || ""} onChange={(e) => setField("contractNumber", e.target.value)} className="form-input" />
    </div>
    <div className="form-group">
      <label className="form-label-secondary">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_CONTRACT_UNTIL}</label>
      <input type="date" value={form.contractDate || ""} onChange={(e) => setField("contractDate", e.target.value)} className="form-input" />
    </div>
  </div>
);

const EmployeeDropdown = ({ 
  loading, 
  options, 
  onSelect 
}: { 
  loading: boolean, 
  options: EmployeeOption[], 
  onSelect: (emp: EmployeeOption) => void 
}) => (
  <div className="absolute z-60 mt-2 w-full max-h-56 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl animate-in fade-in zoom-in-95">
    {loading ? (
      <div className="px-3 py-3 text-sm text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-primary" /> {SYSTEM_MESSAGES.LOADING}
      </div>
    ) : options.length === 0 ? (
      <div className="px-3 py-3 text-sm text-slate-500 text-center">{SYSTEM_MESSAGES.NO_DATA}</div>
    ) : (
      options.map((employee) => {
        const fullName = `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim();
        return (
          <button key={employee.id} type="button" onClick={() => onSelect(employee)} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b last:border-0 border-slate-100 dark:border-slate-700">
            <div className="font-semibold text-slate-800 dark:text-slate-200">{fullName}</div>
            <div className="text-xs text-slate-500">{(employee.department ?? SYSTEM_MESSAGES.COMMON?.EMPTY_VALUE) || "—"}</div>
          </button>
        );
      })
    )}
  </div>
);

export const AssetForm: React.FC<Props> = ({
  initialData,
  isEdit,
  onSubmit,
  onCancel,
  loading,
  errors,
  setErrors,
}) => {
  const [form, setForm] = useState<AssetFormData>({
    name: "",
    type: "",
    condition: "NEW",
    locationOrUser: "",
    ...initialData,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(form.image || null);
  const [employeeKeyword, setEmployeeKeyword] = useState(form.locationOrUser || "");
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [openEmployeeDropdown, setOpenEmployeeDropdown] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm((f) => ({ ...f, ...initialData }));
      setImagePreview(initialData.image || null);
      setEmployeeKeyword(initialData.locationOrUser || "");
    }
  }, [initialData]);

  useEffect(() => {
    if (!openEmployeeDropdown) {
      return;
    }
    const timer = setTimeout(() => {
      setEmployeeLoading(true);
      assetService
        .searchEmployees(employeeKeyword)
        .then((res) => setEmployeeOptions(res.content))
        .catch(() => setEmployeeOptions([]))
        .finally(() => setEmployeeLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [openEmployeeDropdown, employeeKeyword]);

  const setField = <K extends keyof AssetFormData>(field: K, value: AssetFormData[K]) => {
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
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setField("image", url);
    }
  };

  return (
    <form className="modal-body space-y-8" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <ImageUploadField imagePreview={imagePreview} imageUrl={form.image || ""} onImageChange={handleImageUpload} onUrlChange={(v) => setField("image", v)} />
          <AdditionalInfoSection form={form} setField={setField} />
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-transparent rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <SectionHeader icon="description" title={SYSTEM_MESSAGES.ASSET_CREATE.SECTION_INFO} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label-required">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_NAME}</label>
                <input placeholder={SYSTEM_MESSAGES.ASSET_CREATE.PLACEHOLDER_NAME} value={form.name} onChange={(e) => setField("name", e.target.value)} className={`form-input ${errors.name ? "border-destructive ring-destructive/20" : ""}`} />
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="form-group">
                <label className="form-label-required">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_TYPE}</label>
                <input placeholder={SYSTEM_MESSAGES.ASSET_CREATE.PLACEHOLDER_NAME} value={form.type} onChange={(e) => setField("type", e.target.value)} className={`form-input ${errors.type ? "border-destructive ring-destructive/20" : ""}`} />
                {errors.type && <p className="text-destructive text-xs mt-1">{errors.type}</p>}
              </div>

              <div className="form-group">
                <label className="form-label-secondary">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_VALUE}</label>
                <input type="number" placeholder="0" value={form.value || ""} onChange={(e) => setField("value", e.target.value ? parseInt(e.target.value) : undefined)} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label-secondary">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_PURCHASE_DATE}</label>
                <input type="date" value={form.purchaseDate || ""} onChange={(e) => setField("purchaseDate", e.target.value)} className="form-input" />
              </div>

              {!isEdit && (
                <div className="form-group">
                  <label className="form-label-secondary">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_STATUS}</label>
                  <select value={form.initialStatus || "AVAILABLE"} onChange={(e) => setField("initialStatus", e.target.value as AssetStatus)} className="form-select">
                    {STATUS_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
              )}

              <div className={`form-group ${isEdit ? 'md:col-span-2' : ''}`}>
                <label className="form-label-required">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_USER_ONLY}</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    placeholder={SYSTEM_MESSAGES.ASSET_CREATE.PLACEHOLDER_USER_SEARCH}
                    value={employeeKeyword}
                    onFocus={() => setOpenEmployeeDropdown(true)}
                    onChange={(e) => {
                      setEmployeeKeyword(e.target.value);
                      setField("locationOrUser", e.target.value);
                    }}
                    className={`form-input pl-9 ${errors.locationOrUser ? "border-destructive ring-destructive/20" : ""}`}
                  />
                  {openEmployeeDropdown && (
                    <EmployeeDropdown loading={employeeLoading} options={employeeOptions} onSelect={(emp) => {
                      const name = `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim();
                      setField("locationOrUser", name);
                      setEmployeeKeyword(name);
                      setOpenEmployeeDropdown(false);
                    }} />
                  )}
                </div>
                {errors.locationOrUser && <p className="text-destructive text-xs mt-1">{errors.locationOrUser}</p>}
              </div>

              <div className="md:col-span-2 space-y-4 pt-2">
                <label className="form-label-secondary">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_CONDITION_ONLY}</label>
                <div className="grid grid-cols-5 gap-3">
                  {CONDITION_OPTIONS.map((item) => (
                    <label key={item.value} className="cursor-pointer group">
                      <input type="radio" name="condition" value={item.value} checked={form.condition === item.value} onChange={() => setField("condition", item.value)} className="peer hidden" />
                      <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary group-hover:border-primary/50 group-hover:bg-slate-50 dark:group-hover:bg-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 space-y-2 pt-2">
                <label className="form-label-secondary">{SYSTEM_MESSAGES.ASSET_CREATE.LABEL_DESC}</label>
                <textarea placeholder={SYSTEM_MESSAGES.ASSET_CREATE.PLACEHOLDER_DESC} value={form.description || ""} onChange={(e) => setField("description", e.target.value)} className="form-textarea min-h-[120px]" />
              </div>
            </div>
          </div>

          <div className="modal-footer -mx-6 -mb-6 mt-8">
            <button type="button" onClick={onCancel} className="btn-secondary">{SYSTEM_MESSAGES.BTN_CANCEL}</button>
            <button type="submit" disabled={loading} className="btn-action flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? SYSTEM_MESSAGES.BTN_SAVE : SYSTEM_MESSAGES.BTN_ADD}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

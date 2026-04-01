import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { assetService, AssetUpdatePayload } from "@/services/assetService";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations";
import { AssetForm, AssetFormData } from "./components/AssetForm";

interface Props {
  open: boolean;
  onClose: () => void;
  assetId: number | null;
  onUpdated: () => void;
}

export default function AssetEditModal({
  open,
  onClose,
  assetId,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState<Partial<AssetFormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assetCode, setAssetCode] = useState("");

  useEffect(() => {
    if (open && assetId) {
      setLoading(true);
      setErrors({});
      assetService
        .getAssetById(assetId)
        .then((res) => {
          setAssetCode(res.code);
          setInitialData({
            name: res.name,
            type: res.type || "",
            value: res.value ? parseInt(res.value) : undefined,
            purchaseDate: res.purchaseDate || "",
            condition: res.condition,
            locationOrUser: res.location || "",
            warrantyDate: res.warranty || "",
            supplier: res.supplier || "",
            contractDate: res.contract || "",
            description: res.description || "",
            image: res.imageUrl || "",
          });
        })
        .catch(() => toast.error(SYSTEM_MESSAGES.ERROR))
        .finally(() => setLoading(false));
    }
  }, [open, assetId]);

  if (!open) {
    return null;
  }

  const handleFormSubmit = async (formData: AssetFormData) => {
    if (!assetId) {
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = SYSTEM_MESSAGES.ASSET_CREATE.MSG_REQUIRE_NAME;
    }
    if (!formData.type.trim()) {
      newErrors.type = SYSTEM_MESSAGES.ASSET_CREATE.MSG_REQUIRE_TYPE;
    }
    if (!formData.locationOrUser.trim()) {
      newErrors.locationOrUser =
        SYSTEM_MESSAGES.ASSET_CREATE.MSG_REQUIRE_LOCATION;
    }
    if (formData.value !== undefined && formData.value < 0) {
      newErrors.value = SYSTEM_MESSAGES.ASSET_CREATE.MSG_ERROR_VALUE;
    }

    // Date validations
    const todayStr = new Date().toISOString().split("T")[0] || "";
    if (formData.purchaseDate && formData.purchaseDate > todayStr) {
      newErrors.purchaseDate =
        SYSTEM_MESSAGES.ASSET_CREATE.MSG_ERROR_PURCHASE_DATE;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(FORM_VALIDATION_MESSAGES.MISSING_CONTENT);
      return;
    }

    setSaving(true);
    try {
      const payload: AssetUpdatePayload = {
        name: formData.name,
        type: formData.type,
        value: formData.value,
        purchaseDate: formData.purchaseDate || undefined,
        condition: formData.condition,
        locationOrUser: formData.locationOrUser,
        description: formData.description,
        warrantyDate: formData.warrantyDate || undefined,
        supplier: formData.supplier,
        contractDate: formData.contractDate || undefined,
        contractNumber: formData.contractNumber,
        image: formData.image,
      };
      await assetService.updateAsset(assetId, payload);
      toast.success(SYSTEM_MESSAGES.SUCCESS_UPDATE);
      onUpdated();
      onClose();
    } catch {
      toast.error(SYSTEM_MESSAGES.ERROR);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="dialog-content-base">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {SYSTEM_MESSAGES.ASSET_CREATE.TITLE_EDIT}
            </h2>
            <p className="text-[10px] font-black text-primary mt-1 tracking-[0.2em] uppercase font-mono">
              {"#"}
              {assetCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors group"
          >
            <X className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="font-medium">{SYSTEM_MESSAGES.LOADING}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <AssetForm
              initialData={initialData}
              isEdit={true}
              onSubmit={handleFormSubmit}
              onCancel={onClose}
              loading={saving}
              errors={errors}
              setErrors={setErrors}
            />
          </div>
        )}
      </div>
    </div>
  );
}

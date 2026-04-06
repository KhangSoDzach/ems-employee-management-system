import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { assetService, AssetCreatePayload } from "@/services/assetService";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { AssetForm, AssetFormData } from "./components/AssetForm";
import { assetSchema } from "./schemas/asset.schema";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function AssetCreateModal({ open, onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [nextCode, setNextCode] = useState("—");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      assetService
        .getNextCode()
        .then(setNextCode)
        .catch(() => setNextCode("—"));
      setErrors({});
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleFormSubmit = async (formData: AssetFormData) => {
    const parseResult = assetSchema.safeParse(formData);
    if (!parseResult.success) {
      const newErrors: Record<string, string> = {};
      parseResult.error.issues.forEach((err) => {
        const path = err.path[0] as string;
        if (!newErrors[path]) {
          newErrors[path] = err.message;
        }
      });
      setErrors(newErrors);
      const firstError = parseResult.error.issues[0]?.message;
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    setSaving(true);
    try {
      const payload: AssetCreatePayload = {
        assetName: formData.name,
        assetType: formData.type,
        assetValue: formData.value,
        purchaseDate: formData.purchaseDate || undefined,
        initialStatus: formData.initialStatus,
        condition: formData.condition,
        location: formData.locationOrUser || undefined,
        notes: formData.note || undefined,
        description: formData.description || undefined,
        warrantyUntil: formData.warrantyDate || undefined,
        supplierName: formData.supplier || undefined,
        contractUntil: formData.contractDate || undefined,
        contractNumber: formData.contractNumber || undefined,
        imageUrl: formData.image || undefined,
      };
      await assetService.createAsset(payload);
      toast.success(SYSTEM_MESSAGES.ASSET_CREATE.MSG_CREATE_SUCCESS);
      onCreated();
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
              {SYSTEM_MESSAGES.ASSET_CREATE.TITLE_ADD}
            </h2>
            <p className="text-[10px] font-black text-primary mt-1 tracking-[0.2em] uppercase font-mono">
              {SYSTEM_MESSAGES.SYMBOLS.HASH}
              {nextCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors group"
          >
            <X className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <AssetForm
            onSubmit={handleFormSubmit}
            onCancel={onClose}
            loading={saving}
            errors={errors}
            setErrors={setErrors}
          />
        </div>
      </div>
    </div>
  );
}

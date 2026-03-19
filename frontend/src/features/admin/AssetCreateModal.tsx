import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  assetService,
  AssetCreatePayload,
} from "@/services/assetService";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations";
import { AssetForm, AssetFormData } from "./components/AssetForm";

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
      assetService.getNextCode().then(setNextCode).catch(() => setNextCode("—"));
      setErrors({});
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleFormSubmit = async (formData: AssetFormData) => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = SYSTEM_MESSAGES.ASSET_CREATE.MSG_REQUIRE_NAME;
    }
    if (!formData.type.trim()) {
      newErrors.type = SYSTEM_MESSAGES.ASSET_CREATE.MSG_REQUIRE_TYPE;
    }
    if (!formData.locationOrUser.trim()) {
      newErrors.locationOrUser = SYSTEM_MESSAGES.ASSET_CREATE.MSG_REQUIRE_LOCATION;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(FORM_VALIDATION_MESSAGES.MISSING_CONTENT);
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
        location: formData.locationOrUser,
        notes: formData.note,
        description: formData.description,
        warrantyUntil: formData.warrantyDate || undefined,
        supplierName: formData.supplier,
        contractUntil: formData.contractDate || undefined,
        contractNumber: formData.contractNumber,
        imageUrl: formData.image,
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
          <h2 className="modal-title">
            {SYSTEM_MESSAGES.ASSET_CREATE.TITLE_ADD} 
            <span className="text-primary ml-2 font-mono">{"#"}{nextCode}</span>
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
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

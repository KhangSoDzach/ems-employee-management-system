import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { assetService, AssetUpdatePayload } from "@/services/assetService";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { AssetForm, AssetFormData } from "./components/AssetForm";
import { assetSchema } from "./schemas/asset.schema";

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
            initialStatus: res.status,
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
      // Highlight first error
      const firstError = parseResult.error.issues[0]?.message;
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    setSaving(true);
    try {
      const payload: AssetUpdatePayload = {
        assetName: formData.name,
        assetType: formData.type,
        assetValue: formData.value,
        purchaseDate: formData.purchaseDate || undefined,
        condition: formData.condition,
        location: formData.locationOrUser || undefined,
        description: formData.description || undefined,
        warrantyUntil: formData.warrantyDate || undefined,
        supplierName: formData.supplier || undefined,
        contractUntil: formData.contractDate || undefined,
        contractNumber: formData.contractNumber || undefined,
        imageUrl: formData.image || undefined,
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
              {SYSTEM_MESSAGES.SYMBOLS.HASH}
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

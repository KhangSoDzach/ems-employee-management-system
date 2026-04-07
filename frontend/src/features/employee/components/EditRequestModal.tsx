import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type AdjustmentRequest } from "@/constants/adjustment-request";
import { type AdjustmentFormValues } from "@/features/employee/schemas/adjustment.schema";
import { EDIT_REQUEST_TEXT as TEXT } from "@/constants/ui-texts";
import { AdjustmentForm } from "./AdjustmentForm";

interface EditRequestModalProps {
  request: AdjustmentRequest | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: AdjustmentFormValues) => Promise<void>;
}

export const EditRequestModal = ({
  request,
  open,
  onClose,
  onSubmit,
}: EditRequestModalProps) => {
  const [submitting, setSubmitting] = useState(false);

  if (!request) {
    return null;
  }

  const handleFormSubmit = async (data: AdjustmentFormValues) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(request.id, data);
      onClose();
    } catch {
      // Error toast is handled by parent callback; keep modal open for correction.
    } finally {
      setSubmitting(false);
    }
  };

  const defaultValues: Partial<AdjustmentFormValues> = {
    adjustmentDate: request.adjustmentDate,
    type: request.type,
    timeIn: request.proposedTimeIn || "",
    timeOut: request.proposedTimeOut || "",
    reason: request.reason,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 rounded-2xl overflow-hidden border border-border shadow-2xl bg-background">
        <DialogHeader className="p-8 bg-muted/30 border-b border-border">
          <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">
            {TEXT.TITLE}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2 font-medium">
            {TEXT.DESCRIPTION}
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 bg-card max-h-[70vh] overflow-y-auto custom-scrollbar">
          <AdjustmentForm
            defaultValues={defaultValues}
            onSubmit={handleFormSubmit}
            onCancel={onClose}
            loading={submitting}
            text={TEXT}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

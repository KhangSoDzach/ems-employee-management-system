import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type AdjustmentFormValues } from "@/features/employee/schemas/adjustment.schema";
import { CREATE_REQUEST_TEXT as TEXT } from "@/constants/ui-texts";
import { AdjustmentForm } from "./AdjustmentForm";

interface CreateRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AdjustmentFormValues) => Promise<void>;
}

export const CreateRequestModal = ({
  open,
  onClose,
  onSubmit,
}: CreateRequestModalProps) => {
  const [submitting, setSubmitting] = useState(false);

  const handleFormSubmit = async (data: AdjustmentFormValues) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(data);
      onClose();
    } catch {
      // Error toast is handled by parent callback; keep modal open for correction.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 rounded-2xl overflow-hidden border border-border bg-background shadow-2xl">
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

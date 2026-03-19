import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  type AdjustmentFormValues, 
  type AdjustmentRequest 
} from "../adjustment-request.constants";
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
  if (!request) {return null;}

  const handleFormSubmit = async (data: AdjustmentFormValues) => {
    await onSubmit(request.id, data);
    onClose();
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
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 rounded-2xl overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
          <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight">
            {TEXT.TITLE}
          </DialogTitle>
          <DialogDescription className="text-slate-500 mt-2 font-medium">
            {TEXT.DESCRIPTION}
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
          <AdjustmentForm 
            defaultValues={defaultValues}
            onSubmit={handleFormSubmit}
            onCancel={onClose}
            text={TEXT}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

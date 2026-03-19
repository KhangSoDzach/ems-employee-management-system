import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type AdjustmentFormValues } from "../adjustment-request.constants";
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
  const handleFormSubmit = async (data: AdjustmentFormValues) => {
    await onSubmit(data);
    onClose();
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
            onSubmit={handleFormSubmit}
            onCancel={onClose}
            text={TEXT}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { Check, Loader2, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SYSTEM_MESSAGES } from "@/constants/messages";

interface ReviewSheetFooterProps {
  onApprove: () => void;
  onReject: () => void;
  onReturn?: () => void;
  processing: "approve" | "reject" | "return" | boolean | null;
  isPending: boolean;
  labels?: {
    approve?: string;
    reject?: string;
    return?: string;
  };
  actionDisabled?: boolean;
}

export function ReviewSheetFooter({
  onApprove,
  onReject,
  onReturn,
  processing,
  isPending,
  labels,
  actionDisabled,
}: ReviewSheetFooterProps) {
  const isWorking = !!processing;

  return (
    <div className="p-4 border-t bg-muted/20 flex gap-2">
      {isPending && (
        <>
          {onReturn && (
            <Button
              variant="secondary"
              className="btn-request-more flex-1"
              onClick={onReturn}
              disabled={isWorking || actionDisabled}
            >
              {processing === "return" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Reply className="mr-2 h-4 w-4" />
              )}
              {labels?.return || SYSTEM_MESSAGES.APPROVE.BTN_REQUEST_MORE}
            </Button>
          )}
          <Button
            variant="secondary"
            className="btn-reject flex-1"
            onClick={onReject}
            disabled={isWorking || actionDisabled}
          >
            {processing === "reject" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Reply className="mr-2 h-4 w-4" />
            )}
            {labels?.reject || SYSTEM_MESSAGES.APPROVE.BTN_REJECT}
          </Button>
          <Button
            className="btn-approve flex-1"
            onClick={onApprove}
            disabled={isWorking || actionDisabled}
          >
            {processing === "approve" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {labels?.approve || SYSTEM_MESSAGES.APPROVE.BTN_APPROVE}
          </Button>
        </>
      )}
    </div>
  );
}

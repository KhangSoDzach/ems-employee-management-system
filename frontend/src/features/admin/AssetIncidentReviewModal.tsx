import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import type { IncidentItem } from "./AssetIncidentManagementPage";
import {
  ReviewSheetHeader,
  ReviewSheetProfile,
  ReviewSheetFeedback,
  ReviewSheetFooter,
} from "@/components/review-sheet";
import { useAuth } from "@/contexts/AuthContext";

interface AssetIncidentReviewModalProps {
  open: boolean;
  onClose: () => void;
  incident: IncidentItem | null;
  onUpdate: (id: string, status: string, note?: string) => Promise<void>;
}

export default function AssetIncidentReviewModal({
  open,
  onClose,
  incident,
  onUpdate,
}: Readonly<AssetIncidentReviewModalProps>) {
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState<"approve" | "reject" | null>(
    null,
  );
  const { user } = useAuth();

  if (!incident) {
    return null;
  }

  const handleAction = async (action: "approve" | "reject") => {
    setProcessing(action);
    try {
      const status = action === "approve" ? "Resolved" : "Rejected";
      await onUpdate(incident.id, status, note || undefined);
      setNote("");
      onClose();
    } finally {
      setProcessing(null);
    }
  };

  const isPending = incident.status === "PENDING";

  const getStatusColor = () => {
    switch (incident.status) {
      case "Resolved":
        return "badge-success";
      case "Rejected":
        return "badge-error";
      case "PENDING":
        return "badge-warning";
      default:
        return "badge-gray";
    }
  };

  const getStatusLabel = () => {
    switch (incident.status) {
      case "Resolved":
        return SYSTEM_MESSAGES.STATUS.APPROVED;
      case "Rejected":
        return SYSTEM_MESSAGES.STATUS.REJECTED;
      case "PENDING":
        return SYSTEM_MESSAGES.STATUS.PENDING;
      default:
        return incident.status;
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg p-0 bg-slate-50 rounded-l-2xl flex flex-col border-l shadow-2xl overflow-hidden"
      >
        <ReviewSheetHeader
          title={SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.TITLE}
          subtitle={incident.dateReported}
          id={incident.id}
          statusLabel={getStatusLabel()}
          statusColor={getStatusColor()}
        />

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <ReviewSheetProfile
            name={incident.employeeName}
            dept={incident.employeeDept}
            avatar={incident.employeeAvatar}
            isUrgent={isPending}
          />

          {/* Incident Info */}
          <section className="space-y-4 text-sm">
            <h4 className="section-title-muted uppercase tracking-wider">
              {SYSTEM_MESSAGES.ASSET_REPORT.SECTION_ASSET_INFO}
            </h4>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-slate-100 border-b">
                <div className="p-4 bg-muted/5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-1">
                    {SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.LABEL_ASSET_NAME}
                  </p>
                  <p className="font-bold text-slate-900">
                    {incident.assetName}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-1">
                    {SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.LABEL_ASSET_ID}
                  </p>
                  <p className="font-bold text-slate-900">{incident.assetId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-slate-100 italic">
                <div className="p-4">
                  <p className="text-[10px] text-slate-400 font-normal uppercase tracking-tight mb-1">
                    {SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.LABEL_INCIDENT_TYPE}
                  </p>
                  <p className="font-semibold text-slate-700">
                    {incident.incidentType}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-[10px] text-slate-400 font-normal uppercase tracking-tight mb-1">
                    {SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.LABEL_DATE}
                  </p>
                  <p className="font-semibold text-slate-700">
                    {incident.dateReported}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {isPending && incident.requesterUserId === user?.id ? (
            <div className="bg-amber-50 text-amber-600 border border-amber-200 p-3 rounded-md text-sm text-center">
              {SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.MSG_SELF_RESOLVE_ERROR}
            </div>
          ) : (
            isPending && <ReviewSheetFeedback value={note} onChange={setNote} />
          )}
        </div>

        <ReviewSheetFooter
          onApprove={() => handleAction("approve")}
          onReject={() => handleAction("reject")}
          isPending={isPending}
          processing={processing}
          actionDisabled={incident.requesterUserId === user?.id}
          labels={{
            approve: SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.BTN_APPROVE,
            reject: SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.BTN_REJECT,
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

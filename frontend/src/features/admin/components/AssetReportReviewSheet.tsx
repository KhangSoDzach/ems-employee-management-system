import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Eye, FileText, Package } from "lucide-react";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import {
  ReviewSheetHeader,
  ReviewSheetProfile,
  ReviewSheetFeedback,
  ReviewSheetFooter,
} from "@/components/review-sheet";
import {
  IncidentReportDetail,
  ASSET_STATUS_LABELS,
  AssetStatus,
  ASSET_CONDITION_LABELS,
  AssetCondition,
} from "@/services/assetService";
import { useAuth } from "@/contexts/AuthContext";

interface AssetReportReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: IncidentReportDetail | null;
  onApprove: (id: number, reason: string) => Promise<void>;
  onReject: (id: number, reason: string) => Promise<void>;
}

export function AssetReportReviewSheet({
  open,
  onOpenChange,
  report,
  onApprove,
  onReject,
}: AssetReportReviewSheetProps) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(
    null,
  );
  const { user } = useAuth();

  const isOwnPendingReport =
    report?.status === "PENDING" && report?.requesterUserId === user?.id;

  const handleAction = async (action: "approve" | "reject") => {
    if (!report) {
      return;
    }
    const handler = action === "approve" ? onApprove : onReject;
    setSubmitting(action);
    try {
      await handler(report.id, note);
      setNote("");
      onOpenChange(false);
    } catch {
      // Error handling is managed by the parent component (toast)
    } finally {
      setSubmitting(null);
    }
  };

  const getStatusColor = (color: string) => {
    if (color.includes("emerald") || color.includes("green")) {
      return "badge-success";
    }
    if (color.includes("rose") || color.includes("red")) {
      return "badge-error";
    }
    if (color.includes("amber") || color.includes("yellow")) {
      return "badge-warning";
    }
    return "badge-gray";
  };

  const getReportStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return SYSTEM_MESSAGES.ASSET_REPORT.STATS.PENDING;
      case "APPROVED":
        return SYSTEM_MESSAGES.ASSET_REPORT.STATS.APPROVED;
      case "REJECTED":
        return SYSTEM_MESSAGES.ASSET_REPORT.STATS.REJECTED;
      default:
        return status;
    }
  };

  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case "DAMAGED":
        return SYSTEM_MESSAGES.ASSET_REPORT.TXT_DAMAGED;
      case "LOST":
        return SYSTEM_MESSAGES.ASSET_REPORT.TXT_LOST;
      default:
        return type;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg p-0 bg-slate-50 rounded-l-2xl flex flex-col border-l shadow-2xl overflow-hidden"
      >
        {report && (
          <ReviewSheetHeader
            title={SYSTEM_MESSAGES.ASSET_REPORT.DETAIL_TITLE}
            subtitle={report.reportedAt}
            id={report.reportId}
            statusLabel={getReportStatusLabel(report.status)}
            statusColor={getStatusColor(report.statusColor)}
          />
        )}

        {report ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="flex flex-col gap-8 text-sm">
              <ReviewSheetProfile
                name={report.reportedBy}
                id={report.id.toString()}
                isUrgent={report.status === "PENDING"}
              />

              {/* Asset Info */}
              <section className="space-y-4">
                <h4 className="section-title-muted">
                  {SYSTEM_MESSAGES.ASSET_REPORT.SECTION_ASSET_INFO}
                </h4>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_ASSET_NAME}
                      </p>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                        {report.asset}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_ASSET_STATUS}
                      </p>
                      <p className="text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-lg border border-blue-100/50 dark:border-blue-800/50 tracking-tighter">
                        {ASSET_STATUS_LABELS[
                          report.assetStatus as AssetStatus
                        ] || report.assetStatus}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800/50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_ASSET_CODE}
                      </p>
                      <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300 tracking-tighter">
                        {report.assetCode}
                      </p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold text-[10px] tracking-widest px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      {report.assetTag}
                    </div>
                  </div>

                  {(report.status === "PENDING" ||
                    report.status === "APPROVED") && (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_CURRENT_CONDITION}
                        </p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {ASSET_CONDITION_LABELS[
                            report.assetCondition as AssetCondition
                          ] || report.assetCondition}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                          {report.status === "PENDING"
                            ? SYSTEM_MESSAGES.ASSET_REPORT.LABEL_TARGET_UPDATE
                            : SYSTEM_MESSAGES.ASSET_REPORT.LABEL_UPDATED_TO}
                        </p>
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                          {getIssueTypeLabel(report.incidentType)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Report Content */}
              <section className="space-y-4">
                <h4 className="section-title-muted">
                  {SYSTEM_MESSAGES.ASSET_REPORT.SECTION_REPORT_CONTENT}
                </h4>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-all">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_ISSUE_TYPE}
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {getIssueTypeLabel(report.incidentType)}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl italic text-[13px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed border border-slate-100 dark:border-slate-800/50">
                    <p className="relative z-10">
                      {SYSTEM_MESSAGES.SYMBOLS.QUOTE}
                      {report.description}
                      {SYSTEM_MESSAGES.SYMBOLS.QUOTE}
                    </p>
                  </div>
                </div>
              </section>

              {/* Evidence */}
              <section className="space-y-4">
                <h4 className="section-title-muted">
                  {SYSTEM_MESSAGES.ASSET_REPORT.SECTION_EVIDENCE}
                </h4>
                {report.attachmentUrl ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm cursor-zoom-in bg-white dark:bg-slate-900 transition-all hover:shadow-md">
                    <img
                      src={report.attachmentUrl}
                      alt="Evidence"
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <div className="bg-white/20 backdrop-blur-md rounded-full p-3 border border-white/30">
                        <Eye className="text-white w-6 h-6 shadow-sm" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 transition-colors">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest text-center px-4">
                      {SYSTEM_MESSAGES.ASSET_REPORT.TXT_NO_ATTACHMENT}
                    </p>
                  </div>
                )}
              </section>

              {/* Process Info */}
              {report.status !== "PENDING" && (
                <section className="space-y-4">
                  <h4 className="section-title-muted">
                    {SYSTEM_MESSAGES.ASSET_REPORT.SECTION_PROCESS_INFO}
                  </h4>
                  <div className="bg-slate-900 dark:bg-black p-6 rounded-2xl space-y-4 shadow-xl border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

                    <div className="flex items-center justify-between relative z-10">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_PROCESSOR}
                        </p>
                        <p className="text-sm font-bold text-slate-100 tracking-tight">
                          {report.processedBy}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_PROCESS_TIME}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-400">
                          {report.processedAt}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 relative z-10">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_PROCESS_NOTE}
                      </p>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5 shadow-inner">
                        <p className="text-[12px] font-medium text-slate-300 italic leading-relaxed">
                          {SYSTEM_MESSAGES.SYMBOLS.QUOTE}
                          {report.processNote ||
                            SYSTEM_MESSAGES.ASSET_REPORT.TXT_NO_NOTE}
                          {SYSTEM_MESSAGES.SYMBOLS.QUOTE}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {isOwnPendingReport && (
                <div className="bg-amber-50 text-amber-600 border border-amber-200 p-3 rounded-md text-sm text-center">
                  {SYSTEM_MESSAGES.ASSET_REPORT.MSG_SELF_REVIEW_ERROR}
                </div>
              )}

              {report.status === "PENDING" && !isOwnPendingReport && (
                <ReviewSheetFeedback value={note} onChange={setNote} />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground p-12 text-center space-y-4 flex-col">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <Package className="text-slate-300 h-8 w-8" />
            </div>
            <p className="text-sm font-medium">
              {SYSTEM_MESSAGES.STATUS.UNKNOWN}
            </p>
          </div>
        )}

        {report && !isOwnPendingReport && (
          <ReviewSheetFooter
            onApprove={() => handleAction("approve")}
            onReject={() => handleAction("reject")}
            isPending={report.status === "PENDING"}
            processing={submitting}
            labels={{
              approve: SYSTEM_MESSAGES.ASSET_REPORT.BTN_APPROVE,
              reject: SYSTEM_MESSAGES.ASSET_REPORT.BTN_REJECT,
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

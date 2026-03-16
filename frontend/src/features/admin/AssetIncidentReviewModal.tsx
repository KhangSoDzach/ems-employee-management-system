import { X, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import type { IncidentItem } from "./AssetIncidentManagementPage";

interface AssetIncidentReviewModalProps {
    open:      boolean;
    onClose:   () => void;
    incident:  IncidentItem | null;
    onUpdate:  (id: string, status: string, note?: string) => Promise<void>;
}

export default function AssetIncidentReviewModal({open, onClose, incident, onUpdate,
}: Readonly<AssetIncidentReviewModalProps>) {
    const [note,       setNote]       = useState("");
    const [processing, setProcessing] = useState(false);

    if (!open || !incident) return null;

    const handleApprove = async () => {
        setProcessing(true);
        try {
            await onUpdate(incident.id, "Resolved", note || undefined);
            setNote("");
            onClose();
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        setProcessing(true);
        try {
            await onUpdate(incident.id, "Rejected", note || undefined);
            setNote("");
            onClose();
        } finally {
            setProcessing(false);
        }
    };

    const isPending = incident.status === "PENDING";

    return (
        <div className="modal-overlay">
            <div className="modal-content sm:max-w-[500px]">
                <div className="modal-header">
                    <h2 className="modal-title">{SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.TITLE}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="modal-body space-y-6">
                    {/* Employee info */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                            {incident.employeeAvatar}
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900">{incident.employeeName}</div>
                            {incident.employeeDept && (
                                <div className="text-sm text-gray-500">{incident.employeeDept}</div>
                            )}
                        </div>
                    </div>

                    {/* Incident details */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                            <div className="form-label-secondary">{SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.LABEL_ASSET_NAME}</div>
                            <div className="font-medium mt-1">{incident.assetName}</div>
                        </div>
                        <div>
                            <div className="form-label-secondary">{SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.LABEL_ASSET_ID}</div>
                            <div className="font-medium mt-1">{incident.assetId}</div>
                        </div>
                        <div>
                            <div className="form-label-secondary">{SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.LABEL_INCIDENT_TYPE}</div>
                            <div className="font-medium mt-1">{incident.incidentType}</div>
                        </div>
                        <div>
                            <div className="form-label-secondary">{SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.LABEL_DATE}</div>
                            <div className="font-medium mt-1">{incident.dateReported}</div>
                        </div>
                    </div>

                    {/* Process note — shown for PENDING only */}
                    {isPending && (
                        <div className="pt-4 border-t space-y-2">
                            <label className="form-label-bold block text-sm text-gray-700">
                                {SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.LABEL_UPDATE_COND}
                            </label>
                            <textarea
                                className="form-input w-full resize-none h-24 text-sm"
                                placeholder="Nhập ghi chú xử lý (không bắt buộc)..."
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                disabled={processing}
                            />
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} disabled={processing} className="btn-secondary">
                        {SYSTEM_MESSAGES.BTN_CANCEL}
                    </button>
                    {isPending && (
                        <>
                            <button
                                onClick={handleReject}
                                disabled={processing}
                                className="btn-action bg-red-500 hover:bg-red-600 flex items-center gap-2 disabled:opacity-60"
                            >
                                <XCircle size={16} />
                                {SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.BTN_REJECT}
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={processing}
                                className="btn-action bg-green-600 hover:bg-green-700 flex items-center gap-2 disabled:opacity-60"
                            >
                                <CheckCircle size={16} />
                                {SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.BTN_APPROVE}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

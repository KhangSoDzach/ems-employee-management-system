import { X, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import type { IncidentItem } from "./AssetIncidentManagementPage";

interface AssetIncidentReviewModalProps {
    open: boolean;
    onClose: () => void;
    incident: IncidentItem | null;
    onUpdate: (id: string, status: string, condition?: string) => void;
}

export default function AssetIncidentReviewModal({ open, onClose, incident, onUpdate }: AssetIncidentReviewModalProps) {
    const [condition, setCondition] = useState("");

    if (!open || !incident) return null;

    const handleApprove = () => {
        if (!condition) {
            toast.error("Vui lòng chọn tình trạng tài sản sau sự cố");
            return;
        }
        onUpdate(incident.id, "Resolved", condition);
        toast.success("Incident approved and condition updated!");
        onClose();
    };

    const handleReject = () => {
        onUpdate(incident.id, "Rejected");
        toast.success("Incident rejected.");
        onClose();
    };

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
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                                {incident.employeeAvatar}
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900">{incident.employeeName}</div>
                                <div className="text-sm text-gray-500">{incident.employeeDept}</div>
                            </div>
                        </div>

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
                                <div className="font-medium mt-1 flex items-center gap-2">
                                    {incident.incidentIcon} {incident.incidentType}
                                </div>
                            </div>
                            <div>
                                <div className="form-label-secondary">{SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.LABEL_DATE}</div>
                                <div className="font-medium mt-1">{incident.dateReported}</div>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="form-label-secondary mb-2">{SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.LABEL_DESC}</div>
                            <p className="text-sm text-gray-700 bg-slate-50 p-3 rounded-md border border-slate-100">
                                {/* MOCK DESCRIPTION */}
                                {incident.incidentType === "Liquid Damage" ? "The device was accidentally dropped causing the screen to shatter and liquid spilled over the keyboard." : "Device issues reported."}
                            </p>
                        </div>

                        {incident.status === "Pending" && (
                            <div className="pt-4 border-t space-y-4">
                                <div>
                                    <label className="form-label-bold block mb-2 text-sm text-gray-700">{SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.LABEL_UPDATE_COND}</label>
                                    <select
                                        className="form-select w-full"
                                        value={condition}
                                        onChange={(e) => setCondition(e.target.value)}
                                    >
                                        <option value="">{SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.PLACEHOLDER_COND}</option>
                                        <option value="GOOD">{SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.COND_GOOD}</option>
                                        <option value="FAIR">{SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.COND_FAIR}</option>
                                        <option value="NEED_REPAIR">{SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.COND_NEEDS_REPAIR}</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">
                        {SYSTEM_MESSAGES.BTN_CANCEL}
                    </button>
                    {incident.status === "Pending" && (
                        <>
                            <button onClick={handleReject} className="btn-action bg-red-500 hover:bg-red-600 flex items-center gap-2">
                                <XCircle size={16} /> {SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.BTN_REJECT}
                            </button>
                            <button onClick={handleApprove} className="btn-action bg-green-600 hover:bg-green-700 flex items-center gap-2">
                                <CheckCircle size={16} /> {SYSTEM_MESSAGES.ASSET_INCIDENT_MODAL.BTN_APPROVE}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

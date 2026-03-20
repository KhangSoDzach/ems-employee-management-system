import { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { MoreVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { INCIDENT_STATUS_OPTIONS } from "@/constants/options";
import AssetIncidentReviewModal from "./AssetIncidentReviewModal";
import { assetService, AdminIncidentListItem } from "@/services/assetService";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { useAuth } from "@/contexts/AuthContext";
import { AUTH_ROLES } from "@/constants/auth";
export interface IncidentItem {
    id: string;
    numericId: number;
    employeeName: string;
    employeeDept: string;
    employeeAvatar: string;
    assetName: string;
    assetId: string;
    incidentType: string;
    dateReported: string;
    status: string;
    statusClass: string;
}

function mapToIncidentItem(r: AdminIncidentListItem): IncidentItem {
    const initials = r.employeeName
        .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const statusClass =
        r.status === "APPROVED" ? "bg-green-100 text-green-700"  :
        r.status === "REJECTED" ? "bg-red-100 text-red-700"      :
                                  "bg-yellow-100 text-yellow-700";
    return {
        id:             String(r.id),
        numericId:      r.id,
        employeeName:   r.employeeName,
        employeeDept:   "",
        employeeAvatar: initials,
        assetName:      r.asset,
        assetId:        r.reportId,
        incidentType:   r.issueTypeLabel,
        dateReported:   r.reportedAt,
        status:         r.status,
        statusClass,
    };
}

export default function AssetIncidentManagementPage() {
    const [search,           setSearch]           = useState("");
    const [statusFilter,     setStatusFilter]     = useState("All");
    const [incidents,        setIncidents]        = useState<IncidentItem[]>([]);
    const [loading,          setLoading]          = useState(true);
    const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
    const { user }      = useAuth();
    const effectiveRole = useEffectiveRole();

    const isManager  = effectiveRole === "manager"  || user?.roles.includes(AUTH_ROLES.MANAGER);
    const isEmployee = effectiveRole === "employee" ||
        (user?.roles.includes(AUTH_ROLES.EMPLOYEE) &&
         !user?.roles.includes(AUTH_ROLES.ADMIN) &&
         !user?.roles.includes(AUTH_ROLES.HR) &&
         !user?.roles.includes(AUTH_ROLES.MANAGER));
    const canProcess = !isManager && !isEmployee;

    const fetchIncidents = useCallback(async () => {
        setLoading(true);
        try {
            const page = await assetService.getAllReports({
                keyword: search || undefined,
                status:  statusFilter === "All" ? undefined : statusFilter.toUpperCase(),
                page: 0,
                size: 100,
            });
            setIncidents(page.content.map(mapToIncidentItem));
        } catch {
            toast.error(SYSTEM_MESSAGES.ASSET_REPORT.MSG_FETCH_LIST_ERROR);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

    const filteredIncidents = incidents.filter(incident => {
        const matchesSearch =
            incident.employeeName.toLowerCase().includes(search.toLowerCase()) ||
            incident.assetName.toLowerCase().includes(search.toLowerCase())    ||
            incident.assetId.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
            statusFilter === "All" || incident.status === statusFilter.toUpperCase();
        if (isEmployee) {
            const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
            if (incident.employeeName !== fullName) {
                return false;
            }
        }
        return matchesSearch && matchesStatus;
    });

    const handleUpdate = async (id: string, newStatus: string, note?: string) => {
        const item = incidents.find(i => i.id === id);
        if (!item) {
            return;
        }
        try {
            if (newStatus === "Resolved" || newStatus === "APPROVED") {
                await assetService.approveReport(item.numericId, note);
                toast.success(SYSTEM_MESSAGES.ASSET_REPORT.MSG_APPROVE_SUCCESS);
            } else {
                await assetService.rejectReport(item.numericId, note);
                toast.success(SYSTEM_MESSAGES.ASSET_REPORT.MSG_REJECT_SUCCESS);
            }
            fetchIncidents();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message;
            toast.error(msg || SYSTEM_MESSAGES.ASSET_REPORT.MSG_TRY_AGAIN);
        }
    };

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" role={effectiveRole} />

            <SidebarInset>
                <SiteHeader />

                <main className="page-layout-main">
                    {/* HEADER */}
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">{SYSTEM_MESSAGES.ASSET_INCIDENT.TITLE}</h1>
                            <p className="page-subtitle text-sm mt-1">{SYSTEM_MESSAGES.ASSET_INCIDENT.SUBTITLE}</p>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="data-table-container mt-4">
                        <div className="flex items-center justify-between p-4 border-b">
                            <input
                                placeholder={SYSTEM_MESSAGES.ASSET_INCIDENT.SEARCH_PLACEHOLDER}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="search-input w-80"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">{SYSTEM_MESSAGES.ASSET_INCIDENT.LABEL_STATUS}</span>
                                <select
                                    className="form-select w-36 py-1.5"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    {INCIDENT_STATUS_OPTIONS.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <table className="data-table">
                            <thead className="data-table-header">
                                <tr>
                                    <th className="data-table-header-cell">{SYSTEM_MESSAGES.ASSET_INCIDENT.TABLE_EMPLOYEE}</th>
                                    <th className="data-table-header-cell">{SYSTEM_MESSAGES.ASSET_INCIDENT.TABLE_ASSET}</th>
                                    <th className="data-table-header-cell">{SYSTEM_MESSAGES.ASSET_INCIDENT.TABLE_INCIDENT}</th>
                                    <th className="data-table-header-cell">{SYSTEM_MESSAGES.ASSET_INCIDENT.TABLE_DATE}</th>
                                    <th className="data-table-header-cell">{SYSTEM_MESSAGES.ASSET_INCIDENT.TABLE_STATUS}</th>
                                    {canProcess && (
                                        <th className="data-table-header-cell text-right">{SYSTEM_MESSAGES.ASSET_INCIDENT.TABLE_ACTION}</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={canProcess ? 6 : 5} className="py-16 text-center text-gray-400">
                                            <div className="flex items-center justify-center gap-2">
                                                 <Loader2 className="w-5 h-5 animate-spin" />
                                                  <span className="text-sm">{SYSTEM_MESSAGES.LOADING}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredIncidents.length === 0 ? (
                                    <tr>
                                         <td colSpan={canProcess ? 6 : 5} className="py-16 text-center text-gray-400 text-sm">
                                             {SYSTEM_MESSAGES.ASSET_REPORT.EMPTY_DESC}
                                         </td>
                                    </tr>
                                ) : filteredIncidents.map(incident => (
                                    <tr key={incident.id} className="data-table-row">
                                        <td className="data-table-cell">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                    {incident.employeeAvatar}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{incident.employeeName}</div>
                                                    {incident.employeeDept && (
                                                        <div className="text-xs text-gray-500">{incident.employeeDept}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="data-table-cell">
                                            <div className="font-medium text-gray-900">{incident.assetName}</div>
                                            <div className="text-xs text-gray-500">
                                                {SYSTEM_MESSAGES.ASSET_INCIDENT.LABEL_ID} {incident.assetId}
                                            </div>
                                        </td>
                                        <td className="data-table-cell">
                                            {/* FIX: bỏ incidentIcon (là JSX mock), chỉ hiện text */}
                                            <span className="text-sm font-medium text-gray-700">{incident.incidentType}</span>
                                        </td>
                                        <td className="data-table-cell text-gray-600">
                                            {incident.dateReported}
                                        </td>
                                        <td className="data-table-cell">
                                            <span className={`status-badge-base ${incident.statusClass} rounded-full px-3 py-1 font-medium text-xs`}>
                                                {incident.status === "PENDING"  ? "Pending"  :
                                                 incident.status === "APPROVED" ? "Approved" :
                                                 incident.status === "REJECTED" ? "Rejected" : incident.status}
                                            </span>
                                        </td>
                                        {canProcess && (
                                            <td className="data-table-cell text-right">
                                                <button
                                                    className="p-1 hover:bg-slate-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                                    onClick={() => setSelectedIncident(incident)}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* PAGINATION */}
                        <div className="pagination-container">
                            <div className="pagination-info">
                                {SYSTEM_MESSAGES.ASSET_INCIDENT.PAGINATION_SHOW}{" "}
                                {filteredIncidents.length}{" "}
                                {SYSTEM_MESSAGES.ASSET_INCIDENT.PAGINATION_RESULTS}
                            </div>
                        </div>
                    </div>
                </main>

                {/* FIX 4: onUpdate giờ là handleUpdate — gọi API thật */}
                <AssetIncidentReviewModal
                    open={!!selectedIncident}
                    onClose={() => setSelectedIncident(null)}
                    incident={selectedIncident}
                    onUpdate={handleUpdate}
                />
            </SidebarInset>
        </SidebarProvider>
    );
}

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { MoreVertical, Droplets, ShieldAlert, MonitorX, Cpu } from "lucide-react";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { INCIDENT_STATUS_OPTIONS } from "@/constants/options";
import AssetIncidentReviewModal from "./AssetIncidentReviewModal";

const MOCK_INCIDENTS = [
    {
        id: "1",
        employeeName: "Sarah Jenkins",
        employeeDept: "Engineering",
        employeeAvatar: "SJ",
        assetName: "MacBook Pro 16\"",
        assetId: "LPT-2023-084",
        incidentType: "Liquid Damage",
        incidentIcon: <Droplets className="w-4 h-4 text-orange-500" />,
        dateReported: "Oct 24, 2023",
        status: "Pending",
        statusClass: "bg-yellow-100 text-yellow-700"
    },
    {
        id: "2",
        employeeName: "Marcus Chen",
        employeeDept: "Sales",
        employeeAvatar: "MC",
        assetName: "iPhone 14 Pro",
        assetId: "MOB-2022-112",
        incidentType: "Lost/Stolen",
        incidentIcon: <ShieldAlert className="w-4 h-4 text-red-500" />,
        dateReported: "Oct 23, 2023",
        status: "Pending",
        statusClass: "bg-red-100 text-red-700"
    },
    {
        id: "3",
        employeeName: "Emily Jones",
        employeeDept: "Marketing",
        employeeAvatar: "EJ",
        assetName: "Dell UltraSharp 27\"",
        assetId: "MON-2021-045",
        incidentType: "Screen Cracked",
        incidentIcon: <MonitorX className="w-4 h-4 text-slate-500" />,
        dateReported: "Oct 21, 2023",
        status: "Rejected",
        statusClass: "bg-slate-100 text-slate-700"
    },
    {
        id: "4",
        employeeName: "David Smith",
        employeeDept: "Finance",
        employeeAvatar: "DS",
        assetName: "Lenovo ThinkPad X1",
        assetId: "LPT-2022-156",
        incidentType: "Hardware Failure",
        incidentIcon: <Cpu className="w-4 h-4 text-slate-500" />,
        dateReported: "Oct 19, 2023",
        status: "Approved",
        statusClass: "bg-green-100 text-green-700"
    }
];

export type IncidentItem = typeof MOCK_INCIDENTS[0];

import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { useAuth } from "@/contexts/AuthContext";

export default function AssetIncidentManagementPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [incidents, setIncidents] = useState<IncidentItem[]>(MOCK_INCIDENTS);
    const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
    const { user } = useAuth();
    const effectiveRole = useEffectiveRole();

    // Permissions logic
    const isManager = effectiveRole === "manager" || user?.roles.includes("ROLE_MANAGER");
    const isEmployee = effectiveRole === "employee" || (user?.roles.includes("ROLE_EMPLOYEE") && !user?.roles.includes("ROLE_ADMIN") && !user?.roles.includes("ROLE_HR") && !user?.roles.includes("ROLE_MANAGER"));
    const canProcess = !isManager && !isEmployee;

    const filteredIncidents = incidents.filter(incident => {
        const matchesSearch =
            incident.employeeName.toLowerCase().includes(search.toLowerCase()) ||
            incident.assetName.toLowerCase().includes(search.toLowerCase()) ||
            incident.assetId.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "All" || incident.status === statusFilter;
        // Mock filtering out if it's an employee (only sees their own)
        const isOwnRecord = incident.employeeName === (user?.firstName + ' ' + user?.lastName) || incident.employeeName === "David Smith"; // mockup David Smith as employee
        if (isEmployee && !isOwnRecord) { return false; }

        return matchesSearch && matchesStatus;
    });

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" role={effectiveRole} />

            <SidebarInset>
                <SiteHeader />

                <main className="page-layout-main">
                    {/* ===== HEADER ===== */}
                    <div className="page-header">
                        <div>
                            <h1 className="page-heading">{SYSTEM_MESSAGES.ASSET_INCIDENT.TITLE}</h1>
                            <p className="page-subtitle text-sm mt-1">{SYSTEM_MESSAGES.ASSET_INCIDENT.SUBTITLE}</p>
                        </div>
                    </div>

                    {/* ===== CONTENT CARDS / TABLE ===== */}
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
                                {filteredIncidents.map(incident => (
                                    <tr key={incident.id} className="data-table-row">
                                        <td className="data-table-cell">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                    {incident.employeeAvatar}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{incident.employeeName}</div>
                                                    <div className="text-xs text-gray-500">{incident.employeeDept}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="data-table-cell">
                                            <div className="font-medium text-gray-900">{incident.assetName}</div>
                                            <div className="text-xs text-gray-500">{SYSTEM_MESSAGES.ASSET_INCIDENT.LABEL_ID} {incident.assetId}</div>
                                        </td>
                                        <td className="data-table-cell">
                                            <div className="flex items-center gap-2">
                                                {incident.incidentIcon}
                                                <span className="text-sm font-medium text-gray-700">{incident.incidentType}</span>
                                            </div>
                                        </td>
                                        <td className="data-table-cell text-gray-600">
                                            {incident.dateReported}
                                        </td>
                                        <td className="data-table-cell">
                                            <span className={`status-badge-base ${incident.statusClass} rounded-full px-3 py-1 font-medium text-xs`}>
                                                {incident.status}
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

                        {/* ===== PAGINATION ===== */}
                        <div className="pagination-container">
                            <div className="pagination-info">
                                {SYSTEM_MESSAGES.ASSET_INCIDENT.PAGINATION_SHOW} {1} {SYSTEM_MESSAGES.ASSET_INCIDENT.PAGINATION_TO} {filteredIncidents.length} {SYSTEM_MESSAGES.ASSET_INCIDENT.PAGINATION_OF} {filteredIncidents.length} {SYSTEM_MESSAGES.ASSET_INCIDENT.PAGINATION_RESULTS}
                            </div>
                            <div className="pagination-buttons">
                                <button className="pagination-btn-inactive flex items-center justify-center text-gray-500 disabled:opacity-50">
                                    {SYSTEM_MESSAGES.ASSET_INCIDENT.BTN_PREV}
                                </button>
                                <button className="pagination-btn-inactive flex items-center justify-center text-gray-700">
                                    {SYSTEM_MESSAGES.ASSET_INCIDENT.BTN_NEXT}
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                <AssetIncidentReviewModal
                    open={!!selectedIncident}
                    onClose={() => setSelectedIncident(null)}
                    incident={selectedIncident}
                    onUpdate={(id, status, condition) => {
                        setIncidents(prev => prev.map(inc => {
                            if (inc.id === id) {
                                return {
                                    ...inc,
                                    status,
                                    statusClass: status === "Approved" ? "bg-green-100 text-green-700" : status === "Rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                }
                            }
                            return inc;
                        }));
                        if (condition) {
                            console.log("Updated asset condition to:", condition);
                        }
                    }}
                />
            </SidebarInset>
        </SidebarProvider>
    );
}

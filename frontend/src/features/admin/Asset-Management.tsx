import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Eye, Pencil } from "lucide-react";
import AssetDetailModal from "./AssetDetailModal";
import AssetCreateModal from "./AssetCreateModal";
import AssetEditModal from "./AssetEditModal";

import { SYSTEM_MESSAGES } from "@/constants/messages";
import { THEME_CLASSES } from "@/constants/theme";

const ASSET_FILTERS = [
    SYSTEM_MESSAGES.ASSET.FILTER_ALL,
    SYSTEM_MESSAGES.ASSET.FILTER_AVAILABLE,
    SYSTEM_MESSAGES.ASSET.FILTER_ASSIGNED,
    SYSTEM_MESSAGES.ASSET.FILTER_RETURNED,
] as const;

type AssetFilter = typeof ASSET_FILTERS[number];

/* ================= PAGE ================= */

export default function AssetManagementPage() {
    const [assets, setAssets] = useState([
        {
            id: "ASSET-001",
            name: "MacBook Pro M2",
            desc: "14-inch, 16GB RAM",
            type: "Laptop",
            status: "Sẵn dùng",
            statusColor: THEME_CLASSES.ASSET_STATUS.AVAILABLE,
            user: "Kho HN",
        },
        {
            id: "ASSET-002",
            name: "Dell XPS 15",
            desc: "9520, Core i7",
            type: "Laptop",
            status: "Đang cấp phát",
            statusColor: THEME_CLASSES.ASSET_STATUS.ASSIGNED,
            user: "Nguyễn Văn A",
        },
        {
            id: "ASSET-003",
            name: "ThinkPad X1",
            desc: "Carbon Gen 10",
            type: "Laptop",
            status: "Đã thu hồi",
            statusColor: THEME_CLASSES.ASSET_STATUS.RETURNED,
            user: "Kho HCM",
        },
    ]);

    const [activeFilter, setActiveFilter] = useState<AssetFilter>(SYSTEM_MESSAGES.ASSET.FILTER_ALL);
    const [search, setSearch] = useState("");
    const [openDetail, setOpenDetail] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const filteredAssets = assets.filter((a) => {
        const matchSearch =
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.id.toLowerCase().includes(search.toLowerCase());

        if (activeFilter === SYSTEM_MESSAGES.ASSET.FILTER_ALL) return matchSearch;
        return a.status === activeFilter && matchSearch;
    });

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />

            <SidebarInset>
                <SiteHeader />

                <main className="page-layout-main">
                    {/* ===== HEADER ===== */}
                    <div className="page-header">
                        <h1 className="page-title">{SYSTEM_MESSAGES.ASSET.TITLE}</h1>

                        <div className="page-header-actions">
                            <input
                                placeholder={SYSTEM_MESSAGES.ASSET.SEARCH_PLACEHOLDER}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="search-input"
                            />

                            <button
                                onClick={() => setOpenCreate(true)}
                                className="btn-primary"
                            >
                                {SYSTEM_MESSAGES.ASSET.BTN_ADD}
                            </button>
                        </div>
                    </div>

                    {/* ===== FILTER TABS ===== */}
                    <div className="filter-tabs">
                        {ASSET_FILTERS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveFilter(tab)}
                                className={`filter-tab ${
                                    activeFilter === tab
                                        ? "filter-tab-active"
                                        : "filter-tab-inactive"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* ===== TABLE ===== */}
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead className="data-table-header">
                                <tr>
                                    <th className="data-table-header-cell">{SYSTEM_MESSAGES.ASSET.TABLE_ID}</th>
                                    <th className="data-table-header-cell">{SYSTEM_MESSAGES.ASSET.TABLE_NAME}</th>
                                    <th className="data-table-header-cell">{SYSTEM_MESSAGES.ASSET.TABLE_TYPE}</th>
                                    <th className="data-table-header-cell">{SYSTEM_MESSAGES.ASSET.TABLE_STATUS}</th>
                                    <th className="data-table-header-cell">
                                        {SYSTEM_MESSAGES.ASSET.TABLE_USER}
                                    </th>
                                    <th className="data-table-header-cell text-right">{SYSTEM_MESSAGES.ASSET.TABLE_ACTIONS}</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredAssets.map((asset) => (
                                    <tr
                                        key={asset.id}
                                        className="data-table-row"
                                    >
                                        <td className="data-table-cell-primary">
                                            {asset.id}
                                        </td>

                                        <td className="data-table-cell">
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {asset.name}
                                            </div>
                                            <div className="text-xs text-gray-500">{asset.desc}</div>
                                        </td>

                                        <td className="data-table-cell">{asset.type}</td>

                                        <td className="data-table-cell">
                                            <span
                                                className={`status-badge-base ${asset.statusColor}`}
                                            >
                                                {asset.status}
                                            </span>
                                        </td>

                                        <td className="data-table-cell-muted">{asset.user}</td>

                                        <td className="data-table-cell text-right">
                                            <div className="flex justify-end gap-3 text-gray-500">
                                                <Eye
                                                    size={18}
                                                    className="cursor-pointer hover:text-primary"
                                                    onClick={() => setOpenDetail(true)}
                                                />
                                                <Pencil
                                                    size={18}
                                                    className="cursor-pointer hover:text-primary"
                                                    onClick={() => {
                                                        setSelectedAsset(asset);
                                                        setOpenEdit(true);
                                                    }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* ===== PAGINATION ===== */}
                        <div className="pagination-container">
                            <div className="pagination-info">
                                {SYSTEM_MESSAGES.ASSET.PAGINATION_SHOW} 1-5 {SYSTEM_MESSAGES.ASSET.PAGINATION_ON} 120 {SYSTEM_MESSAGES.ASSET.PAGINATION_ITEMS}
                            </div>

                            <div className="pagination-buttons">
                                <button className="pagination-btn-active">
                                    1
                                </button>
                                <button className="pagination-btn-inactive">
                                    2
                                </button>
                                <button className="pagination-btn-inactive">
                                    3
                                </button>
                                <span>...</span>
                                <button className="pagination-btn-inactive">
                                    24
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
                <AssetCreateModal
                    open={openCreate}
                    onClose={() => setOpenCreate(false)}
                />
                <AssetDetailModal
                    open={openDetail}
                    onClose={() => setOpenDetail(false)}
                />
                <AssetEditModal
                    open={openEdit}
                    asset={selectedAsset}
                    onClose={() => setOpenEdit(false)}
                    onSave={(updated) => {
                        setAssets((prev) =>
                            prev.map((a) =>
                                a.id === updated.id
                                    ? {
                                          ...a,
                                          name: updated.name,
                                          type: updated.type,
                                          status: updated.status,
                                      }
                                    : a,
                            ),
                        );
                    }}
                />
            </SidebarInset>
        </SidebarProvider>
    );
}

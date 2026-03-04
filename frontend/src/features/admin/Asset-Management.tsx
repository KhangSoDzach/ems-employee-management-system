import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Eye, Pencil } from "lucide-react";
import AssetDetailModal from "./AssetDetailModal";
import AssetCreateModal from "./AssetCreateModal";
import AssetEditModal from "./AssetEditModal";

/* ================= PAGE ================= */

export default function AssetManagementPage() {
  /* ================= DATA ================= */

  const [assets, setAssets] = useState([
    {
      id: "ASSET-001",
      name: "MacBook Pro M2",
      desc: "14-inch, 16GB RAM",
      type: "Laptop",
      status: "Sẵn dùng",
      statusColor: "bg-green-100 text-green-700",
      user: "Kho HN",
    },
    {
      id: "ASSET-002",
      name: "Dell XPS 15",
      desc: "9520, Core i7",
      type: "Laptop",
      status: "Đang cấp phát",
      statusColor: "bg-blue-100 text-blue-700",
      user: "Nguyễn Văn A",
    },
    {
      id: "ASSET-003",
      name: "ThinkPad X1",
      desc: "Carbon Gen 10",
      type: "Laptop",
      status: "Đã thu hồi",
      statusColor: "bg-yellow-100 text-yellow-700",
      user: "Kho HCM",
    },
  ]);

  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [openDetail, setOpenDetail] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const filteredAssets = assets.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase());

    if (activeFilter === "Tất cả") return matchSearch;
    return a.status === activeFilter && matchSearch;
  });

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />

      <SidebarInset>
        <SiteHeader />

        <main className="flex flex-1 flex-col p-6 gap-6 bg-gray-50 dark:bg-gray-950">
          {/* ===== HEADER ===== */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Quản lý tài sản</h1>

            <div className="flex items-center gap-4">
              <input
                placeholder="Tìm kiếm tài sản..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 w-64 rounded-full bg-gray-100 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <button
                onClick={() => setOpenCreate(true)}
                className="px-5 py-2 bg-primary text-white rounded-full font-semibold hover:bg-primary/90"
              >
                + Thêm tài sản
              </button>
            </div>
          </div>

          {/* ===== FILTER TABS ===== */}
          <div className="flex gap-3">
            {["Tất cả", "Sẵn dùng", "Đang cấp phát", "Đã thu hồi"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    activeFilter === tab
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab}
                </button>
              ),
            )}
          </div>

          {/* ===== TABLE ===== */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 text-left">Mã tài sản</th>
                  <th className="px-6 py-4 text-left">Tên tài sản</th>
                  <th className="px-6 py-4 text-left">Loại</th>
                  <th className="px-6 py-4 text-left">Trạng thái</th>
                  <th className="px-6 py-4 text-left">
                    Người sử dụng / Vị trí
                  </th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="border-t hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {asset.id}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {asset.name}
                      </div>
                      <div className="text-xs text-gray-500">{asset.desc}</div>
                    </td>

                    <td className="px-6 py-4">{asset.type}</td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${asset.statusColor}`}
                      >
                        {asset.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-600">{asset.user}</td>

                    <td className="px-6 py-4 text-right">
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
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 dark:bg-gray-800 text-sm">
              <div className="text-gray-500">Hiển thị 1-5 trên 120 tài sản</div>

              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-full bg-primary text-white font-bold">
                  1
                </button>
                <button className="w-8 h-8 rounded-full hover:bg-gray-200">
                  2
                </button>
                <button className="w-8 h-8 rounded-full hover:bg-gray-200">
                  3
                </button>
                <span>...</span>
                <button className="w-8 h-8 rounded-full hover:bg-gray-200">
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

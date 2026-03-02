import React, { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

const ApproveLeaveRequest: React.FC = () => {
  const [search, setSearch] = useState("")

  const requests = [
    {
      id: 1,
      name: "Nguyễn Văn A",
      type: "Nghỉ phép năm",
      from: "20/02/2026",
      to: "22/02/2026",
      status: "Pending",
    },
    {
      id: 2,
      name: "Trần Thị B",
      type: "Nghỉ ốm",
      from: "25/02/2026",
      to: "26/02/2026",
      status: "Pending",
    },
  ]

  const filteredRequests = requests.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <SidebarProvider>
      <AppSidebar role="manager" variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="flex-1 p-8 bg-background-light dark:bg-background-dark min-h-screen">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Header + Search */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h1 className="text-2xl font-bold">
                Phê duyệt đơn nghỉ phép
              </h1>

              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên nhân viên..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Nhân viên</th>
                    <th className="text-left py-3">Loại nghỉ</th>
                    <th className="text-left py-3">Từ ngày</th>
                    <th className="text-left py-3">Đến ngày</th>
                    <th className="text-left py-3">Trạng thái</th>
                    <th className="text-right py-3">Hành động</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map((item) => (
                    <tr key={item.id} className="border-b last:border-none">
                      <td className="py-4">{item.name}</td>
                      <td>{item.type}</td>
                      <td>{item.from}</td>
                      <td>{item.to}</td>
                      <td>
                        <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                          {item.status}
                        </span>
                      </td>
                      <td className="text-right space-x-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Phê duyệt
                        </Button>
                        <Button size="sm" variant="destructive">
                          Từ chối
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredRequests.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  Không tìm thấy kết quả
                </div>
              )}
            </div>

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default ApproveLeaveRequest
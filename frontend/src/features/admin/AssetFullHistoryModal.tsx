import { useMemo, useState } from "react"
import { X, History, UserCheck, UserX, Edit } from "lucide-react"

interface Props {
  open: boolean
  onClose: () => void
}

type HistoryType = "all" | "assign" | "return" | "update"

interface HistoryItem {
  id: number
  type: Exclude<HistoryType, "all">
  action: string
  user: string
  description: string
  date: string
}

const historyData: HistoryItem[] = [
  {
    id: 1,
    type: "assign",
    action: "Cấp phát",
    user: "Trần Thị B",
    description: "Cấp phát cho Nguyễn Văn A (Phòng Marketing)",
    date: "10/10/2023 14:30",
  },
  {
    id: 2,
    type: "return",
    action: "Thu hồi",
    user: "Lê Văn C",
    description: "Thu hồi từ nhân viên cũ, lý do: Nghỉ việc",
    date: "05/10/2023 09:15",
  },
  {
    id: 3,
    type: "update",
    action: "Cập nhật",
    user: "Admin",
    description: "Cập nhật tình trạng tài sản 98%",
    date: "01/10/2023 16:45",
  },
]

export default function AssetFullHistoryModal({
  open,
  onClose,
}: Props) {
  const [filter, setFilter] = useState<HistoryType>("all")

  const filteredData = useMemo(() => {
    if (filter === "all") return historyData
    return historyData.filter((item) => item.type === filter)
  }, [filter])

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "assign":
        return "bg-blue-100 text-blue-600"
      case "return":
        return "bg-red-100 text-red-600"
      case "update":
        return "bg-yellow-100 text-yellow-600"
      default:
        return ""
    }
  }

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "assign":
        return <UserCheck size={18} />
      case "return":
        return <UserX size={18} />
      case "update":
        return <Edit size={18} />
      default:
        return null
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="
          relative
          bg-[#f9fafb]
          w-full
          max-w-5xl
          max-h-[90vh]
          rounded-[32px]
          shadow-[0_25px_80px_rgba(0,0,0,0.18)]
          flex
          flex-col
          overflow-hidden
        "
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-6 bg-white border-b">
          <div>
            <h2 className="text-2xl font-bold">
              Toàn bộ lịch sử tài sản - MacBook Pro M2
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Theo dõi chi tiết các biến động của tài sản
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition"
          >
            <X className="text-slate-500" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* FILTER */}
          <div className="flex gap-3">
            {[
              { key: "all", label: "Tất cả" },
              { key: "assign", label: "Cấp phát" },
              { key: "return", label: "Thu hồi" },
              { key: "update", label: "Cập nhật" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as HistoryType)}
                className={`
                  px-5 py-2 text-sm font-semibold rounded-xl transition
                  ${
                    filter === item.key
                      ? "bg-primary text-white shadow-md"
                      : "bg-white border hover:border-primary"
                  }
                `}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left">Ngày thực hiện</th>
                  <th className="px-6 py-4 text-left">Hành động</th>
                  <th className="px-6 py-4 text-left">Người thực hiện</th>
                  <th className="px-6 py-4 text-left">Nội dung chi tiết</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">{item.date}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs rounded-full ${getBadgeStyle(
                          item.type
                        )}`}
                      >
                        {item.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{item.user}</td>
                    <td className="px-6 py-4">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TIMELINE */}
          <div>
            <h3 className="flex items-center gap-2 font-semibold mb-6 text-lg">
              <History size={18} className="text-primary" />
              Dòng thời gian biến động
            </h3>

            <div className="space-y-6">
              {filteredData.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${getBadgeStyle(item.type)}
                    `}
                  >
                    {getTimelineIcon(item.type)}
                  </div>

                  <div className="bg-white border rounded-2xl p-5 flex-1 shadow-sm">
                    <div className="flex justify-between">
                      <span className="font-semibold">{item.action}</span>
                      <span className="text-xs text-slate-400">
                        {item.date}
                      </span>
                    </div>

                    <p className="text-sm mt-3">
                      Người thực hiện: <b>{item.user}</b>
                    </p>

                    <p className="text-sm text-slate-500 italic mt-2">
                      "{item.description}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-8 py-5 bg-white border-t flex justify-end gap-3">
          <button className="px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition">
            Xuất báo cáo
          </button>

          <button
            onClick={onClose}
            className="px-8 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:opacity-90 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
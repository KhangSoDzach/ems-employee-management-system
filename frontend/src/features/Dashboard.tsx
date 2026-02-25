import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Link } from "react-router-dom"

interface EmployeeCardProps {
  name: string;
  code: string;
  status: string;
  statusColor: string;
  avatar?: string;
  id: string | number;
  email: string;
  phone: string;
}

function EmployeeCard({
  name,
  code,
  status,
  statusColor,
  avatar,
  id,
  email,
  phone,
}: EmployeeCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {avatar ? (
              <img src={avatar} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-3xl text-gray-400">

              </span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{name}</h3>
            <p className="text-xs text-primary font-medium">Mã: {code}</p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${statusColor}`}
        >
          {status}
        </span>
      </div>

      <div className="grid gap-2 border-t border-gray-50 dark:border-gray-700 pt-3 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base">ID: </span>
          {id}
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base">Email: </span>
          <span className="truncate">{email}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base">
            Phone Number:
          </span>
          {phone}
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <SidebarProvider

    >
      <AppSidebar variant="inset" />

      <SidebarInset>
        <SiteHeader />

        {/* CONTENT */}
        <main className="flex flex-1 flex-col p-4 gap-4 pb-28 bg-background-light dark:bg-background-dark">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Danh sách nhân viên
            </h1>

          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">

              </span>
              <input
                placeholder="Tìm mã, tên, email..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <button className="bg-gray-100 dark:bg-gray-800 p-2.5 rounded-lg">
              <span className="material-symbols-outlined"></span>
            </button>
          </div>

          {/* Add button */}
          <Link
            to="/adding"
            className="w-full bg-primary text-white font-bold py-3 rounded-lg shadow-md
             flex items-center justify-center gap-2 rounded-lg"
          >
            <span className="material-symbols-outlined"></span>
            Thêm nhân viên
          </Link>

          {/* Employee list */}
          <div className="space-y-4">
            <EmployeeCard
              name="Nguyễn Văn An"
              code="NV001"
              status="Hoạt động"
              statusColor="bg-green-100 text-success"
              avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuCehbjY1vxy4ch8SquAIM3HC6UAkMaH8aet1WV4uEKAausV89lcxjWGfS8vSJ2t2jkwQOTkBsxrvmuu6Ha6xVqA6LDo2GgbXRgKYRUx3pBBbUb0h1Yum6cGNguUt3q7t6nRlgifZXn45ZpYUoM_0pqFnzdtWYqBcNCHIGPCOhQ_Lt4LfXSzpwrEfAriNfIGEgbcf6XgrQLLd4aHspW9DVzESCnGys3hxCvkoXVRn86Oq3pMFQRBGlm33p6crym5cA9M3HKKhuDkJrkT"
              id="123456789012"
              email="an.nguyen@company.vn"
              phone="0912 345 678"
            />

            <EmployeeCard
              name="Trần Thị Bích"
              code="NV002"
              status="Nghỉ việc"
              statusColor="bg-gray-100 text-secondary"
              id="098765432109"
              email="bich.tran@company.vn"
              phone="0988 776 655"
            />

            <EmployeeCard
              name="Lê Minh Tâm"
              code="NV003"
              status="Hoạt động"
              statusColor="bg-green-100 text-success"
              avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuAfq4j4O_h7NzxzrrbLS2UuCn4kzUpIutSNjLj3sGcOnDeLaDs3ukiPGo-FjTR6MckK9C4pt-nUg_OTcQrL3rbOmT5jivMzEnFs47MfUk7bRjAZ4HxKzIYPlL2RBWobAU1hAATsbSIyH7cTilglptHmm53olHBEPL3ZTGdnI-17-_iifb5mM5VxubgLzbbuUD_oWlPoVmE9lznZgXgUzBDWZWl3vaaFHC4ag2rVgtHeTBqanV54Lo9lNF33n-Z8P2-X_3QV-iRvItQA"
              id="456789123045"
              email="tam.le@company.vn"
              phone="0909 123 456"
            />
          </div>

          {/* Pagination */}
          <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Trang <b>1</b>/10
              </span>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-gray-100 rounded-lg text-gray-400 cursor-not-allowed">
                  Trước
                </button>
                <button className="px-4 py-2 bg-primary text-white rounded-lg">
                  Sau
                </button>
              </div>
            </div>
          </footer>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

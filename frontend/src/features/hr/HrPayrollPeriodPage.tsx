import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PayrollPeriodView } from "@/features/hr/components/PayrollPeriodView";

export default function HrPayrollPeriodPage() {
  return (
    <SidebarProvider>
      <AppSidebar role="hr" variant="inset" />
      <SidebarInset className="flex flex-col overflow-hidden">
        <SiteHeader />

        {/* Main: fills remaining height, no page scroll */}
        <main className="flex flex-col flex-1 overflow-hidden bg-background p-4 pt-6 md:p-6 gap-4">
          <div className="flex-shrink-0">
            <h1 className="page-heading">Bảng lương theo kỳ</h1>
            <p className="text-sm text-muted-foreground">
              Xem và xuất file bảng lương toàn bộ nhân viên theo kỳ.
            </p>
          </div>

          {/* PayrollPeriodView fills the rest of the height */}
          <div className="flex-1 overflow-hidden">
            <PayrollPeriodView />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PayrollPeriodView } from "@/features/hr/components/PayrollPeriodView";

export default function HrPayrollPeriodPage() {
  return (
    <SidebarProvider>
      <AppSidebar role="hr" variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="min-h-screen space-y-6 bg-background p-4 pt-6 md:p-8">
          <div>
            <h1 className="page-heading">Bảng lương theo kỳ</h1>
            <p className="text-sm text-muted-foreground">
              Xem và xuất file bảng lương toàn bộ nhân viên theo kỳ.
            </p>
          </div>
          <PayrollPeriodView />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

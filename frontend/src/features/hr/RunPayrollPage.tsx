// src/features/hr/RunPayrollPage.tsx
// Page 2: Quản lý kỳ lương — dành cho HR (và Admin).
// Chứa thao tác Chạy tính lương / Tính lại lương.

import { ShieldAlert } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RunPayrollPanel } from "@/features/hr/components/RunPayrollPanel";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { PAYROLL_HR_CONSTANTS as C } from "@/features/hr/run-payroll.constants";

// ── 403 Guard ──────────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <ShieldAlert className="h-14 w-14 text-destructive opacity-80" />
      <h2 className="text-xl font-bold text-destructive">
        {C.ACCESS_DENIED_TITLE}
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {C.ACCESS_DENIED_DESC}
      </p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RunPayrollPage() {
  const effectiveRole = useEffectiveRole();
  const isAllowed = effectiveRole === "hr" || effectiveRole === "admin";

  return (
    <SidebarProvider>
      <AppSidebar role={effectiveRole} variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="payroll-page-main">
          {!isAllowed ? (
            <AccessDenied />
          ) : (
            <>
              {/* ── Page Header ── */}
              <div className="payroll-page-header">
                <div>
                  <h1 className="page-heading">{C.PAGE_TITLE}</h1>
                  <p className="text-sm text-muted-foreground">
                    {C.PAGE_SUBTITLE}
                  </p>
                </div>
              </div>

              {/* ── Run Payroll Panel ── */}
              <RunPayrollPanel />
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

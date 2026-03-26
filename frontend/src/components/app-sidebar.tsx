import * as React from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import {
  ChevronDown,
  ChevronRight,
  User,
  Settings,
  Package,
  Bell,
  Calendar,
  Users,
  CreditCard,
  Target,
  ShieldCheck,
  ClipboardList,
  AlertCircle,
  FileQuestion,
  Clock,
  LayoutDashboard,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";

import { VersionSwitcher } from "@/components/version-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { cn } from "@/lib/utils";

export function AppSidebar({
  role: propRole,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  role?: "admin" | "employee" | "manager" | "hr";
}) {
  useAuth();
  const role = useEffectiveRole(propRole);
  const location = useLocation();
  const [openCreate, setOpenCreate] = React.useState(() => {
    const saved = localStorage.getItem("sidebar_open_create");
    return saved !== null ? saved === "true" : true;
  });
  const [openApprove, setOpenApprove] = React.useState(() => {
    const saved = localStorage.getItem("sidebar_open_approve");
    return saved !== null ? saved === "true" : true;
  });
  const [openManage, setOpenManage] = React.useState(() => {
    const saved = localStorage.getItem("sidebar_open_manage");
    return saved !== null ? saved === "true" : true;
  });

  React.useEffect(() => {
    localStorage.setItem("sidebar_open_create", String(openCreate));
  }, [openCreate]);

  React.useEffect(() => {
    localStorage.setItem("sidebar_open_approve", String(openApprove));
  }, [openApprove]);

  React.useEffect(() => {
    localStorage.setItem("sidebar_open_manage", String(openManage));
  }, [openManage]);

  // Helper to determine if a route is active
  const isActive = (url: string) =>
    location.pathname + location.search === url || location.pathname === url;

  // We define groups based on roles, keeping it similar to the old structure
  const navMain: any[] = React.useMemo(() => {
    // 1. Common sections for everyone
    const commonSection = {
      title: SYSTEM_MESSAGES.SIDEBAR.SECTION_PERSONAL,
      items: [
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_PROFILE,
          url: "/profile",
          icon: User,
        },
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_ANNOUNCEMENTS,
          url: "/announcements",
          icon: Bell,
        },
      ],
    };

    // 2. Create Request (Tạo đơn) - visible for Employee, Manager, HR
    const createSection = {
      title: SYSTEM_MESSAGES.SIDEBAR.SECTION_CREATE,
      id: "create",
      icon: PlusCircle,
      color: "text-red-500",
      isOpen: openCreate,
      setOpen: setOpenCreate,
      items: [
        {
          title: SYSTEM_MESSAGES.REQUEST.CREATE_LEAVE,
          url: "/request?tab=leave",
        },
        {
          title: SYSTEM_MESSAGES.REQUEST.CREATE_ADJUSTMENT,
          url: "/request?tab=adjustment",
        },
        { title: SYSTEM_MESSAGES.SIDEBAR.MENU_CHECKIN, url: "/checkin" },
        { title: SYSTEM_MESSAGES.SIDEBAR.MENU_ATTENDANCE, url: "/attendance" },
      ],
    };

    // 3. Approve Request (Duyệt đơn) - visible for Manager, HR, Admin
    const approveSection = {
      title: SYSTEM_MESSAGES.SIDEBAR.SECTION_APPROVE,
      id: "approve",
      icon: CheckCircle2,
      color: "text-emerald-500",
      isOpen: openApprove,
      setOpen: setOpenApprove,
      items: [] as any[],
    };

    // 4. Management (Quản lý)
    const manageSection = {
      title: SYSTEM_MESSAGES.SIDEBAR.SECTION_MANAGEMENT,
      id: "manage",
      icon: LayoutDashboard,
      color: "text-blue-500",
      isOpen: openManage,
      setOpen: setOpenManage,
      items: [] as any[],
    };

    if (role === "admin") {
      commonSection.items = [
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_PROFILE,
          url: "/profile",
          icon: User,
        },
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_ANNOUNCEMENTS,
          url: "/announcements",
          icon: Bell,
        },
      ];
      manageSection.items = [
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_ATTENDANCE_SETTINGS,
          url: "/attendance-settings",
          icon: Settings,
        },
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_PAYROLL,
          url: "/payroll",
          icon: CreditCard,
        },
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_AUDIT_LOGS,
          url: "/audit-logs",
          icon: ShieldCheck,
        },
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_MANAGE_ANNOUNCEMENTS,
          url: "/announcements/manage",
          icon: Bell,
        },
      ];
      return [commonSection, manageSection];
    }

    if (role === "manager") {
      commonSection.items.push({
        title: SYSTEM_MESSAGES.SIDEBAR.MENU_SALARY_HISTORY,
        url: "/salary-history",
        icon: CreditCard,
      });
      commonSection.items.push({
        title: SYSTEM_MESSAGES.SIDEBAR.MENU_MY_ASSETS,
        url: "/my-assets",
        icon: Package,
      });
      approveSection.items = [
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_APPROVE_LEAVE,
          url: "/approve",
          icon: ClipboardList,
        },
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_APPROVE_ADJ,
          url: "/approve-adjustments",
          icon: Calendar,
        },
      ];
      manageSection.items = [
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_MEMBERS,
          url: "/members",
          icon: Users,
        },
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_KPI,
          url: "/kpi-okr",
          icon: Target,
        },
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_GROUP_ASSET,
          url: "/view-group-asset",
          icon: Package,
        },
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_ASSET_INCIDENT,
          url: "/asset-incidents",
          icon: AlertCircle,
        },
      ];
      return [commonSection, createSection, approveSection, manageSection];
    }

    if (role === "hr") {
      commonSection.items.push({
        title: SYSTEM_MESSAGES.SIDEBAR.MENU_SALARY_HISTORY,
        url: "/salary-history",
        icon: CreditCard,
      });
      commonSection.items.push({
        title: SYSTEM_MESSAGES.SIDEBAR.MENU_MY_ASSETS,
        url: "/my-assets",
        icon: Package,
      });
      approveSection.items = [
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_APPROVE_LEAVE,
          url: "/approve",
          icon: ClipboardList,
        },
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_APPROVE_ADJ,
          url: "/approve-adjustments",
          icon: Calendar,
        },
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_APPROVE_REPORTS,
          url: "/asset-reports",
          icon: AlertCircle,
        },
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_APPROVE_ASSET_REQUESTS,
          url: "/asset-requests",
          icon: FileQuestion,
        },
      ];
      manageSection.items = [
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_EMP_MGMT,
          url: "/hr-employees",
          icon: Users,
        },
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_ASSET_MGMT,
          url: "/assets",
          icon: Package,
        },
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_HR_PAYROLL_PERIOD,
          url: "/hr-payroll-period",
          icon: CreditCard,
        },
        {
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_AUDIT_LOGS,
          url: "/audit-logs",
          icon: ShieldCheck,
        },
      ];
      return [commonSection, createSection, approveSection, manageSection];
    }

    // Role: Employee
    commonSection.items.push({
      title: SYSTEM_MESSAGES.SIDEBAR.MENU_SALARY_HISTORY,
      url: "/salary-history",
      icon: CreditCard,
    });
    commonSection.items.push({
      title: SYSTEM_MESSAGES.SIDEBAR.MENU_MY_ASSETS,
      url: "/my-assets",
      icon: Package,
    });
    manageSection.items = [
      {
        title: SYSTEM_MESSAGES.SIDEBAR.MENU_MEMBERS,
        url: "/members",
        icon: Users,
      },
    ];
    return [commonSection, createSection, manageSection];
  }, [role, openCreate, openApprove, openManage]);

  return (
    <Sidebar {...props} className="w-52 border-r">
      <SidebarHeader className="h-12 w-55 border-b px-2 justify-center">
        <VersionSwitcher />
      </SidebarHeader>
      <SidebarContent className="hide-scrollbar">
        {navMain.map((group) => {
          if (!group.items || group.items.length === 0) {
            return null;
          }

          // Simple flat menu for "Cá nhân"
          if (!group.id) {
            return (
              <SidebarGroup key={group.title}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item: any) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.url)}
                        >
                          <Link
                            to={item.url}
                            className="flex items-center gap-2"
                          >
                            <item.icon className="w-4 h-4 opacity-70" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          // Collapsible menu for other sections
          return (
            <SidebarGroup key={group.id}>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => group.setOpen(!group.isOpen)}
                    className="flex items-center justify-between w-full hover:bg-transparent"
                  >
                    <div className="flex items-center gap-2">
                      <group.icon className={cn("w-4 h-4", group.color)} />
                      <span className="font-bold uppercase text-[11px] tracking-wider text-muted-foreground/80">
                        {group.title}
                      </span>
                    </div>
                    {group.isOpen ? (
                      <ChevronDown className="w-3 h-3 text-muted-foreground/50" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                    )}
                  </SidebarMenuButton>
                  {group.isOpen && (
                    <SidebarMenuSub>
                      {group.items.map((item: any) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(item.url)}
                          >
                            <Link
                              to={item.url}
                              className="flex items-center gap-2"
                            >
                              {item.icon ? (
                                <item.icon className="w-3.5 h-3.5" />
                              ) : // Default icons for items without specific icons (like in Create section)
                              item.url.includes("leave") ? (
                                <Calendar className="w-3.5 h-3.5" />
                              ) : item.url.includes("adjustment") ? (
                                <Clock className="w-3.5 h-3.5" />
                              ) : item.url.includes("attendance") ? (
                                <Clock className="w-3.5 h-3.5" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

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
  Play,
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
  SidebarMenuSubButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { cn } from "@/lib/utils";
import { useSidebarBadgeCounts } from "@/hooks/useSidebarBadgeCounts";

// For subitems that don't have an explicit icon, we use a fallback based on the URL
const getFallbackItemIcon = (url: string) => {
  if (url.includes("leave")) {
    return Calendar;
  }
  if (url.includes("adjustment") || url.includes("attendance")) {
    return Clock;
  }
  return CheckCircle2;
};

const SidebarItem = ({
  item,
  isActive,
  renderBadge,
  isSubItem = false,
}: {
  item: any;
  isActive: boolean;
  renderBadge: (url: string) => React.ReactNode;
  isSubItem?: boolean;
}) => {
  const itemRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isActive && itemRef.current) {
      // Small delay to ensure any parent opening animations have finished or started
      const timer = setTimeout(() => {
        itemRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  const MenuButton = isSubItem ? SidebarMenuSubButton : SidebarMenuButton;
  const Icon = item.icon ?? (isSubItem ? getFallbackItemIcon(item.url) : null);

  return (
    <div ref={itemRef} className="w-full">
      <MenuButton
        asChild
        isActive={isActive}
        className={cn("w-full", isSubItem && "translate-x-0")}
      >
        <Link
          to={item.url}
          className="flex items-center justify-between gap-2 w-full"
          title={item.title}
        >
          <span className="flex items-center gap-2 min-w-0">
            {Icon &&
              React.createElement(Icon, {
                className: cn(
                  "w-4 h-4",
                  isSubItem ? "w-3.5 h-3.5" : "opacity-70",
                ),
              })}
            <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
              {item.title}
            </span>
          </span>
          {renderBadge(item.url)}
        </Link>
      </MenuButton>
    </div>
  );
};

export function AppSidebar({
  role: propRole,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  role?: "admin" | "employee" | "manager" | "hr";
}) {
  const { user } = useAuth();
  const role = useEffectiveRole(propRole);
  const badgeCounts = useSidebarBadgeCounts(role, user?.id ?? null);
  const location = useLocation();
  const [openCreate, setOpenCreate] = React.useState(() => {
    const saved = localStorage.getItem("sidebar_open_create");
    return saved !== null ? saved === "true" : false;
  });
  const [openApprove, setOpenApprove] = React.useState(() => {
    const saved = localStorage.getItem("sidebar_open_approve");
    return saved !== null ? saved === "true" : false;
  });
  const [openManage, setOpenManage] = React.useState(() => {
    const saved = localStorage.getItem("sidebar_open_manage");
    return saved !== null ? saved === "true" : false;
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

  const renderBadge = (url: string) => {
    const count = badgeCounts[url] ?? 0;
    if (count <= 0) {
      return null;
    }

    return (
      <span className="ml-auto inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-semibold text-white">
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  const renderCountBadge = (count: number) => {
    if (count <= 0) {
      return null;
    }

    return (
      <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-semibold text-white">
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  // SidebarItem handles the fallback logic now

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
        // Attendance items moved here for non-admin roles
        ...(role !== "admin"
          ? [
              {
                title: SYSTEM_MESSAGES.SIDEBAR.MENU_CHECKIN,
                url: "/checkin",
                icon: Play,
              },
              {
                title: SYSTEM_MESSAGES.SIDEBAR.MENU_ATTENDANCE,
                url: "/attendance",
                icon: Clock,
              },
            ]
          : []),
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
          title: SYSTEM_MESSAGES.SIDEBAR.MENU_RUN_PAYROLL,
          url: "/run-payroll",
          icon: Play,
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
              <SidebarGroup key={group.title} className="p-0">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item: any) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarItem
                          item={item}
                          isActive={isActive(item.url)}
                          renderBadge={renderBadge}
                        />
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          // Collapsible menu for other sections
          const groupBadgeTotal = (group.items as any[]).reduce(
            (sum, item) => sum + (badgeCounts[item.url] ?? 0),
            0,
          );

          return (
            <SidebarGroup key={group.id} className="p-0">
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
                    <div className="flex items-center gap-2">
                      {renderCountBadge(groupBadgeTotal)}
                      {group.isOpen ? (
                        <ChevronDown className="w-3 h-3 text-muted-foreground/50" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                      )}
                    </div>
                  </SidebarMenuButton>
                  {group.isOpen && (
                    <SidebarMenuSub className="mx-0 border-l-0 px-0">
                      {group.items.map((item: any) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarItem
                            item={item}
                            isActive={isActive(item.url)}
                            renderBadge={renderBadge}
                            isSubItem
                          />
                        </SidebarMenuItem>
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

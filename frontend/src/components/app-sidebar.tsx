import * as React from "react";
import { useLocation } from "react-router-dom";

import { VersionSwitcher } from "@/components/version-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SYSTEM_MESSAGES } from "@/constants/messages";

type SidebarNavGroup = {
  title: string;
  url: string;
  items: Array<{
    title: string;
    url: string;
  }>;
};

export function AppSidebar({
  role = "admin",
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  role?: "admin" | "employee" | "manager" | "hr";
}) {
  const location = useLocation();

  const navMain: SidebarNavGroup[] =
    role === "admin"
      ? [
        {
          title: SYSTEM_MESSAGES.SIDEBAR.ADMIN_SECTION,
          url: "#",
          items: [
            {
              title: SYSTEM_MESSAGES.SIDEBAR.MENU_PROFILE,
              url: "/profile",
            },
            {
              title: SYSTEM_MESSAGES.SIDEBAR.MENU_ATTENDANCE_SETTINGS,
              url: "/attendance-settings",
            },
            {
              title: SYSTEM_MESSAGES.SIDEBAR.MENU_ASSET_MGMT,
              url: "/assets",
            },
            {
              title:
                SYSTEM_MESSAGES.SIDEBAR.MENU_ASSET_INCIDENT ||
                "Quản lý sự cố tài sản",
              url: "/asset-incidents",
            },
            {
              title: "Thông báo nội bộ",
              url: "/announcements",
            },
            {
              title: "Tạo thông báo",
              url: "/announcements/manage",
            },
            {
              title: "Duyệt báo cáo sự cố",
              url: "/asset-reports",
            },
          ],
        },
      ]
      : role === "manager"
        ? [
          {
            title: SYSTEM_MESSAGES.SIDEBAR.MANAGER_SECTION,
            url: "#",
            items: [
              {
                title: SYSTEM_MESSAGES.SIDEBAR.MENU_PROFILE,
                url: "/profile",
              },
              {
                title: "Chấm công",
                url: "/checkin",
              },
              {
                title: SYSTEM_MESSAGES.SIDEBAR.MENU_MEMBERS,
                url: "/members",
              },

              {
                title: SYSTEM_MESSAGES.SIDEBAR.MENU_KPI,
                url: "/kpi-okr",
              },
              {
                title: SYSTEM_MESSAGES.SIDEBAR.MENU_APPROVE_LEAVE,
                url: "/approve",
              },
              {
                title: SYSTEM_MESSAGES.SIDEBAR.MENU_APPROVE_ADJ,
                url: "/approve-adjustments",
              },
              {
                title: SYSTEM_MESSAGES.SIDEBAR.MENU_REQUEST,
                url: "/request",
              },
              {
                title: SYSTEM_MESSAGES.SIDEBAR.MENU_GROUP_ASSET,
                url: "/view-group-asset",
              },
              {
                title: SYSTEM_MESSAGES.SIDEBAR.MENU_MY_ASSETS,
                url: "/my-assets",
              },
              {
                title:
                  SYSTEM_MESSAGES.SIDEBAR.MENU_ASSET_INCIDENT ||
                  "Quản lý sự cố tài sản",
                url: "/asset-incidents",
              },
              {
                title: "Thông báo nội bộ",
                url: "/announcements",
              },
              {
                title: SYSTEM_MESSAGES.SIDEBAR.MENU_PAYROLL,
                url: "/payroll",
              },
              {
                title: "Tạo thông báo",
                url: "/announcements/manage",
              },
              {
                title: "Duyệt báo cáo sự cố",
                url: "/asset-reports",
              },
            ],
          },
        ]
        : role === "hr"
          ? [
            {
              title: SYSTEM_MESSAGES.SIDEBAR.HR_SECTION,
              url: "#",
              items: [
                {
                  title: SYSTEM_MESSAGES.SIDEBAR.MENU_PROFILE,
                  url: "/profile",
                },
                {
                  title: "Chấm công",
                  url: "/checkin",
                },
                {
                  title: SYSTEM_MESSAGES.SIDEBAR.MENU_EMP_MGMT,
                  url: "/hr-employees",
                },
                {
                  title: SYSTEM_MESSAGES.SIDEBAR.MENU_PAYROLL,
                  url: "/payroll",
                },
                {
                  title: SYSTEM_MESSAGES.SIDEBAR.MENU_MY_ASSETS,
                  url: "/my-assets",
                },
                {
                  title: SYSTEM_MESSAGES.SIDEBAR.MENU_ASSET_MGMT,
                  url: "/assets",
                },
                {
                  title: SYSTEM_MESSAGES.SIDEBAR.MENU_REQUEST,
                  url: "/request",
                },
                {
                  title:
                    SYSTEM_MESSAGES.SIDEBAR.MENU_ASSET_INCIDENT ||
                    "Quản lý sự cố tài sản",
                  url: "/asset-incidents",
                },
                {
                  title: "Thông báo nội bộ",
                  url: "/announcements",
                },
                {
                  title: "Duyệt báo cáo sự cố",
                  url: "/asset-reports",
                },
              ],
            },
          ]
          : [
            {
              title: SYSTEM_MESSAGES.SIDEBAR.EMPLOYEE_SECTION,
              url: "#",
              items: [
                {
                  title: SYSTEM_MESSAGES.SIDEBAR.MENU_PROFILE,
                  url: "/profile",
                },
                {
                  title: "Lịch sử lương",
                  url: "/salary-history",
                },
                {
                  title: "Chấm công",
                  url: "/checkin",
                },
                {
                  title: SYSTEM_MESSAGES.SIDEBAR.MENU_MEMBERS,
                  url: "/members",
                },
                {
                  title: SYSTEM_MESSAGES.SIDEBAR.MENU_REQUEST,
                  url: "/request",
                },

                {
                  title: SYSTEM_MESSAGES.SIDEBAR.MENU_MY_ASSETS,
                  url: "/my-assets",
                },
                {
                  title: "Thông báo nội bộ",
                  url: "/announcements",
                },
              ],
            },
          ];

  return (
    <Sidebar {...props} className="w-55">
      <SidebarHeader className="h-12 border-b px-2 justify-center">
        <VersionSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((subItem) => (
                  <SidebarMenuItem key={subItem.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === subItem.url}
                    >
                      <a
                        href={subItem.url}
                        className="flex w-full items-center gap-2"
                      >
                        <span className="flex-1 truncate text-left">
                          {subItem.title}
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

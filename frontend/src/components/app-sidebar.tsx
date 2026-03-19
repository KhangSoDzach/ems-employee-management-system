import * as React from "react"
import { useLocation } from "react-router-dom"
import { Settings } from "lucide-react"

import { VersionSwitcher } from "@/components/version-switcher"
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
} from "@/components/ui/sidebar"
import { SYSTEM_MESSAGES } from "@/constants/messages"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import SidebarSettings from "@/features/security/SecuritySettings"

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"]
}

export function AppSidebar({ role = "admin", ...props }: React.ComponentProps<typeof Sidebar> & { role?: "admin" | "employee" | "manager" | "hr" }) {
  const location = useLocation()
  const [settingsOpen, setSettingsOpen] = React.useState(false)



  const navMain =
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
        <VersionSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0] as string}
        />
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
                    <SidebarMenuButton asChild isActive={location.pathname === subItem.url}>
                      <a href={subItem.url} className="flex w-full items-center gap-2">
                        <span className="flex-1 truncate text-left">{subItem.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium h-10 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>{SYSTEM_MESSAGES.SIDEBAR.HEADER_TITLE === "Menu" ? "Cài đặt" : SYSTEM_MESSAGES.SIDEBAR.MORE}</span>
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent side="right" align="end" className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden w-72">
                <SidebarSettings />
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

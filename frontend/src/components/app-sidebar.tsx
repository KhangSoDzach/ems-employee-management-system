import * as React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { LogOut, Loader2 } from "lucide-react"

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
import { useAuth } from "@/contexts/AuthContext"
import { SYSTEM_MESSAGES } from "@/constants/messages"

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"]
}

export function AppSidebar({ role = "admin", ...props }: React.ComponentProps<typeof Sidebar> & { role?: "admin" | "employee" | "manager" | "hr" }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
      navigate("/login", { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const navMain =
    role === "admin"
      ? [
        {
          title: SYSTEM_MESSAGES.SIDEBAR.ADMIN_SECTION,
          url: "#",
          items: [
            {
              title: SYSTEM_MESSAGES.SIDEBAR.MENU_PROFILE,
              url: "/admin-profile",
            },
            {
              title: SYSTEM_MESSAGES.SIDEBAR.MENU_ASSET_MGMT,
              url: "/asset",
            },
            {
              title: SYSTEM_MESSAGES.SIDEBAR.MENU_ASSET_INCIDENT || "Quản lý sự cố tài sản",
              url: "/asset-incidents",
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
                url: "/manager-profile",
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
                title: SYSTEM_MESSAGES.SIDEBAR.MENU_PAYROLL,
                url: "/payroll",
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
                title: SYSTEM_MESSAGES.SIDEBAR.MENU_GROUP_ASSET,
                url: "/view-group-asset",
              },
              {
                title: SYSTEM_MESSAGES.SIDEBAR.MENU_MY_ASSETS,
                url: "/manager-my-assets",
              },
              {
                title: SYSTEM_MESSAGES.SIDEBAR.MENU_ASSET_INCIDENT,
                url: "/asset-incidents",
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
                  url: "/hr-profile",
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
                  url: "/hr-my-assets",
                },
                {
                  title: SYSTEM_MESSAGES.SIDEBAR.MENU_ASSET_MGMT,
                  url: "/hr-assets",
                },
                {
                  title: SYSTEM_MESSAGES.SIDEBAR.MENU_ASSET_INCIDENT || "Quản lý sự cố tài sản",
                  url: "/asset-incidents",
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
                  url: "/employee",
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
                  title: SYSTEM_MESSAGES.SIDEBAR.MENU_REQUEST_LEAVE,
                  url: "/request",
                },
                {
                  title: SYSTEM_MESSAGES.SIDEBAR.MENU_REQUEST_ADJ,
                  url: "/adjustment-requests",
                },
                {
                  title: SYSTEM_MESSAGES.SIDEBAR.MENU_MY_ASSETS,
                  url: "/my-assets",
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
            <SidebarMenuButton
              className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium disabled:opacity-60"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="animate-spin" />
              ) : (
                <LogOut />
              )}
              <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

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

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"]
}

export function AppSidebar({ role = "admin", ...props }: React.ComponentProps<typeof Sidebar> & { role?: "admin" | "employee" }) {
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

  const navMain = role === "admin" ? [
    {
      title: "Quản lý tài khoản",
      url: "#",
      items: [
        {
          title: "Quản lý nhân viên",
          url: "/admin",
        },

      ],
    },
  ] : [
    {
      title: "Thông tin cá nhân",
      url: "#",
      items: [
        {
          title: "Hồ sơ của tôi",
          url: "/employee",
        },
        {
          title: "Chấm công",
          url: "/checkin",
        },
        {
          title: "Tạo đơn nghỉ phép",
          url: "/request",
        },
      ],
    }
  ];
  return (
    <Sidebar {...props}>
      <SidebarHeader>
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
                      <a href={subItem.url}>{subItem.title}</a>
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

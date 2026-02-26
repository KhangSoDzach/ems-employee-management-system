import * as React from "react"
import { useLocation } from "react-router-dom"
import { LogOut } from "lucide-react"

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

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"]
}

export function AppSidebar({ role = "admin", ...props }: React.ComponentProps<typeof Sidebar> & { role?: "admin" | "employee" }) {
  const location = useLocation()

  const navMain = role === "admin" ? [
    {
      title: "Quản lý tài khoản",
      url: "#",
      items: [
        {
          title: "Quản lý nhân viên",
          url: "/dashboard",
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
            <SidebarMenuButton asChild className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium">
              <button>
                <LogOut />
                <span>{"Đăng xuất"}</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

import React, { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import ApproveLeaveDialog from "./ApproveLeaveModal"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

const ApproveLeaveRequest: React.FC = () => {
  const [open, setOpen] = useState(false)

  const data = [
    {
      name: "Nguyễn Văn A",
      dept: "Kỹ thuật",
      type: "annual",
      time: "01/10 - 03/10",
      reason: "Việc gia đình cá nhân cần xử lý gấp..."
    },
    {
      name: "Trần Thị B",
      dept: "Marketing",
      type: "sick",
      time: "05/10 - 05/10",
      reason: "Khám bệnh định kỳ tại bệnh viện..."
    },
    {
      name: "Lê Văn C",
      dept: "Kế toán",
      type: "unpaid",
      time: "10/10 - 12/10",
      reason: "Giải quyết việc riêng gia đình ở quê..."
    },
    {
      name: "Phạm Minh D",
      dept: "Nhân sự",
      type: "annual",
      time: "15/10 - 16/10",
      reason: "Đi du lịch cùng gia đình theo kế hoạch..."
    }
  ]

  const renderLeaveType = (type: string) => {
    switch (type) {
      case "annual":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Nghỉ phép năm</Badge>
      case "sick":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Nghỉ ốm</Badge>
      case "unpaid":
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Nghỉ không lương</Badge>
      default:
        return null
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar role="manager" variant="inset" />

      <SidebarInset>
        <SiteHeader />

        <main className="flex flex-1 flex-col p-8 gap-8 bg-background-light dark:bg-background-dark min-h-screen">

          <div className="max-w-6xl mx-auto w-full space-y-8">

            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                  Danh sách chờ duyệt
                </h1>
                <p className="text-slate-500">
                  Quản lý các yêu cầu nghỉ phép đang chờ xử lý từ các phòng ban.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline">Lọc kết quả</Button>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Xuất báo cáo
                </Button>
              </div>
            </div>

            {/* TABLE CARD */}
            <Card className="shadow-sm border">
              <CardContent className="p-0">

                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Nhân viên</TableHead>
                      <TableHead>Phòng ban</TableHead>
                      <TableHead>Loại nghỉ</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Lý do</TableHead>
                      <TableHead className="text-center">Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow key={index} className="hover:bg-muted/40 transition-colors">

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src="" />
                              <AvatarFallback>
                                {row.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">
                              {row.name}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {row.dept}
                        </TableCell>

                        <TableCell>
                          {renderLeaveType(row.type)}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {row.time}
                        </TableCell>

                        <TableCell className="max-w-[160px] truncate text-muted-foreground">
                          {row.reason}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200">
                            Chờ duyệt
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpen(true)}
                          >
                            Chi tiết
                          </Button>
                        </TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between p-6 border-t bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Hiển thị 4 trên 24 yêu cầu
                  </p>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">{"<"}</Button>
                    <Button size="icon" className="bg-orange-500 hover:bg-orange-600">1</Button>
                    <Button variant="ghost" size="icon">2</Button>
                    <Button variant="ghost" size="icon">3</Button>
                    <Button variant="outline" size="icon">{">"}</Button>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <Card className="shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <p className="text-muted-foreground">Tổng yêu cầu chờ</p>
                  <p className="text-3xl font-black">24</p>
                  <p className="text-sm text-orange-500">+3 so với hôm qua</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <p className="text-muted-foreground">Đã xử lý hôm nay</p>
                  <p className="text-3xl font-black">12</p>
                  <p className="text-sm text-emerald-600">Đạt 85% tiến độ</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <p className="text-muted-foreground">Nhân viên nghỉ</p>
                  <p className="text-3xl font-black">08</p>
                  <p className="text-sm text-blue-600">Trong tuần này</p>
                </CardContent>
              </Card>

            </div>

          </div>
        </main>
      </SidebarInset>

      <ApproveLeaveDialog
        open={open}
        onOpenChange={setOpen}
      />
    </SidebarProvider>
  )
}

export default ApproveLeaveRequest
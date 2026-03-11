import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SYSTEM_MESSAGES } from "@/constants/messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

const MOCK_MEMBERS = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    email: "nguyenvana@oneconnect.vn",
    role: "Frontend Developer",
    roleColor: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    skills: ["ReactJS", "UI/UX", "Tailwind"],
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCm4INhsyCANwKbMo9UdFQZNZBE0dohMQfaDIPpcBPNvyAiGsLfmA3ZsBMkDF4ElkFo4-vyGZyG58oRW7BBUQJQYptiSJTz6dUHlq9BJXURomDucD6VvRjqyan5Eex6H4uTdvdjTbI9tp62jGpaHYf1iQ11FSEc5VanKNX1DuRh09qCLWb9TaMtFGc4dKugYAmaIv8YbhH5J85V7zDpzyM66TBIwxwJmg2Z2COyZxGd29FlVHUchGI1oNVpMOtUIVdg-L_Br3y1L2aK",
  },
  {
    id: 2,
    name: "Trần Thị B",
    email: "tranthib@oneconnect.vn",
    role: "Backend Developer",
    roleColor: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    skills: ["Node.js", "SQL", "AWS"],
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBGk3ZluTur1vu8mw_ujSuSXGVT0PZ-_a3gezreTdvMNgFDUNeffoDBF3OKzhRFktUBUJ2wVPddDcSSstLtcDV8FhKvqwdrArdMSjoU6JY2Fn8yLugBVxYU9VlYXBY9fWLCK7QPvq-cNxsztu3qfVm7l3fqF_PMR4g4G-_znNNLl-Gqd2hLHdIj-jRHdzS7UJrD1Wek94oAaRXekD5CMzyjIbFPPexZHRCa6Po4aM-zCCWSeS0RlkfVrLuUKekigCIh9N15HBpCcU24",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "levanc@oneconnect.vn",
    role: "Project Manager",
    roleColor: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    skills: ["Agile", "Scrums", "Jira"],
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmqz1M3ypAEQuJOmIT6U9GAuhQIEDhl_U4B2IhBz_ROVSyDlrckcrwXODFov0d9Iq6QLPpBw8Z0_rEPhZvDPVrjBhJWiZgLaDgSGJNxTefaaQ5jt_rZeuTdGxJXo_TulUjOO3x9IZRea0_VDhcI4gKBJ2KwSfxd-M-X_MdKZ0JyFA697f22wzbE2rV0kEk3PhZBqwCh257L36PjOzjPPFKRzQTq4Ycm_VhanpM9XN0OKq6VFzi4q1SFdwGpa1RrdhY-l2rhYH2NBlo",
  },
  {
    id: 4,
    name: "Phạm Minh D",
    email: "phamminhd@oneconnect.vn",
    role: "UI Designer",
    roleColor: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    skills: ["Figma", "Adobe XD", "Prototyping"],
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDALCSUQnwu5oz4rcrRDEUtdQDZza-PTr_zq5EtTIbeJjJ43vgpFDlDU0jPoAWPYQZ39QejwwinYMMoc-QvKR4IqPZD77bg8YuVFoLQasa1JRqaKsf9mAodte0D1N92l33QlXbvWJ3DcM3ocofGRvke4vP8wPv0Lk4GoUGiwpaNdgKvuYEyEWFzbxhxsB8rpyuxP3R64Uk6I1XbawC8jmkqV71_9_7d9OnVP1A18DQbWho-NsbxWVWt59Lih0i8layri2BH4pHxNzUs",
  }
]

export default function MemberList() {
  const t = SYSTEM_MESSAGES.MEMBER_LIST

  return (
    <SidebarProvider>
      <AppSidebar role="manager" variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background min-h-screen">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="page-heading">{t.TITLE}</h1>
                <p className="text-muted-foreground mt-1">{t.DESC}</p>
              </div>
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={t.SEARCH_PLACEHOLDER}
                />
              </div>
            </div>

            {/* Table Card */}
            <div className="card-soft">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>{t.TABLE_NAME}</TableHead>
                    <TableHead>{t.TABLE_ROLE}</TableHead>
                    <TableHead>{t.TABLE_SKILLS}</TableHead>
                    <TableHead className="text-right">{t.TABLE_ACTIONS}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_MEMBERS.map((member) => (
                    <TableRow key={member.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`border-transparent ${member.roleColor}`}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {member.skills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="bg-[#e41b21] hover:bg-[#c9181d] text-white">
                          {t.BTN_EVALUATE}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-5 py-3 bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  {t.PAGINATION_SHOW} <span className="font-medium text-foreground">1-4</span> {t.PAGINATION_IN} <span className="font-medium text-foreground">24</span> {t.PAGINATION_MEMBERS}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" disabled>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button size="icon" className="bg-[#e41b21] hover:bg-[#c9181d] text-white w-8 h-8">1</Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8">2</Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8">3</Button>
                  <Button variant="outline" size="icon">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

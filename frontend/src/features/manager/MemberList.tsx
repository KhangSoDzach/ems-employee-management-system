import { Search, Bell, UserPlus, ChevronLeft, ChevronRight } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SYSTEM_MESSAGES } from "@/constants/messages"

const MOCK_MEMBERS = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    email: "nguyenvana@oneconnect.vn",
    role: "Frontend Developer",
    roleColor: "bg-blue-50 text-blue-700",
    skills: ["ReactJS", "UI/UX", "Tailwind"],
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCm4INhsyCANwKbMo9UdFQZNZBE0dohMQfaDIPpcBPNvyAiGsLfmA3ZsBMkDF4ElkFo4-vyGZyG58oRW7BBUQJQYptiSJTz6dUHlq9BJXURomDucD6VvRjqyan5Eex6H4uTdvdjTbI9tp62jGpaHYf1iQ11FSEc5VanKNX1DuRh09qCLWb9TaMtFGc4dKugYAmaIv8YbhH5J85V7zDpzyM66TBIwxwJmg2Z2COyZxGd29FlVHUchGI1oNVpMOtUIVdg-L_Br3y1L2aK",
  },
  {
    id: 2,
    name: "Trần Thị B",
    email: "tranthib@oneconnect.vn",
    role: "Backend Developer",
    roleColor: "bg-purple-50 text-purple-700",
    skills: ["Node.js", "SQL", "AWS"],
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBGk3ZluTur1vu8mw_ujSuSXGVT0PZ-_a3gezreTdvMNgFDUNeffoDBF3OKzhRFktUBUJ2wVPddDcSSstLtcDV8FhKvqwdrArdMSjoU6JY2Fn8yLugBVxYU9VlYXBY9fWLCK7QPvq-cNxsztu3qfVm7l3fqF_PMR4g4G-_znNNLl-Gqd2hLHdIj-jRHdzS7UJrD1Wek94oAaRXekD5CMzyjIbFPPexZHRCa6Po4aM-zCCWSeS0RlkfVrLuUKekigCIh9N15HBpCcU24",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "levanc@oneconnect.vn",
    role: "Project Manager",
    roleColor: "bg-green-50 text-green-700",
    skills: ["Agile", "Scrums", "Jira"],
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmqz1M3ypAEQuJOmIT6U9GAuhQIEDhl_U4B2IhBz_ROVSyDlrckcrwXODFov0d9Iq6QLPpBw8Z0_rEPhZvDPVrjBhJWiZgLaDgSGJNxTefaaQ5jt_rZeuTdGxJXo_TulUjOO3x9IZRea0_VDhcI4gKBJ2KwSfxd-M-X_MdKZ0JyFA697f22wzbE2rV0kEk3PhZBqwCh257L36PjOzjPPFKRzQTq4Ycm_VhanpM9XN0OKq6VFzi4q1SFdwGpa1RrdhY-l2rhYH2NBlo",
  },
  {
    id: 4,
    name: "Phạm Minh D",
    email: "phamminhd@oneconnect.vn",
    role: "UI Designer",
    roleColor: "bg-amber-50 text-amber-700",
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
        
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-h-screen">
          

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{t.TITLE}</h1>
                  <p className="text-slate-500 mt-1">{t.DESC}</p>
                </div>
               <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" 
                placeholder={t.SEARCH_PLACEHOLDER} 
                type="text"
              />
            </div>
              </div>

              {/* Table Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.TABLE_NAME}</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.TABLE_ROLE}</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.TABLE_SKILLS}</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">{t.TABLE_ACTIONS}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {MOCK_MEMBERS.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              {/* <img 
                                src={member.avatar} 
                                alt={member.name} 
                                className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 object-cover"
                              /> */}
                              <div>
                                <p className="font-semibold text-slate-900">{member.name}</p>
                                <p className="text-sm text-slate-500">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.roleColor}`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {member.skills.map((skill, idx) => (
                                <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="bg-[#e41b21] hover:bg-[#c9181d] text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
                              {t.BTN_EVALUATE}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    {t.PAGINATION_SHOW} <span className="font-medium text-slate-900">1-4</span> {t.PAGINATION_IN} <span className="font-medium text-slate-900">24</span> {t.PAGINATION_MEMBERS}
                  </p>
                  <div className="flex items-center gap-2">
                    <button className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center bg-[#e41b21] text-white rounded-lg text-sm font-bold">1</button>
                    <button className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg text-sm transition">2</button>
                    <button className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg text-sm transition">3</button>
                    <button className="p-2 border border-slate-300 rounded-lg hover:bg-white transition">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

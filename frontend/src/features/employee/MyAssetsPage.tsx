import { useState, useEffect, useCallback, useRef } from "react"
import { AlertTriangle, FileText, Laptop, Monitor, Mouse, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { assetService, MyAsset, IncidentReportRow } from "@/services/assetService"

/* ─────────────── CONSTANTS ─────────────── */

import { SYSTEM_MESSAGES } from "@/constants/messages"

const INCIDENT_TYPES = [
    { value: "Hardware Malfunction", label: "Lỗi phần cứng (Hardware Malfunction)" },
    { value: "Screen Flickering", label: "Màn hình nhấp nháy (Screen Flickering)" },
    { value: "Battery Issue", label: "Lỗi pin (Battery Issue)" },
    { value: "Peripheral Not Working", label: "Thiết bị ngoại vi hỏng (Peripheral Not Working)" },
    { value: "Software / OS Issue", label: "Lỗi phần mềm / HĐH (Software / OS Issue)" },
    { value: "Other", label: "Khác (Other)" },
]

/* ─────────────── ASSET CARD ─────────────── */

function AssetCard({ asset, onReportIssue }: { asset: MyAsset; onReportIssue: (asset: MyAsset) => void }) {
    const isLaptop = asset.assetType?.toLowerCase().includes("laptop")
    const isMonitor = asset.assetType?.toLowerCase().includes("monitor")
    const Icon = isLaptop ? Laptop : (isMonitor ? Monitor : Mouse)

    return (
        <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden flex flex-col">
            {/* Icon area */}
            <div className="h-36 bg-muted/40 flex items-center justify-center relative">
                <Icon className="w-14 h-14 text-muted-foreground/50 stroke-[1.3]" />
                {asset.imageUrl && (
                    <img
                        src={asset.imageUrl}
                        alt={asset.name}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                )}
            </div>

            {/* Info area */}
            <div className="p-4 flex flex-col gap-3 flex-1">
                <div>
                    <p className="font-semibold text-foreground text-sm leading-tight">{asset.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Asset Tag: {asset.tag}</p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 gap-1.5 text-xs font-semibold text-red-500 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-600 mt-auto"
                    onClick={() => onReportIssue(asset)}
                >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {SYSTEM_MESSAGES.MY_ASSETS.BTN_REPORT}
                </Button>
            </div>
        </div>
    )
}

/* ─────────────── MAIN PAGE ─────────────── */

export default function MyAssetsPage({ sidebarRole = "employee" }: { sidebarRole?: "employee" | "manager" | "hr" | "admin" }) {
    const [assets, setAssets] = useState<MyAsset[]>([])
    const [reports, setReports] = useState<IncidentReportRow[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [selectedAsset, setSelectedAsset] = useState<MyAsset | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [incidentType, setIncidentType] = useState("")
    const [description, setDescription] = useState("")
    const [attachment, setAttachment] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [showAll, setShowAll] = useState(false)
    const PREVIEW_COUNT = 3
    const displayedReports = showAll ? reports : reports.slice(0, PREVIEW_COUNT)

    const fetchContent = useCallback(async () => {
        try {
            const [assetList, reportList] = await Promise.all([
                assetService.getMyAssets(),
                assetService.getMyReports(0, 50)
            ])
            setAssets(assetList)
            setReports(reportList.content)
        } catch (error) {
            toast.error(SYSTEM_MESSAGES.API_ERROR)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchContent()
    }, [fetchContent])

    const handleReportIssue = (asset: MyAsset) => {
        setSelectedAsset(asset)
        setIncidentType("")
        setDescription("")
        setAttachment(null)
        setDialogOpen(true)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File quá lớn. Vui lòng chọn file dưới 5MB.")
                return
            }
            setAttachment(file)
        }
    }

    const handleSubmit = async () => {
        if (!selectedAsset) return
        if (!incidentType) {
            toast.warning("Vui lòng chọn loại sự cố")
            return
        }
        if (!description || description.length < 10) {
            toast.warning("Vui lòng nhập mô tả chi tiết (tối thiểu 10 ký tự)")
            return
        }

        setSubmitting(true)
        try {
            await assetService.submitReport(selectedAsset.id, {
                incidentType,
                description
            }, attachment || undefined)

            toast.success("Báo cáo thành công", {
                description: "Báo cáo của bạn đã được gửi tới HR để xử lý."
            })
            setDialogOpen(false)
            fetchContent()
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error("Gửi báo cáo thất bại", {
                description: err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại sau."
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <SidebarProvider>
            <AppSidebar role={sidebarRole === "admin" ? "admin" : (sidebarRole === "hr" ? "hr" : (sidebarRole === "manager" ? "manager" : "employee"))} variant="inset" />
            <SidebarInset>
                <SiteHeader />

                <main className="flex-1 space-y-8 p-4 md:p-8 pt-6 bg-background min-h-screen">

                    {/* ── Page Header ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-muted-foreground text-sm">Tài sản</span>
                            <span className="text-muted-foreground text-sm">/</span>
                            <span className="text-sm font-semibold text-foreground">{SYSTEM_MESSAGES.MY_ASSETS.TITLE}</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{SYSTEM_MESSAGES.MY_ASSETS.TITLE}</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Vui lòng quản lý và báo cáo sự cố với thiết bị được cấp phát của bạn.
                        </p>
                    </div>

                    {/* ── Assigned Equipment ── */}
                    <section>
                        <h2 className="text-base font-bold text-foreground mb-4">{SYSTEM_MESSAGES.MY_ASSETS.SECTION_EQUIPMENT}</h2>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-64 rounded-xl border border-border animate-pulse bg-muted/20" />
                                ))}
                            </div>
                        ) : assets.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {assets.map((asset) => (
                                    <AssetCard key={asset.id} asset={asset} onReportIssue={handleReportIssue} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 bg-muted/10 rounded-xl border border-dashed border-border text-center">
                                <Laptop className="w-10 h-10 text-muted-foreground/30 mb-3" />
                                <p className="text-sm font-medium text-foreground">{SYSTEM_MESSAGES.COMMON_EN.NO_DATA}</p>
                            </div>
                        )}
                    </section>

                    {/* ── Recent Reports ── */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-foreground">{SYSTEM_MESSAGES.MY_ASSETS.SECTION_REPORTS}</h2>
                        </div>

                        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                                        <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mã báo cáo</TableHead>
                                        <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tài sản</TableHead>
                                        <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Loại lỗi</TableHead>
                                        <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ngày báo</TableHead>
                                        <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trạng thái</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : displayedReports.length > 0 ? (
                                        displayedReports.map((report) => (
                                            <TableRow key={report.id} className="hover:bg-muted/20 transition-colors border-border">
                                                <TableCell className="px-5 py-3 text-sm font-medium text-blue-600 cursor-pointer hover:underline">#{report.reportId}</TableCell>
                                                <TableCell className="px-5 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-foreground font-medium">{report.asset}</span>
                                                        <span className="text-[11px] text-muted-foreground">{report.assetTag}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-5 py-3 text-sm text-muted-foreground">{report.issueType}</TableCell>
                                                <TableCell className="px-5 py-3 text-sm text-muted-foreground">{report.dateReported}</TableCell>
                                                <TableCell className="px-5 py-3">
                                                    <Badge className={report.statusColor ? report.statusColor : "bg-gray-100 text-gray-700"}>
                                                        {report.statusLabel || report.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                                                {SYSTEM_MESSAGES.COMMON_EN.NO_DATA}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {/* Footer toggle */}
                            {reports.length > PREVIEW_COUNT && (
                                <div className="border-t border-border px-5 py-2.5 flex items-center justify-between text-xs text-muted-foreground bg-muted/10">
                                    <span>
                                        {showAll
                                            ? `Đang hiển thị toàn bộ ${reports.length} báo cáo`
                                            : `Đang hiển thị ${PREVIEW_COUNT} trên tổng số ${reports.length} báo cáo`}
                                    </span>
                                    <button
                                        className="text-blue-600 font-medium hover:underline"
                                        onClick={() => setShowAll((v) => !v)}
                                    >
                                        {showAll ? "Thu gọn" : `Xem tất cả (${reports.length})`}
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </SidebarInset>

            {/* ── Report Asset Issue Dialog ── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 gap-0 rounded-xl overflow-hidden">
                    <div className="px-6 pt-6 pb-4 border-b border-border">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-foreground">
                                {SYSTEM_MESSAGES.MY_ASSETS.REPORT_TITLE}{selectedAsset ? ` — ${selectedAsset.name}` : ""}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                                Vui lòng cung cấp chi tiết về sự cố tài sản để giúp chúng tôi xử lý nhanh chóng.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="px-6 py-5 space-y-5">
                        {/* Incident Type */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Loại sự cố</label>
                            <Select value={incidentType} onValueChange={setIncidentType}>
                                <SelectTrigger className="w-full h-9 text-sm">
                                    <SelectValue placeholder={SYSTEM_MESSAGES.MY_ASSETS.PLACEHOLDER_INCIDENT} />
                                </SelectTrigger>
                                <SelectContent>
                                    {INCIDENT_TYPES.map((t) => (
                                        <SelectItem key={t.value} value={t.value} className="text-sm">{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground">Mô tả chi tiết</label>
                                <span className="text-xs text-muted-foreground">Bắt buộc</span>
                            </div>
                            <Textarea
                                placeholder={SYSTEM_MESSAGES.MY_ASSETS.PLACEHOLDER_DESC}
                                className="resize-none h-28 text-sm"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* Upload Evidence */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Đính kèm bằng chứng</label>
                            <div className="flex items-center gap-3 border border-border rounded-lg px-4 py-3 bg-muted/10">
                                <FileText className="w-8 h-8 text-muted-foreground/50 shrink-0" />
                                <div className="flex flex-col flex-1 min-w-0">
                                    {attachment ? (
                                        <>
                                            <span className="text-sm font-medium text-foreground truncate">{attachment.name}</span>
                                            <span className="text-[11px] text-muted-foreground">{(attachment.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-sm font-medium text-foreground">Chưa có tệp nào</span>
                                            <span className="text-[11px] text-muted-foreground">Tối đa 5MB (JPG, PNG, PDF)</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {attachment && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setAttachment(null)}>
                                            <XCircle className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs font-medium" onClick={() => fileInputRef.current?.click()}>
                                        Chọn tệp
                                    </Button>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".jpg,.jpeg,.png,.pdf"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-border flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 h-9 font-medium"
                            onClick={() => setDialogOpen(false)}
                            disabled={submitting}
                        >
                            {SYSTEM_MESSAGES.BTN_CANCEL}
                        </Button>
                        <Button
                            className="flex-1 h-9 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {SYSTEM_MESSAGES.BTN_SUBMIT}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    )
}


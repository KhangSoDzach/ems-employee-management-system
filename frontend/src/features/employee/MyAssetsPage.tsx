import { useState, useEffect, useCallback, useRef } from "react"
import { AlertTriangle, FileText, Laptop, Monitor, Mouse, XCircle, Calendar, ChevronRight, Upload, Loader2, CheckCircle2 } from "lucide-react"
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

const INCIDENT_TYPES = [
    { value: "DAMAGED", label: "Hư hỏng (Damaged)" },
    { value: "LOST", label: "Mất mát (Lost)" },
]

/* ─────────────── ASSET CARD ─────────────── */

function AssetCard({ asset, onReportIssue }: { asset: MyAsset; onReportIssue: (asset: MyAsset) => void }) {
    const isLaptop = asset.assetType?.toLowerCase().includes("laptop")
    const isMonitor = asset.assetType?.toLowerCase().includes("monitor")
    const Icon = isLaptop ? Laptop : (isMonitor ? Monitor : Mouse)

    return (
        <div className="group rounded-xl border border-border bg-card hover:border-blue-500/50 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
            {/* Icon area */}
            <div className="h-40 bg-muted/30 flex items-center justify-center relative overflow-hidden text-muted-foreground/40 group-hover:text-blue-500/30">
                <Icon className="w-16 h-16 stroke-[1] group-hover:scale-110 transition-transform duration-500" />
                {asset.imageUrl && (
                    <img
                        src={asset.imageUrl}
                        alt={asset.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                )}
            </div>

            {/* Info area */}
            <div className="p-5 flex flex-col gap-4 flex-1">
                <div>
                    <h3 className="font-bold text-foreground text-base tracking-tight leading-tight line-clamp-1">{asset.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground font-medium uppercase tracking-widest">
                        <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 h-4 uppercase tracking-tighter bg-muted/50 border-none">
                            {asset.tag}
                        </Badge>
                        <span>{asset.assetType}</span>
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-9 gap-2 text-xs font-bold text-rose-500 border-rose-100 bg-rose-50/30 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-[0.98]"
                    onClick={() => onReportIssue(asset)}
                >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Report Issue
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

    const fetchContent = useCallback(async () => {
        try {
            const [assetList, reportList] = await Promise.all([
                assetService.getMyAssets(),
                assetService.getMyReports(0, 50)
            ])
            setAssets(assetList)
            setReports(reportList.content)
        } catch (error) {
            toast.error("Lỗi khi tải dữ liệu")
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
                description: "Báo cáo của bạn đã được gửi tới HR để xử lý.",
                icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            })
            setDialogOpen(false)
            fetchContent()
        } catch (error: any) {
            toast.error("Gửi báo cáo thất bại", {
                description: error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại sau."
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

                <main className="flex-1 space-y-10 p-4 md:p-8 pt-6 bg-[#fafafa] min-h-screen">

                    {/* ── Page Header ── */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground/80">
                                <span>Trang quản lý</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                                <span className="text-foreground/90 font-bold uppercase tracking-widest text-[11px]">Tài sản của tôi</span>
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">My Equipment</h1>
                            <p className="text-slate-500 font-medium max-w-2xl text-sm">
                                Dưới đây là các tài sản công ty đã cấp phát cho bạn. Hãy giữ gìn cẩn thận và báo cáo ngay nếu có sự cố xảy ra.
                            </p>
                        </div>
                    </div>

                    {/* ── Assigned Equipment ── */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]" />
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Cấp phát hiện có</h2>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-72 rounded-xl border border-border animate-pulse bg-slate-100" />
                                ))}
                            </div>
                        ) : assets.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {assets.map((asset) => (
                                    <AssetCard key={asset.id} asset={asset} onReportIssue={handleReportIssue} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                                    <Laptop className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900">Không có tài sản nào</h3>
                                <p className="text-slate-500 mt-1 max-w-xs text-sm">Bạn chưa được cấp phát tài sản nào từ đơn vị trang thiết bị.</p>
                            </div>
                        )}
                    </section>

                    {/* ── Recent Reports ── */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Lịch sử báo cáo sự cố</h2>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-100">
                                        <TableHead className="h-12 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Mã báo cáo</TableHead>
                                        <TableHead className="h-12 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Tài sản</TableHead>
                                        <TableHead className="h-12 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Loại lỗi</TableHead>
                                        <TableHead className="h-12 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ngày báo</TableHead>
                                        <TableHead className="h-12 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Trạng thái</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.length > 0 ? (
                                        reports.map((report) => (
                                            <TableRow key={report.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 group">
                                                <TableCell className="px-6 py-4 font-bold text-blue-600 text-[13px] group-hover:underline cursor-pointer">#{report.reportId}</TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 text-[13px]">{report.asset}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tighter uppercase">{report.assetTag}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-[13px] font-bold text-slate-600">{report.issueType}</TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px] uppercase">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        {report.dateReported}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <Badge className={`${report.statusColor} border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm`}>
                                                            {report.statusLabel}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-48 text-center">
                                                {loading ? (
                                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <FileText className="w-10 h-10 text-slate-200" />
                                                        <span className="text-slate-400 font-medium">Chưa có báo cáo nào được ghi nhận.</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </section>
                </main>
            </SidebarInset>

            {/* ── Report Asset Issue Dialog ── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[520px] p-0 gap-0 rounded-[2rem] overflow-hidden border-none shadow-2xl">
                    <div className="px-8 pt-8 pb-7 bg-gradient-to-br from-slate-900 to-black text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <AlertTriangle className="w-24 h-24 stroke-[1]" />
                        </div>
                        <DialogHeader className="relative z-10">
                            <div className="w-14 h-14 bg-rose-500/20 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-rose-500/50 backdrop-blur-md">
                                <AlertTriangle className="w-7 h-7 text-rose-400" />
                            </div>
                            <DialogTitle className="text-3xl font-black tracking-tight leading-none mb-2">
                                Report Issue
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 font-bold text-[13px] uppercase tracking-widest">
                                {selectedAsset ? `${selectedAsset.name} • ${selectedAsset.tag}` : "Mô tả sự cố của bạn"}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="px-8 py-8 space-y-8 bg-white">
                        {/* Incident Type */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                Loại sự cố
                            </label>
                            <Select value={incidentType} onValueChange={setIncidentType}>
                                <SelectTrigger className="w-full h-12 text-sm border-slate-200 focus:ring-blue-600/20 rounded-2xl transition-all font-bold text-slate-800 bg-slate-50/50 border-2">
                                    <SelectValue placeholder="Chọn loại sự cố..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                                    {INCIDENT_TYPES.map((t) => (
                                        <SelectItem key={t.value} value={t.value} className="rounded-xl py-3 font-bold text-slate-700 focus:bg-blue-50 focus:text-blue-600 transition-colors uppercase text-[11px] tracking-widest">{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                    Mô tả chi tiết
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Min 10 chars</span>
                                    <Badge className="text-[9px] font-black bg-rose-500 hover:bg-rose-500 text-white border-none px-2 rounded-full uppercase tracking-tighter">Required</Badge>
                                </div>
                            </div>
                            <Textarea
                                placeholder="Mô tả cụ thể vấn đề: Thời điểm xảy ra, nguyên nhân, tình trạng hiện tại..."
                                className="resize-none h-36 text-sm border-slate-200 focus:ring-blue-600/20 rounded-2xl transition-all font-bold text-slate-800 placeholder:text-slate-300 bg-slate-50/50 border-2 leading-relaxed"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* Upload Evidence */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                Hình ảnh minh chứng
                            </label>

                            <div
                                className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 transition-all duration-500 cursor-pointer ${attachment ? "border-emerald-500 bg-emerald-50/30 scale-[1.02]" : "border-slate-200 hover:border-blue-500/50 hover:bg-slate-50 hover:scale-[1.01]"}`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".jpg,.jpeg,.png,.pdf"
                                />

                                {attachment ? (
                                    <>
                                        <div className="w-16 h-16 bg-emerald-500/20 rounded-[1.25rem] flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                                            <FileText className="w-8 h-8 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-black text-slate-900 line-clamp-1">{attachment.name}</span>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                {(attachment.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ready to upload</span>
                                        </div>
                                        <button
                                            className="absolute top-4 right-4 p-2 hover:bg-rose-500 hover:text-white bg-white shadow-md rounded-full transition-all text-slate-400 hover:rotate-90"
                                            onClick={(e) => { e.stopPropagation(); setAttachment(null); }}
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-slate-100 rounded-[1.25rem] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:shadow-2xl group-hover:shadow-blue-600/40 transition-all duration-500 shadow-inner">
                                            <Upload className="w-8 h-8 text-slate-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <p className="text-sm font-black text-slate-700 group-hover:text-blue-600 transition-colors uppercase tracking-widest">Click to upload file</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">JPG, PNG, PDF (Max 5MB)</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-8 py-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                        <Button
                            variant="ghost"
                            className="flex-1 h-14 font-black uppercase tracking-[0.2em] text-[11px] text-slate-500 hover:text-slate-900 rounded-2xl hover:bg-slate-100"
                            onClick={() => setDialogOpen(false)}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            className="flex-[2] h-14 font-black uppercase tracking-[0.2em] text-[11px] bg-blue-600 hover:bg-black text-white shadow-2xl shadow-blue-600/30 active:scale-[0.98] transition-all rounded-2xl gap-3"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {submitting ? "Processing..." : "Submit Report"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    )
}

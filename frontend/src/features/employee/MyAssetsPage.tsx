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
import { useEffectiveRole } from "@/hooks/useEffectiveRole"

/* ─────────────── CONSTANTS ─────────────── */

import { SYSTEM_MESSAGES } from "@/constants/messages"

const INCIDENT_TYPES = [
    { value: "DAMAGED", label: "Hư hỏng / Lỗi thiết bị (Damaged)" },
        { value: "LOST",    label: "Mất mát / Thất lạc (Lost/Stolen)" },
]

/* ─────────────── ASSET CARD ─────────────── */

function AssetCard({ asset, onReportIssue }: Readonly<{ asset: MyAsset; onReportIssue: (asset: MyAsset) => void }>) {
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
                    <p className="text-[11px] text-muted-foreground mt-0.5">{SYSTEM_MESSAGES.MY_ASSETS.LABEL_ASSET_TAG}{SYSTEM_MESSAGES.SYMBOLS.COLON}{asset.tag}</p>
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

export default function MyAssetsPage() {
    const effectiveRole = useEffectiveRole()
    const [assets, setAssets] = useState<MyAsset[]>([])
    const [reports, setReports] = useState<IncidentReportRow[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [selectedAsset, setSelectedAsset] = useState<MyAsset | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [incidentType, setIncidentType] = useState("")
    const [description, setDescription] = useState("")
    const [attachment, setAttachment] = useState<File | null>(null)
    const [errors, setErrors] = useState<{ incidentType?: string, description?: string }>({})
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
        setErrors({})
        setDialogOpen(true)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0]
            if (file.size > 5 * 1024 * 1024) {
                toast.error(SYSTEM_MESSAGES.MY_ASSETS.MAX_FILE_SIZE_ERROR)
                return
            }
            setAttachment(file)
        }
    }

    const handleSubmit = async () => {
        if (!selectedAsset) return

        const newErrors: { incidentType?: string, description?: string } = {}
        if (!incidentType) newErrors.incidentType = SYSTEM_MESSAGES.MY_ASSETS.TOAST_SELECT_TYPE
        if (!description || description.trim().length < 10) newErrors.description = SYSTEM_MESSAGES.MY_ASSETS.TOAST_DESC_MIN

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            toast.error("Vui lòng điền đầy đủ thông tin bắt buộc")
            return
        }

        setErrors({})
        setSubmitting(true)
        try {
            await assetService.submitReport(selectedAsset.id, {
                incidentType,
                description
            }, attachment || undefined)

            toast.success(SYSTEM_MESSAGES.MY_ASSETS.TOAST_SUCCESS, {
                description: SYSTEM_MESSAGES.MY_ASSETS.TOAST_SUCCESS_DESC
            })
            setDialogOpen(false)
            fetchContent()
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(SYSTEM_MESSAGES.MY_ASSETS.TOAST_FAILED, {
                description: err.response?.data?.message || SYSTEM_MESSAGES.MY_ASSETS.TOAST_ERROR_DEFAULT
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <SidebarProvider>
            <AppSidebar role={effectiveRole} variant="inset" />
            <SidebarInset>
                <SiteHeader />

                <main className="flex-1 space-y-8 p-4 md:p-8 pt-6 bg-background min-h-screen">

                    {/* ── Page Header ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-muted-foreground text-sm">{SYSTEM_MESSAGES.MY_ASSETS.BREADCRUMB}</span>
                            <span className="text-muted-foreground text-sm">{SYSTEM_MESSAGES.SYMBOLS.SLASH}</span>
                            <span className="text-sm font-semibold text-foreground">{SYSTEM_MESSAGES.MY_ASSETS.TITLE}</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{SYSTEM_MESSAGES.MY_ASSETS.TITLE}</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {SYSTEM_MESSAGES.MY_ASSETS.DESCRIPTION}
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
                                        <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{SYSTEM_MESSAGES.MY_ASSETS.TABLE_ID}</TableHead>
                                        <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{SYSTEM_MESSAGES.ASSET.TABLE_NAME}</TableHead>
                                        <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{SYSTEM_MESSAGES.MY_ASSETS.TABLE_INCIDENT}</TableHead>
                                        <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{SYSTEM_MESSAGES.MY_ASSETS.TABLE_DATE}</TableHead>
                                        <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{SYSTEM_MESSAGES.LABEL_STATUS}</TableHead>
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
                                                <TableCell className="px-5 py-3 text-sm font-medium text-blue-600 cursor-pointer hover:underline">{SYSTEM_MESSAGES.SYMBOLS.HASH}{report.reportId}</TableCell>
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
                                        {showAll
                                            ? SYSTEM_MESSAGES.BTN_CLOSE
                                            : `${SYSTEM_MESSAGES.BTN_ADD}${SYSTEM_MESSAGES.SYMBOLS.SPACE}${SYSTEM_MESSAGES.SYMBOLS.PAREN_OPEN}${reports.length}${SYSTEM_MESSAGES.SYMBOLS.PAREN_CLOSE}`}
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
                                {SYSTEM_MESSAGES.MY_ASSETS.REPORT_TITLE}{selectedAsset ? `${SYSTEM_MESSAGES.SYMBOLS.DASH}${selectedAsset.name}` : ""}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                                {SYSTEM_MESSAGES.MY_ASSETS.REPORT_DESC}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="px-6 py-5 space-y-5">
                        {/* Incident Type */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">
                                {SYSTEM_MESSAGES.MY_ASSETS.LABEL_INCIDENT} <span className="text-red-500">*</span>
                            </label>
                            <Select value={incidentType} onValueChange={(val) => { setIncidentType(val); setErrors(prev => ({ ...prev, incidentType: undefined })) }}>
                                <SelectTrigger className={`w-full h-9 text-sm ${errors.incidentType ? "border-red-500 focus:ring-red-500" : ""}`}>
                                    <SelectValue placeholder={SYSTEM_MESSAGES.MY_ASSETS.PLACEHOLDER_INCIDENT} />
                                </SelectTrigger>
                                <SelectContent>
                                    {INCIDENT_TYPES.map((t) => (
                                        <SelectItem key={t.value} value={t.value} className="text-sm">{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.incidentType && <p className="text-red-500 text-xs mt-1">{errors.incidentType}</p>}
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground">
                                    {SYSTEM_MESSAGES.MY_ASSETS.LABEL_DESC} <span className="text-red-500">*</span>
                                </label>
                                <span className={errors.description ? "text-xs text-red-500" : "text-xs text-muted-foreground"}>{SYSTEM_MESSAGES.MY_ASSETS.LABEL_REQUIRED}</span>
                            </div>
                            <Textarea
                                placeholder={SYSTEM_MESSAGES.MY_ASSETS.PLACEHOLDER_DESC}
                                className={`resize-none h-28 text-sm ${errors.description ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                value={description}
                                onChange={(e) => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: undefined })) }}
                            />
                            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                        </div>

                        {/* Upload Evidence */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">{SYSTEM_MESSAGES.MY_ASSETS.LABEL_ATTACHMENT}</label>
                            <div className="flex items-center gap-3 border border-border rounded-lg px-4 py-3 bg-muted/10">
                                <FileText className="w-8 h-8 text-muted-foreground/50 shrink-0" />
                                <div className="flex flex-col flex-1 min-w-0">
                                    {attachment ? (
                                        <>
                                            <span className="text-sm font-medium text-foreground truncate">{attachment.name}</span>
                                            <span className="text-[11px] text-muted-foreground">{(attachment.size / 1024 / 1024).toFixed(2)}{SYSTEM_MESSAGES.SYMBOLS.SPACE}{SYSTEM_MESSAGES.MY_ASSETS.UNIT_MB}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-sm font-medium text-foreground">{SYSTEM_MESSAGES.MY_ASSETS.NO_FILE}</span>
                                            <span className="text-[11px] text-muted-foreground">{SYSTEM_MESSAGES.MY_ASSETS.FILE_LIMIT}</span>
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
                                        {SYSTEM_MESSAGES.MY_ASSETS.BTN_CHOOSE_FILE}
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


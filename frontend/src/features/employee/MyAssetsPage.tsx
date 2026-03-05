import { useState } from "react"
import { AlertTriangle, FileText, Laptop, Monitor, Mouse, XCircle } from "lucide-react"
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

/* ─────────────── MOCK DATA ─────────────── */

type AssetStatus = "PENDING" | "APPROVED" | "REJECTED"

interface Asset {
    id: string
    name: string
    tag: string
    icon: React.ElementType
}

interface Report {
    id: string
    asset: string
    issueType: string
    dateReported: string
    status: AssetStatus
}

const assignedAssets: Asset[] = [
    { id: "1", name: "MacBook Pro 16\"", tag: "AST-10042", icon: Laptop },
    { id: "2", name: "Dell UltraSharp 27\"", tag: "AST-10087", icon: Monitor },
    { id: "3", name: "Logitech MX Master 3", tag: "AST-10112", icon: Mouse },
]

const recentReports: Report[] = [
    { id: "REP-2025-089", asset: "Dell UltraSharp 27\"", issueType: "Screen Flickering", dateReported: "Oct 26, 2025", status: "PENDING" },
    { id: "REP-2025-042", asset: "MacBook Pro 16\"", issueType: "Battery not holding charge", dateReported: "Sep 12, 2025", status: "APPROVED" },
    { id: "REP-2025-015", asset: "Logitech MX Master 3", issueType: "Scroll wheel sticky", dateReported: "Jul 05, 2025", status: "REJECTED" },
    { id: "REP-2025-008", asset: "MacBook Pro 16\"", issueType: "Keyboard key stuck", dateReported: "May 18, 2025", status: "APPROVED" },
    { id: "REP-2024-231", asset: "Dell UltraSharp 27\"", issueType: "Dead pixel on display", dateReported: "Dec 02, 2024", status: "APPROVED" },
    { id: "REP-2024-198", asset: "Logitech MX Master 3", issueType: "Bluetooth disconnecting", dateReported: "Oct 15, 2024", status: "REJECTED" },
]

const INCIDENT_TYPES = [
    "Hardware Malfunction",
    "Screen Flickering",
    "Battery Issue",
    "Peripheral Not Working",
    "Software / OS Issue",
    "Other",
]

/* ─────────────── STATUS BADGE ─────────────── */

const STATUS_CONFIG: Record<AssetStatus, { label: string; className: string }> = {
    PENDING: {
        label: "Pending",
        className: "bg-amber-50 text-amber-600 border border-amber-300 hover:bg-amber-50",
    },
    APPROVED: {
        label: "Approved",
        className: "bg-emerald-50 text-emerald-600 border border-emerald-300 hover:bg-emerald-50",
    },
    REJECTED: {
        label: "Rejected",
        className: "bg-red-50 text-red-600 border border-red-300 hover:bg-red-50",
    },
}

/* ─────────────── ASSET CARD ─────────────── */

function AssetCard({ asset, onReportIssue }: { asset: Asset; onReportIssue: (asset: Asset) => void }) {
    const Icon = asset.icon
    return (
        <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden flex flex-col">
            {/* Icon area */}
            <div className="h-36 bg-muted/40 flex items-center justify-center">
                <Icon className="w-14 h-14 text-muted-foreground/50 stroke-[1.3]" />
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
                    className="w-full h-8 gap-1.5 text-xs font-semibold text-red-500 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-600"
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

export default function MyAssetsPage({ sidebarRole = "employee" }: { sidebarRole?: "employee" | "manager" | "hr" }) {
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [incidentType, setIncidentType] = useState("")
    const [description, setDescription] = useState("")
    const [showAll, setShowAll] = useState(false)

    const PREVIEW_COUNT = 3
    const displayedReports = showAll ? recentReports : recentReports.slice(0, PREVIEW_COUNT)

    const handleReportIssue = (asset: Asset) => {
        setSelectedAsset(asset)
        setIncidentType("")
        setDescription("")
        setDialogOpen(true)
    }

    const handleSubmit = () => {
        setDialogOpen(false)
        // Simulate forbidden 403 toast
        setTimeout(() => {
            toast.error("Forbidden", {
                description: "You do not have permission to perform this action.",
                icon: <XCircle className="w-5 h-5 text-red-500" />,
                style: { borderColor: "#fca5a5" },
            })
        }, 200)
    }

    return (
        <SidebarProvider>
            <AppSidebar role={sidebarRole} variant="inset" />
            <SidebarInset>
                <SiteHeader />

                <main className="flex-1 space-y-8 p-4 md:p-8 pt-6 bg-background min-h-screen">

                    {/* ── Page Header ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-muted-foreground text-sm">Tài sản</span>
                            <span className="text-muted-foreground text-sm">/</span>
                            <span className="text-sm font-semibold text-foreground">Tài sản của tôi</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Assets</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Manage your assigned equipment and report any issues.
                        </p>
                    </div>

                    {/* ── Assigned Equipment ── */}
                    <section>
                        <h2 className="text-base font-bold text-foreground mb-4">Assigned Equipment</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {assignedAssets.map((asset) => (
                                <AssetCard key={asset.id} asset={asset} onReportIssue={handleReportIssue} />
                            ))}
                        </div>
                    </section>

                    {/* ── Recent Reports ── */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-foreground">Recent Reports</h2>
                        </div>

                        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                                        <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Report ID</TableHead>
                                        <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Asset</TableHead>
                                        <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Issue Type</TableHead>
                                        <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date Reported</TableHead>
                                        <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayedReports.map((report) => (
                                        <TableRow key={report.id} className="hover:bg-muted/20 transition-colors border-border">
                                            <TableCell className="px-5 py-3 text-sm font-medium text-blue-600">{report.id}</TableCell>
                                            <TableCell className="px-5 py-3 text-sm text-foreground">{report.asset}</TableCell>
                                            <TableCell className="px-5 py-3 text-sm text-muted-foreground">{report.issueType}</TableCell>
                                            <TableCell className="px-5 py-3 text-sm text-muted-foreground">{report.dateReported}</TableCell>
                                            <TableCell className="px-5 py-3">
                                                <Badge className={STATUS_CONFIG[report.status].className}>
                                                    {STATUS_CONFIG[report.status].label}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Footer toggle */}
                            {recentReports.length > PREVIEW_COUNT && (
                                <div className="border-t border-border px-5 py-2.5 flex items-center justify-between text-xs text-muted-foreground bg-muted/10">
                                    <span>
                                        {showAll
                                            ? `Showing all ${recentReports.length} reports`
                                            : `Showing ${PREVIEW_COUNT} of ${recentReports.length} reports`}
                                    </span>
                                    <button
                                        className="text-blue-600 font-medium hover:underline"
                                        onClick={() => setShowAll((v) => !v)}
                                    >
                                        {showAll ? "Show Less" : `View All (${recentReports.length})`}
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
                                Report Asset Issue{selectedAsset ? ` — ${selectedAsset.name}` : ""}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                                Please provide details about the asset issue to help us resolve it quickly.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="px-6 py-5 space-y-5">
                        {/* Incident Type */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Incident Type</label>
                            <Select value={incidentType} onValueChange={setIncidentType}>
                                <SelectTrigger className="w-full h-9 text-sm">
                                    <SelectValue placeholder="Select incident type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {INCIDENT_TYPES.map((t) => (
                                        <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground">Description</label>
                                <span className="text-xs text-muted-foreground">Required</span>
                            </div>
                            <Textarea
                                placeholder="Please describe the issue in detail..."
                                className="resize-none h-28 text-sm"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* Upload Evidence */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Upload Evidence</label>
                            <div className="flex items-center gap-3 border border-border rounded-lg px-4 py-3">
                                <FileText className="w-8 h-8 text-muted-foreground/50 shrink-0" />
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-sm font-medium text-foreground">No file chosen</span>
                                    <span className="text-[11px] text-muted-foreground">Max file size: 5MB (JPG, PNG, PDF)</span>
                                </div>
                                <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs font-medium">
                                    Browse
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-border flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 h-9 font-medium"
                            onClick={() => setDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 h-9 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            onClick={handleSubmit}
                        >
                            Submit Report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    )
}

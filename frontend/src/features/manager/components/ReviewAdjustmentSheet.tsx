import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, Check, Reply, X } from "lucide-react"
import { format } from "date-fns"
import type { AdjustmentRequest } from "../../employee/adjustment-request.constants"
import { DATETIME_FORMAT, DATE_FORMAT, AUDIT_ACTION_CONFIG } from "../../employee/adjustment-request.constants"

interface ReviewAdjustmentSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    request: AdjustmentRequest | null;
}

export function ReviewAdjustmentSheet({ open, onOpenChange, request }: ReviewAdjustmentSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto bg-slate-50 p-6 flex flex-col">
                <SheetHeader className="mb-6 flex flex-row items-center justify-between pb-2 border-b">
                    <SheetTitle className="text-xl font-bold text-slate-800">Review Request</SheetTitle>
                </SheetHeader>

                {request ? (
                    <>
                        <div className="flex flex-col gap-6 text-sm flex-1">
                            {/* Profile Section */}
                            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border border-slate-100">
                                        <AvatarImage src="" />
                                        <AvatarFallback className="bg-slate-100 text-slate-700 font-medium">
                                            {request.auditTrail[0]?.actor?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <h3 className="font-bold text-base text-slate-900">{request.auditTrail[0]?.actor || "Unknown"}</h3>
                                        <p className="text-slate-500 font-medium">Employee • {request.id}</p>
                                    </div>
                                </div>
                                {request.status === "PENDING" && (
                                    <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 px-3 py-1 font-semibold rounded-md text-xs tracking-wide">
                                        URGENT
                                    </Badge>
                                )}
                            </div>

                            {/* Adjustment Detail */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Adjustment Detail</h4>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-300"></div>
                                        <div className="flex flex-col z-10">
                                            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Original</span>
                                            <span className="font-black text-xl text-slate-800 tracking-tight">
                                                {request.originalTimeIn && request.originalTimeOut
                                                    ? `${request.originalTimeIn} - ${request.originalTimeOut}`
                                                    : request.originalTimeIn || request.originalTimeOut || "--:--"}
                                            </span>
                                        </div>
                                        <ArrowRight className="text-slate-300 h-8 w-8 z-10 shrink-0 mx-2" />
                                        <div className="flex flex-col text-right z-10">
                                            <span className="text-xs text-blue-500 font-bold uppercase tracking-wider mb-1">Proposed</span>
                                            <span className="font-black text-xl text-slate-900 tracking-tight">
                                                {request.proposedTimeIn && request.proposedTimeOut
                                                    ? `${request.proposedTimeIn} - ${request.proposedTimeOut}`
                                                    : request.proposedTimeIn || request.proposedTimeOut || "--:--"}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-400 italic px-2">
                                        Date of adjustment: {format(request.adjustmentDate, DATE_FORMAT)}
                                    </p>
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Reason for Request</h4>
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="italic text-slate-600 font-medium leading-relaxed">
                                        "{request.reason}"
                                    </p>
                                </div>
                            </div>

                            {/* Internal Notes */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Internal Notes</h4>
                                <Textarea
                                    placeholder="Add a note for the HR record..."
                                    className="resize-none h-28 bg-white rounded-xl border-slate-200 shadow-sm placeholder:text-slate-400 p-4"
                                />
                            </div>

                            {/* Activity History */}
                            <div className="space-y-4 pt-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Activity History</h4>
                                <div className="space-y-6 pt-2 pl-4 border-l-2 ml-3 border-slate-200 relative">

                                    {request.auditTrail.slice().reverse().map((audit) => {
                                        const Config = AUDIT_ACTION_CONFIG[audit.action];
                                        const Icon = Config.icon;
                                        const isGreen = Config.iconClass.includes('text-green');
                                        const isBlue = Config.iconClass.includes('text-blue');
                                        const isRed = Config.iconClass.includes('text-red');
                                        const isOrange = Config.iconClass.includes('text-orange');

                                        let ringColor = 'border-slate-300';
                                        if (isGreen) ringColor = 'border-emerald-500';
                                        else if (isBlue) ringColor = 'border-blue-500';
                                        else if (isRed) ringColor = 'border-rose-500';
                                        else if (isOrange) ringColor = 'border-orange-500';

                                        return (
                                            <div key={audit.id} className="relative pl-6">
                                                <div className={`absolute -left-[1.65rem] top-0.5 h-6 w-6 rounded-full bg-white border-2 flex items-center justify-center ${ringColor}`}>
                                                    <Icon className={`h-3.5 w-3.5 ${Config.iconClass.split(' ')[0]} stroke-3`} />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800">{Config.label}</span>
                                                        <span className="text-[11px] font-medium text-slate-400">
                                                            {format(audit.timestamp, DATETIME_FORMAT)}
                                                        </span>
                                                    </div>
                                                    <span className="text-slate-500 text-xs font-medium">{audit.actor}</span>
                                                    {audit.note && (
                                                        <span className="text-xs italic text-slate-400 mt-1">"{audit.note}"</span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                        </div>
                        {/* Footer Buttons */}
                        {(request.status === "PENDING" || request.status === "RETURNED") && (
                            <div className="mt-10 flex gap-3">
                                <Button variant="outline" className="flex-[0.8] text-amber-500 border-amber-200 hover:bg-amber-50 hover:text-amber-600 bg-white shadow-sm font-semibold">
                                    <Reply className="mr-2 h-4 w-4" />
                                    Gửi lại
                                </Button>
                                <Button variant="destructive" className="flex-[0.8] bg-rose-500 hover:bg-rose-600 text-white shadow-sm font-semibold border-none">
                                    <X className="mr-2 h-4 w-4" />
                                    Từ chối
                                </Button>
                                <Button className="flex-[1.4] bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm font-semibold border-none">
                                    <Check className="mr-2 h-4 w-4" />
                                    Duyệt yêu cầu
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Không có dữ liệu
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

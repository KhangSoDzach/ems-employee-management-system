import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import {
    DATE_FORMAT,
    LeaveFormValues,
    leaveSchema,
    LEAVE_TYPE_CONFIG,
    LEAVE_TYPE_OPTIONS,
} from "../leave-request.constants"

/* ══════════════ CREATE LEAVE MODAL ══════════════ */

interface CreateLeaveModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: LeaveFormValues) => Promise<void>
}

export const CreateLeaveModal = ({ open, onClose, onSubmit }: CreateLeaveModalProps) => {
    const form = useForm<LeaveFormValues>({
        resolver: zodResolver(leaveSchema),
        defaultValues: {
            reason: "",
        },
        mode: "onChange",
    })

    const isSubmitting = form.formState.isSubmitting
    const watchType = form.watch("leaveType")

    const handleClose = () => {
        form.reset()
        onClose()
    }

    const handleSubmit = async (data: LeaveFormValues) => {
        await onSubmit(data)
        form.reset()
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
            <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
                {/* ── Header ── */}
                <div className="px-6 pt-6 pb-4 border-b bg-muted/30">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                <CalendarIcon className="w-4 h-4 text-primary" />
                            </span>
                            Tạo Đơn Nghỉ Phép
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                            Vui lòng điền thông tin để xin nghỉ phép.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* ── Form ── */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="px-6 py-5 space-y-5">

                        {/* Loại phép */}
                        <FormField
                            control={form.control}
                            name="leaveType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-sm">Loại phép</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder="Chọn loại phép..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {LEAVE_TYPE_OPTIONS.map(([value, cfg]) => (
                                                <SelectItem key={value} value={value}>
                                                    {cfg.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    {watchType && (
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "mt-1 text-[11px] font-semibold w-fit",
                                                LEAVE_TYPE_CONFIG[watchType].badgeClass
                                            )}
                                        >
                                            {LEAVE_TYPE_CONFIG[watchType].label}
                                        </Badge>
                                    )}
                                </FormItem>
                            )}
                        />

                        {/* Date Range: Bắt đầu & Kết thúc */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="font-semibold text-sm">Ngày bắt đầu</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal h-10 px-3",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? format(field.value, DATE_FORMAT) : "Chọn ngày"}
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="font-semibold text-sm">Ngày kết thúc</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal h-10 px-3",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? format(field.value, DATE_FORMAT) : "Chọn ngày"}
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Lý do */}
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-sm">Lý do nghỉ</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={3}
                                            placeholder="Nhập lý do chi tiết..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Summary Info Box */}
                        <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                            Đơn xin nghỉ phép sẽ được gửi đến quản lý trực tiếp của bạn để phê duyệt.
                        </div>

                        {/* ── Actions ── */}
                        <div className="flex justify-end gap-3 pt-2 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="h-9 px-5"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-9 px-5 gap-2"
                            >
                                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {isSubmitting ? "Đang gửi..." : "Gửi đơn"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

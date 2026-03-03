import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    ADJUSTMENT_TYPE_CONFIG,
    ADJUSTMENT_TYPE_OPTIONS,
    adjustmentSchema,
    DATE_FORMAT,
    FORM_DEFAULTS,
} from "../adjustment-request.constants"
import type { AdjustmentFormValues } from "../adjustment-request.constants"

/* ══════════════ CREATE REQUEST MODAL ══════════════ */

interface CreateRequestModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: AdjustmentFormValues) => Promise<void>
}

export const CreateRequestModal = ({ open, onClose, onSubmit }: CreateRequestModalProps) => {
    const form = useForm<AdjustmentFormValues>({
        resolver: zodResolver(adjustmentSchema),
        defaultValues: {
            adjustmentDate: new Date(),
            reason: "",
            timeIn: FORM_DEFAULTS.timeIn,
            timeOut: FORM_DEFAULTS.timeOut,
        },
        mode: "onChange",
    })

    const watchType = form.watch("type")
    const showTimeIn = watchType === "CHECK_IN" || watchType === "BOTH"
    const showTimeOut = watchType === "CHECK_OUT" || watchType === "BOTH"
    const isSubmitting = form.formState.isSubmitting

    const handleClose = () => { form.reset(); onClose() }

    const handleSubmit = async (data: AdjustmentFormValues) => {
        await onSubmit(data)
        form.reset()
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
            {/* DialogContent đã có sẵn nút X ở góc phải trên, không cần thêm */}
            <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">

                {/* ── Header ── */}
                <div className="px-6 pt-6 pb-4 border-b bg-muted/30">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-primary" />
                            </span>
                            Tạo Yêu cầu Điều chỉnh
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Nhập thông tin để cập nhật nhật ký chấm công của bạn.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* ── Form ── */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="px-6 py-5 space-y-5">

                        {/* Ngày điều chỉnh */}
                        <FormField
                            control={form.control}
                            name="adjustmentDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel className="font-semibold text-sm">Ngày cần điều chỉnh</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal h-10",
                                                        !field.value && "text-muted-foreground",
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    {field.value ? format(field.value, DATE_FORMAT) : "Chọn ngày"}
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date > new Date()}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <p className="text-[11px] text-muted-foreground -mt-1">
                                        Không thể chọn ngày trong tương lai.
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Loại điều chỉnh — full width */}
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-sm">Loại điều chỉnh</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder="Chọn loại điều chỉnh..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ADJUSTMENT_TYPE_OPTIONS.map(([value, cfg]) => (
                                                <SelectItem key={value} value={value}>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={cn(
                                                                "w-2 h-2 rounded-full inline-block",
                                                                value === "CHECK_IN" && "bg-indigo-500",
                                                                value === "CHECK_OUT" && "bg-violet-500",
                                                                value === "BOTH" && "bg-teal-500",
                                                            )}
                                                        />
                                                        {cfg.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    {/* Preview badge khi đã chọn */}
                                    {watchType && (
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "mt-1 text-[11px] font-semibold w-fit",
                                                ADJUSTMENT_TYPE_CONFIG[watchType].badgeClass,
                                            )}
                                        >
                                            {ADJUSTMENT_TYPE_CONFIG[watchType].label}
                                        </Badge>
                                    )}
                                </FormItem>
                            )}
                        />

                        {/* Thời gian — chỉ hiện khi đã chọn loại */}
                        {(showTimeIn || showTimeOut) && (
                            <div className={cn("grid gap-4", showTimeIn && showTimeOut ? "grid-cols-2" : "grid-cols-1")}>
                                {showTimeIn && (
                                    <FormField
                                        control={form.control}
                                        name="timeIn"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-semibold text-sm">
                                                    {showTimeOut ? "Giờ Check-in đúng" : "Thời gian đúng"}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="time" className="h-10" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                {showTimeOut && (
                                    <FormField
                                        control={form.control}
                                        name="timeOut"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-semibold text-sm">
                                                    {showTimeIn ? "Giờ Check-out đúng" : "Thời gian đúng"}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="time" className="h-10" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        )}

                        {/* Lý do */}
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-sm">Lý do chi tiết</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={3}
                                            placeholder="Mô tả rõ lý do cần điều chỉnh (máy lỗi, quên quẹt thẻ...)"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

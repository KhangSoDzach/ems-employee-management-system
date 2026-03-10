import { useForm, FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { toast } from "sonner"

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
import { SYSTEM_MESSAGES } from "@/constants/messages"

/* ══════════════ CONSTANTS ══════════════ */

const TEXT = {
    TITLE: SYSTEM_MESSAGES.ADJUSTMENT.CREATE_TITLE,
    DESC: SYSTEM_MESSAGES.ADJUSTMENT.CREATE_DESC,
    LABEL_DATE: SYSTEM_MESSAGES.ADJUSTMENT.CREATE_DATE_LABEL,
    PLACEHOLDER_DATE: SYSTEM_MESSAGES.ADJUSTMENT.CREATE_DATE_PLACEHOLDER,
    DATE_WARNING: SYSTEM_MESSAGES.ADJUSTMENT.CREATE_DATE_WARNING,
    LABEL_TYPE: SYSTEM_MESSAGES.ADJUSTMENT.CREATE_TYPE_LABEL,
    PLACEHOLDER_TYPE: SYSTEM_MESSAGES.ADJUSTMENT.CREATE_TYPE_PLACEHOLDER,
    LABEL_TIME_IN: SYSTEM_MESSAGES.ADJUSTMENT.CREATE_TIME_IN_TRUE,
    LABEL_TIME_OUT: SYSTEM_MESSAGES.ADJUSTMENT.CREATE_TIME_OUT_TRUE,
    LABEL_TIME_ONLY: SYSTEM_MESSAGES.ADJUSTMENT.CREATE_TIME_ONLY,
    LABEL_REASON: SYSTEM_MESSAGES.ADJUSTMENT.CREATE_REASON_LABEL,
    PLACEHOLDER_REASON: SYSTEM_MESSAGES.ADJUSTMENT.CREATE_REASON_PLACEHOLDER,
    BTN_CANCEL: SYSTEM_MESSAGES.ADJUSTMENT.CREATE_BTN_CANCEL,
    BTN_SUBMIT: SYSTEM_MESSAGES.ADJUSTMENT.CREATE_BTN_SUBMIT,
    TOAST_LOADING: "Đang gửi yêu cầu điều chỉnh...",
    TOAST_SUCCESS: SYSTEM_MESSAGES.ADJUSTMENT.MSG_SUBMIT_SUCCESS,
    TOAST_VALIDATION_ERROR: "Vui lòng kiểm tra lại thông tin điều chỉnh.",
    ASTERISK: "*",
} as const;

/* ══════════════ COMPONENTS ══════════════ */

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <FormLabel className="flex items-center gap-1">
        {children}
        <span className="text-destructive font-bold text-lg leading-none">{TEXT.ASTERISK}</span>
    </FormLabel>
);

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

    const handleClose = () => { form.reset(); onClose() }

    const handleSubmit = async (data: AdjustmentFormValues) => {
        toast.dismiss();

        toast.promise(onSubmit(data), {
            loading: TEXT.TOAST_LOADING,
            success: () => {
                form.reset();
                return TEXT.TOAST_SUCCESS;
            },
            error: (err: unknown) => {
                return err instanceof Error ? err.message : SYSTEM_MESSAGES.API_ERROR;
            },
        });
    }

    const onError = (errors: FieldErrors<AdjustmentFormValues>) => {
        console.log("Adjustment Form Errors:", errors);
        toast.dismiss();
        toast.error(TEXT.TOAST_VALIDATION_ERROR);
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
            <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">

                {/* ── Header ── */}
                <div className="px-6 pt-6 pb-4 border-b bg-muted/30">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-primary" />
                            </span>
                            {TEXT.TITLE}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                            {TEXT.DESC}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* ── Form ── */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit, onError)} className="px-6 py-5 space-y-5">

                        {/* Ngày điều chỉnh */}
                        <FormField
                            control={form.control}
                            name="adjustmentDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <RequiredLabel>{TEXT.LABEL_DATE}</RequiredLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal h-10 px-3",
                                                        !field.value && "text-muted-foreground",
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    {field.value ? format(field.value, DATE_FORMAT) : TEXT.PLACEHOLDER_DATE}
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
                                        {TEXT.DATE_WARNING}
                                    </p>
                                    <FormMessage className="text-xs font-medium" />
                                </FormItem>
                            )}
                        />

                        {/* Loại điều chỉnh */}
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <RequiredLabel>{TEXT.LABEL_TYPE}</RequiredLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder={TEXT.PLACEHOLDER_TYPE} />
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
                                    <FormMessage className="text-xs font-medium" />
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

                        {/* Thời gian */}
                        {(showTimeIn || showTimeOut) && (
                            <div className={cn("grid gap-4", showTimeIn && showTimeOut ? "grid-cols-2" : "grid-cols-1")}>
                                {showTimeIn && (
                                    <FormField
                                        control={form.control}
                                        name="timeIn"
                                        render={({ field }) => (
                                            <FormItem>
                                                <RequiredLabel>
                                                    {showTimeOut ? TEXT.LABEL_TIME_IN : TEXT.LABEL_TIME_ONLY}
                                                </RequiredLabel>
                                                <FormControl>
                                                    <Input type="time" className="h-10 focus-visible:ring-primary" {...field} />
                                                </FormControl>
                                                <FormMessage className="text-xs font-medium" />
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
                                                <RequiredLabel>
                                                    {showTimeIn ? TEXT.LABEL_TIME_OUT : TEXT.LABEL_TIME_ONLY}
                                                </RequiredLabel>
                                                <FormControl>
                                                    <Input type="time" className="h-10 focus-visible:ring-primary" {...field} />
                                                </FormControl>
                                                <FormMessage className="text-xs font-medium" />
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
                                    <RequiredLabel>{TEXT.LABEL_REASON}</RequiredLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={3}
                                            placeholder={TEXT.PLACEHOLDER_REASON}
                                            className="resize-none focus-visible:ring-primary"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs font-medium" />
                                </FormItem>
                            )}
                        />

                        {/* ── Actions ── */}
                        <div className="flex justify-end gap-3 pt-2 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                className="h-9 px-5"
                            >
                                {TEXT.BTN_CANCEL}
                            </Button>
                            <Button
                                type="submit"
                                className="h-9 px-5 gap-2 font-bold shadow-sm"
                            >
                                {TEXT.BTN_SUBMIT}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

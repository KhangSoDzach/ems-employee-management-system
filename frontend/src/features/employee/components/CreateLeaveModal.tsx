import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

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
import { SYSTEM_MESSAGES } from "@/constants/messages";
/* ══════════════ CONSTANTS ══════════════ */

import { CREATE_LEAVE_TEXT as TEXT } from "@/constants/ui-texts";

/* ══════════════ COMPONENTS ══════════════ */

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <FormLabel className="flex items-center gap-1">
        {children}
        <span className="text-destructive font-bold text-lg leading-none">{TEXT.ASTERISK}</span>
    </FormLabel>
);

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

    const watchType = useWatch({
        control: form.control,
        name: "leaveType"
    })

    const handleClose = () => {
        form.reset()
        onClose()
    }

    const handleSubmit = async (data: LeaveFormValues) => {
        toast.dismiss();

        toast.promise(onSubmit(data), {
            loading: TEXT.TOAST_LOADING,
            success: () => {
                form.reset();
                // onClose() is called inside LeaveRequestPage's handleCreate normally, 
                // but standard practice is to handle it where the promise originates if possible.
                // However, the existing handleCreate does its own setRequests and then onClose.
                // To keep it clean, we just return the success message.
                return TEXT.TOAST_SUCCESS;
            },
            error: (err: unknown) => {
                return err instanceof Error ? err.message : SYSTEM_MESSAGES.API_ERROR;
            },
        });
    }

    const onError = () => {
        toast.dismiss();
        toast.error(TEXT.TOAST_VALIDATION_ERROR);
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { handleClose() } }}>
            <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
                {/* ── Header ── */}
                <div className="px-6 pt-6 pb-4 border-b bg-muted/30">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                <CalendarIcon className="w-4 h-4 text-primary" />
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

                        {/* Loại phép */}
                        <FormField
                            control={form.control}
                            name="leaveType"
                            render={({ field }) => (
                                <FormItem>
                                    <RequiredLabel>{TEXT.LABEL_TYPE}</RequiredLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                        <FormControl>
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder={TEXT.PLACEHOLDER_TYPE} />
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
                                    <FormMessage className="text-xs font-medium" />
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
                                        <RequiredLabel>{TEXT.LABEL_DATE_START}</RequiredLabel>
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
                                                        {field.value ? format(field.value, DATE_FORMAT) : TEXT.PLACEHOLDER_DATE}
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
                                        <FormMessage className="text-xs font-medium" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <RequiredLabel>{TEXT.LABEL_DATE_END}</RequiredLabel>
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
                                                        {field.value ? format(field.value, DATE_FORMAT) : TEXT.PLACEHOLDER_DATE}
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
                                        <FormMessage className="text-xs font-medium" />
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

                        {/* Summary Info Box */}
                        <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                            {TEXT.WARNING}
                        </div>

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

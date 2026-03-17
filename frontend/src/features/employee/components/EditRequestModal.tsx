import { useEffect } from "react";
import { useForm, FieldErrors, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ADJUSTMENT_TYPE_CONFIG,
  ADJUSTMENT_TYPE_OPTIONS,
  adjustmentSchema,
  DATE_FORMAT,
} from "../adjustment-request.constants";
import type {
  AdjustmentFormValues,
  AdjustmentRequest,
} from "../adjustment-request.constants";
import { StatusBadge } from "./AdjustmentBadges";
import { SYSTEM_MESSAGES } from "@/constants/messages";

/* ══════════════ CONSTANTS ══════════════ */

const TEXT = {
  TITLE: "Chỉnh sửa Yêu cầu",
  LABEL_DATE: "Ngày cần điều chỉnh",
  PLACEHOLDER_DATE: "Chọn ngày",
  LABEL_TYPE: "Loại điều chỉnh",
  PLACEHOLDER_TYPE: "Chọn loại...",
  LABEL_TIME_IN: "Giờ Check-in đúng",
  LABEL_TIME_OUT: "Giờ Check-out đúng",
  LABEL_TIME_ONLY: "Thời gian đúng",
  LABEL_REASON: "Lý do chi tiết",
  PLACEHOLDER_REASON: "Mô tả rõ lý do cần điều chỉnh...",
  BTN_CANCEL: "Hủy",
  BTN_SAVE: "Lưu thay đổi",
  TOAST_SAVING: "Đang lưu thay đổi...",
  TOAST_SAVE_SUCCESS: "Đã lưu thay đổi thành công!",
  TOAST_VALIDATION_ERROR: "Vui lòng kiểm tra lại thông tin chỉnh sửa.",
  RETURNED_WARNING:
    "Yêu cầu này đã bị trả về. Vui lòng bổ sung thông tin theo yêu cầu của quản lý và gửi lại.",
  ASTERISK: "*",
} as const;

/* ══════════════ COMPONENTS ══════════════ */

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <FormLabel className="flex items-center gap-1">
    {children}
    <span className="text-destructive font-bold text-lg leading-none">
      {TEXT.ASTERISK}
    </span>
  </FormLabel>
);

/* ══════════════ EDIT REQUEST MODAL ══════════════ */

interface EditRequestModalProps {
  request: AdjustmentRequest | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: AdjustmentFormValues) => Promise<void>;
}

export const EditRequestModal = ({
  request,
  open,
  onClose,
  onSubmit,
}: EditRequestModalProps) => {
  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      adjustmentDate: new Date(),
      type: "CHECK_IN",
      reason: "",
      timeIn: "",
      timeOut: "",
    },
    mode: "onChange",
  });

  /* Sync form values khi request thay đổi */
  useEffect(() => {
    if (request) {
      form.reset({
        adjustmentDate: request.adjustmentDate,
        type: request.type,
        timeIn: request.proposedTimeIn ?? "",
        timeOut: request.proposedTimeOut ?? "",
        reason: request.reason,
      });
    }
  }, [request, form]);

  const watchType = useWatch({
    control: form.control,
    name: "type",
  });
  const showTimeIn = watchType === "CHECK_IN" || watchType === "BOTH";
  const showTimeOut = watchType === "CHECK_OUT" || watchType === "BOTH";

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = async (data: AdjustmentFormValues) => {
    if (!request) return;

    toast.dismiss();

    toast.promise(onSubmit(request.id, data), {
      loading: TEXT.TOAST_SAVING,
      success: () => {
        form.reset();
        return TEXT.TOAST_SAVE_SUCCESS;
      },
      error: (err: unknown) => {
        return err instanceof Error ? err.message : SYSTEM_MESSAGES.API_ERROR;
      },
    });
  };

  const onError = (errors: FieldErrors<AdjustmentFormValues>) => {
    console.log("Edit Adjustment Errors:", errors);
    toast.dismiss();
    toast.error(TEXT.TOAST_VALIDATION_ERROR);
  };

  if (!request) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-primary" />
              </span>
              {TEXT.TITLE}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-semibold">
                  {request.id}
                </span>
                <StatusBadge status={request.status} />
              </div>
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ── Form ── */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit, onError)}
            className="px-6 py-5 space-y-5"
          >
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
                          {field.value
                            ? format(field.value, DATE_FORMAT)
                            : TEXT.PLACEHOLDER_DATE}
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
              <div
                className={cn(
                  "grid gap-4",
                  showTimeIn && showTimeOut ? "grid-cols-2" : "grid-cols-1",
                )}
              >
                {showTimeIn && (
                  <FormField
                    control={form.control}
                    name="timeIn"
                    render={({ field }) => (
                      <FormItem>
                        <RequiredLabel>
                          {showTimeOut
                            ? TEXT.LABEL_TIME_IN
                            : TEXT.LABEL_TIME_ONLY}
                        </RequiredLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className="h-10 focus-visible:ring-primary"
                            {...field}
                          />
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
                          {showTimeIn
                            ? TEXT.LABEL_TIME_OUT
                            : TEXT.LABEL_TIME_ONLY}
                        </RequiredLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className="h-10 focus-visible:ring-primary"
                            {...field}
                          />
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

            {/* ── Info note khi status = RETURNED ── */}
            {request.status === "RETURNED" && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 flex gap-2 items-start shadow-sm">
                <span className="text-base leading-none mt-0.5">
                  {SYSTEM_MESSAGES.SYMBOLS.WARNING}
                </span>
                <span>{TEXT.RETURNED_WARNING}</span>
              </div>
            )}

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
                {TEXT.BTN_SAVE}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

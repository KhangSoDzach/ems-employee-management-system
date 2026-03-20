import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  ADJUSTMENT_TYPE_OPTIONS,
  adjustmentSchema,
  DATE_FORMAT,
  FORM_DEFAULTS,
  type AdjustmentFormValues,
} from "../adjustment-request.constants";
import { CREATE_REQUEST_TEXT } from "@/constants/ui-texts";

export interface AdjustmentFormText {
  LABEL_DATE: string;
  PLACEHOLDER_DATE: string;
  LABEL_TYPE: string;
  PLACEHOLDER_TYPE: string;
  LABEL_TIME_IN: string;
  LABEL_TIME_OUT: string;
  LABEL_REASON: string;
  PLACEHOLDER_REASON: string;
  BTN_CANCEL: string;
  BTN_SUBMIT: string;
  ASTERISK: string;
}

interface AdjustmentFormProps {
  defaultValues?: Partial<AdjustmentFormValues>;
  onSubmit: (data: AdjustmentFormValues) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  text?: AdjustmentFormText;
}

const RequiredLabel = ({ children, asterisk }: { children: React.ReactNode; asterisk?: string }) => (
  <FormLabel className="flex items-center gap-1 font-semibold text-slate-700">
    {children}
    {asterisk && (
      <span className="text-destructive font-bold text-lg leading-none">
        {asterisk}
      </span>
    )}
  </FormLabel>
);

export const AdjustmentForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  text = CREATE_REQUEST_TEXT,
}: AdjustmentFormProps) => {
  const { 
    LABEL_DATE, 
    PLACEHOLDER_DATE, 
    LABEL_TYPE, 
    PLACEHOLDER_TYPE, 
    LABEL_TIME_IN, 
    LABEL_TIME_OUT, 
    LABEL_REASON, 
    PLACEHOLDER_REASON, 
    BTN_CANCEL, 
    BTN_SUBMIT, 
    ASTERISK 
  } = text;

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      adjustmentDate: new Date(),
      type: "CHECK_IN",
      reason: "",
      timeIn: FORM_DEFAULTS.timeIn,
      timeOut: FORM_DEFAULTS.timeOut,
      ...defaultValues,
    },
    mode: "onChange",
  });

  const watchType = useWatch({
    control: form.control,
    name: "type",
  });

  const showTimeIn = watchType === "CHECK_IN" || watchType === "BOTH";
  const showTimeOut = watchType === "CHECK_OUT" || watchType === "BOTH";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Adjustment Date */}
          <FormField
            control={form.control}
            name="adjustmentDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <RequiredLabel asterisk={ASTERISK}>{LABEL_DATE}</RequiredLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal h-11 rounded-xl border-slate-200 hover:bg-slate-50 transition-colors",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, DATE_FORMAT)
                        ) : (
                          <span>{PLACEHOLDER_DATE}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-primary" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl shadow-xl overflow-hidden border-slate-100" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      className="p-3"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage className="text-xs font-medium" />
              </FormItem>
            )}
          />

          {/* Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel asterisk={ASTERISK}>{LABEL_TYPE}</RequiredLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 hover:bg-slate-50 transition-colors">
                      <SelectValue placeholder={PLACEHOLDER_TYPE} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl shadow-xl border-slate-100">
                    {ADJUSTMENT_TYPE_OPTIONS.map(([value, config]) => (
                      <SelectItem key={value} value={value} className="rounded-lg py-2.5">
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs font-medium" />
              </FormItem>
            )}
          />
        </div>

        {/* Time Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {showTimeIn && (
            <FormField
              control={form.control}
              name="timeIn"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel asterisk={ASTERISK}>{LABEL_TIME_IN}</RequiredLabel>
                  <FormControl>
                    <div className="relative group">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <Input
                        type="time"
                        {...field}
                        className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
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
                  <RequiredLabel asterisk={ASTERISK}>{LABEL_TIME_OUT}</RequiredLabel>
                  <FormControl>
                    <div className="relative group">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <Input
                        type="time"
                        {...field}
                        className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs font-medium" />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Reason */}
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel asterisk={ASTERISK}>{LABEL_REASON}</RequiredLabel>
              <FormControl>
                <Textarea
                  placeholder={PLACEHOLDER_REASON}
                  className="min-h-[120px] rounded-xl border-slate-200 resize-none focus:ring-primary focus:border-primary transition-all p-4"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs font-medium" />
            </FormItem>
          )}
        />

        <div className="pt-4 flex flex-col md:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 transition-all hover:text-slate-900"
            onClick={onCancel}
          >
            {BTN_CANCEL}
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {BTN_SUBMIT}
          </Button>
        </div>
      </form>
    </Form>
  );
};

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { AlertTriangle, Send, Save, XCircle, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { assetService } from "@/services/assetService";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

// Import constants to avoid hardcoding
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations";

/**
 * Zod Schema cho Form Báo cáo sự cố
 */
const assetIncidentSchema = z.object({
  assetId: z.string().min(1, FORM_VALIDATION_MESSAGES.REQUIRED),
  incidentType: z.string().min(1, FORM_VALIDATION_MESSAGES.REQUIRED),
  severity: z.string().min(1, FORM_VALIDATION_MESSAGES.REQUIRED),
  description: z
    .string()
    .min(10, FORM_VALIDATION_MESSAGES.MIN_LENGTH(10))
    .max(500, FORM_VALIDATION_MESSAGES.MAX_LENGTH(500)),
  contactMethod: z.string().optional(),
});

type AssetIncidentValues = z.infer<typeof assetIncidentSchema>;

interface AssetIncidentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<AssetIncidentValues>;
}

// Centralized local constants to satisfy react/jsx-no-literals and avoid hardcoding
import { ASSET_INCIDENT_TEXT as TEXT } from "@/constants/ui-texts";

/**
 * Component hiển thị Label kèm dấu sao đỏ cho các trường bắt buộc
 */
const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <FormLabel className="flex items-center gap-1">
    {children}
    <span className="text-destructive font-bold text-lg leading-none">
      {TEXT.ASTERISK}
    </span>
  </FormLabel>
);

export const AssetIncidentForm: React.FC<AssetIncidentFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
}) => {
  // 1. Khởi tạo Hook Form
  const form = useForm<AssetIncidentValues>({
    resolver: zodResolver(assetIncidentSchema),
    defaultValues: {
      assetId: initialData?.assetId || "",
      incidentType: initialData?.incidentType || "",
      severity: initialData?.severity || "",
      description: initialData?.description || "",
      contactMethod: initialData?.contactMethod || "email",
    },
  });

  // 2. Xử lý Submit (Promise Toast)
  const onSubmit = async (values: AssetIncidentValues) => {
    // Dọn dẹp toast cũ trước khi thực hiện hành động mới
    toast.dismiss();

    // Thực hiện API call thực tế
    const promise = assetService.submitReport(
      Number(values.assetId.replace(/\D/g, "")),
      {
        description: values.description,
        incidentType: values.incidentType as "DAMAGED" | "LOST",
      },
    );

    // 3. Xử lý lỗi validate (Validation Error Toast)
    const onError = () => {
        // Luôn dọn dẹp toast cũ để tránh ngập lụt màn hình
        toast.dismiss();
        toast.error(TEXT.TOAST_VALIDATION_ERROR);
    };

  // 3. Xử lý lỗi validate (Validation Error Toast)
  const onError = (errors: FieldErrors<AssetIncidentValues>) => {
    console.log("Form Errors:", errors);
    // Luôn dọn dẹp toast cũ để tránh ngập lụt màn hình
    toast.dismiss();
    toast.error(TEXT.TOAST_VALIDATION_ERROR);
  };

  // 4. Các hành động phụ
  const handleCancel = () => {
    toast.dismiss();
    toast.warning(TEXT.TOAST_CANCEL_WARNING);
    onCancel?.();
  };

  const handleSaveDraft = () => {
    toast.dismiss();
    toast.info(TEXT.TOAST_DRAFT_INFO, {
      description: TEXT.TOAST_DRAFT_DESC,
      action: {
        label: TEXT.TOAST_UNDO_LABEL,
        onClick: () => {
          toast.success(TEXT.TOAST_UNDO_SUCCESS);
        },
      },
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-muted-foreground/20">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 text-primary mb-1">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {TEXT.SYSTEM_NAME}
          </span>
        </div>
        <CardTitle className="text-2xl font-extrabold">
          {TEXT.CARD_TITLE}
        </CardTitle>
        <CardDescription>{TEXT.CARD_DESC}</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onError)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mã tài sản */}
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem>
                    <RequiredLabel>{TEXT.LABEL_ASSET_ID}</RequiredLabel>
                    <FormControl>
                      <Input
                        placeholder={TEXT.PLACEHOLDER_ASSET_ID}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs font-medium" />
                  </FormItem>
                )}
              />

              {/* Loại sự cố */}
              <FormField
                control={form.control}
                name="incidentType"
                render={({ field }) => (
                  <FormItem>
                    <RequiredLabel>{TEXT.LABEL_INCIDENT_TYPE}</RequiredLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={TEXT.PLACEHOLDER_INCIDENT_TYPE}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DAMAGED">
                          {TEXT.OP_DAMAGED}
                        </SelectItem>
                        <SelectItem value="LOST">{TEXT.OP_LOST}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs font-medium" />
                  </FormItem>
                )}
              />
            </div>

            {/* Mức độ nghiêm trọng */}
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>{TEXT.LABEL_SEVERITY}</RequiredLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={TEXT.PLACEHOLDER_SEVERITY} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">{TEXT.SEV_LOW}</SelectItem>
                      <SelectItem value="medium">{TEXT.SEV_MEDIUM}</SelectItem>
                      <SelectItem value="high">{TEXT.SEV_HIGH}</SelectItem>
                      <SelectItem value="critical">
                        {TEXT.SEV_CRITICAL}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs font-medium" />
                </FormItem>
              )}
            />

            {/* Mô tả chi tiết */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>{TEXT.LABEL_DESC}</RequiredLabel>
                  <FormControl>
                    <Textarea
                      placeholder={TEXT.PLACEHOLDER_DESC}
                      className="resize-none min-h-[120px] focus-visible:ring-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    {TEXT.DESC_HINT}
                  </FormDescription>
                  <FormMessage className="text-xs font-medium" />
                </FormItem>
              )}
            />

            {/* Các nút điều hướng form */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-muted">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={handleCancel}
                >
                  <XCircle className="w-4 h-4" />
                  {TEXT.BTN_CANCEL}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                  onClick={handleSaveDraft}
                >
                  <Save className="w-4 h-4" />
                  {TEXT.BTN_DRAFT}
                </Button>
              </div>

              <Button
                type="submit"
                className="gap-2 min-w-[140px] font-bold shadow-md shadow-primary/20"
              >
                <Send className="w-4 h-4" />
                {TEXT.BTN_SUBMIT}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="bg-muted/30 py-3 block text-center">
        <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
          <Info className="w-3 h-3" />
          {TEXT.FOOTER_NOTE}
        </p>
      </CardFooter>
    </Card>
  );
};

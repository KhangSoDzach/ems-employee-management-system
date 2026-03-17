import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useCreateAnnouncement } from "@/features/announcement/hooks/useAnnouncements";
import type { TargetAudience } from "@/features/announcement/announcement.types";
import {
  lookupService,
  type DepartmentOption,
  type RoleOption,
} from "@/services/lookupService";
import { useQuery } from "@tanstack/react-query";

const formSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề là bắt buộc")
    .max(255, "Tiêu đề tối đa 255 ký tự"),
  content: z.string().min(1, "Nội dung là bắt buộc"),
  announcementType: z.enum(["POLICY", "EVENT", "OTHER"]),
  targetAudience: z.enum(["ALL_COMPANY", "BY_DEPARTMENT", "BY_ROLE"]),
  targetIds: z.array(z.number()),
});

type FormValues = z.infer<typeof formSchema>;

const TYPE_OPTIONS = [
  { value: "POLICY", label: "Chính sách" },
  { value: "EVENT", label: "Sự kiện" },
  { value: "OTHER", label: "Khác" },
] as const;

const TARGET_OPTIONS = [
  { value: "ALL_COMPANY", label: "Toàn công ty" },
  { value: "BY_DEPARTMENT", label: "Theo phòng ban" },
  { value: "BY_ROLE", label: "Theo vai trò" },
] as const;

export function CreateAnnouncementForm() {
  const createMutation = useCreateAnnouncement();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      announcementType: "POLICY",
      targetAudience: "ALL_COMPANY",
      targetIds: [],
    },
  });

  const [openTargetDropdown, setOpenTargetDropdown] = useState(false);
  const [targetSearch, setTargetSearch] = useState("");

  const { data: departments = [] } = useQuery({
    queryKey: ["lookup", "departments"],
    queryFn: lookupService.getDepartments,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["lookup", "roles"],
    queryFn: lookupService.getRoles,
  });

  const selectedAudience = useWatch({
    control: form.control,
    name: "targetAudience",
    defaultValue: "ALL_COMPANY",
  });
  const requiresIds = useMemo(
    () =>
      selectedAudience === "BY_DEPARTMENT" || selectedAudience === "BY_ROLE",
    [selectedAudience],
  );

  useEffect(() => {
    setTargetSearch("");
    form.setValue("targetIds", []);
  }, [selectedAudience, form]);

  const selectedTargetIds = useWatch({
    control: form.control,
    name: "targetIds",
    defaultValue: [],
  });

  const availableTargets = useMemo(() => {
    if (selectedAudience === "BY_DEPARTMENT") {
      return departments.map((item: DepartmentOption) => ({
        id: item.id,
        label: `${item.name} (${item.code})`,
      }));
    }
    if (selectedAudience === "BY_ROLE") {
      return roles.map((item: RoleOption) => ({
        id: item.id,
        label: item.description
          ? `${item.name} - ${item.description}`
          : item.name,
      }));
    }
    return [] as Array<{ id: number; label: string }>;
  }, [selectedAudience, departments, roles]);

  const filteredTargets = useMemo(() => {
    const keyword = targetSearch.trim().toLowerCase();
    if (!keyword) return availableTargets;
    return availableTargets.filter((item) =>
      item.label.toLowerCase().includes(keyword),
    );
  }, [availableTargets, targetSearch]);

  const selectedTargetLabels = useMemo(() => {
    if (selectedTargetIds.length === 0) return "Chọn đối tượng";
    const labels = availableTargets
      .filter((item) => selectedTargetIds.includes(item.id))
      .map((item) => item.label);
    if (labels.length <= 2) return labels.join(", ");
    return `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
  }, [availableTargets, selectedTargetIds]);

  const toggleTarget = (targetId: number) => {
    const current = form.getValues("targetIds");
    if (current.includes(targetId)) {
      form.setValue(
        "targetIds",
        current.filter((id) => id !== targetId),
        { shouldValidate: true },
      );
      return;
    }
    form.setValue("targetIds", [...current, targetId], {
      shouldValidate: true,
    });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (requiresIds && values.targetIds.length === 0) {
      form.setError("targetIds", {
        message: "Vui lòng chọn ít nhất một đối tượng",
      });
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        title: values.title,
        content: values.content,
        announcementType: values.announcementType,
        targetAudience: values.targetAudience as TargetAudience,
        targetIds: values.targetIds,
      });
      toast.success(
        `Tạo thông báo thành công (${result.recipientCount} người nhận)`,
      );
      form.reset({
        title: "",
        content: "",
        announcementType: "POLICY",
        targetAudience: "ALL_COMPANY",
        targetIds: [],
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo thông báo",
      );
    }
  });

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      <h2 className="text-lg font-semibold">Tạo thông báo nội bộ</h2>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tiêu đề</FormLabel>
                <FormControl>
                  <Input placeholder="Nhập tiêu đề thông báo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nội dung</FormLabel>
                <FormControl>
                  <Textarea
                    rows={6}
                    placeholder="Nhập nội dung thông báo"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="announcementType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phân loại</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phân loại" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetAudience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đối tượng nhận</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn đối tượng" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TARGET_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {requiresIds && (
            <FormField
              control={form.control}
              name="targetIds"
              render={() => (
                <FormItem>
                  <FormLabel>
                    {selectedAudience === "BY_DEPARTMENT"
                      ? "Phòng ban nhận"
                      : "Vai trò nhận"}
                  </FormLabel>
                  <Popover
                    open={openTargetDropdown}
                    onOpenChange={setOpenTargetDropdown}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate text-left">
                          {selectedTargetLabels}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[420px] p-2" align="start">
                      <Input
                        placeholder="Tìm kiếm..."
                        value={targetSearch}
                        onChange={(event) =>
                          setTargetSearch(event.target.value)
                        }
                        className="mb-2"
                      />
                      <div className="max-h-56 overflow-auto rounded-md border p-1">
                        {filteredTargets.length === 0 && (
                          <p className="p-2 text-sm text-muted-foreground">
                            Không có dữ liệu phù hợp
                          </p>
                        )}
                        {filteredTargets.map((target) => {
                          const checked = selectedTargetIds.includes(target.id);
                          return (
                            <button
                              key={target.id}
                              type="button"
                              onClick={() => toggleTarget(target.id)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                                checked && "bg-muted",
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                className="pointer-events-none"
                              />
                              <span className="flex-1 truncate">
                                {target.label}
                              </span>
                              {checked && <Check className="h-4 w-4" />}
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Đang tạo..." : "Tạo thông báo"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

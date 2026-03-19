import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type SalaryComponentPayload,
  type SalaryComponentResponse,
} from "@/services/salaryComponentApi";

interface SalaryComponentFormProps {
  open: boolean;
  mode: "create" | "edit";
  initialValue?: SalaryComponentResponse | null;
  submitting: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (payload: SalaryComponentPayload) => void;
}

type FormState = {
  code: string;
  name: string;
  type: SalaryComponentPayload["type"];
  isTaxable: boolean;
  isInsurable: boolean;
  amount: string;
  ratePercent: string;
  nature: SalaryComponentPayload["nature"];
  status: SalaryComponentPayload["status"];
};

const DEFAULT_STATE: FormState = {
  code: "",
  name: "",
  type: "BASE",
  isTaxable: true,
  isInsurable: true,
  amount: "",
  ratePercent: "",
  nature: "INCOME",
  status: "ACTIVE",
};

export function SalaryComponentForm({
  open,
  mode,
  initialValue,
  submitting,
  serverError,
  onClose,
  onSubmit,
}: Readonly<SalaryComponentFormProps>) {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && initialValue) {
      setForm({
        code: initialValue.code,
        name: initialValue.name,
        type: initialValue.type,
        isTaxable: initialValue.isTaxable,
        isInsurable: initialValue.isInsurable,
        amount: initialValue.amount == null ? "" : String(initialValue.amount),
        ratePercent:
          initialValue.ratePercent == null
            ? ""
            : String(initialValue.ratePercent),
        nature: initialValue.nature,
        status: initialValue.status,
      });
    } else {
      setForm(DEFAULT_STATE);
    }

    setErrors({});
  }, [open, mode, initialValue]);

  const title = useMemo(
    () =>
      mode === "create" ? "Tạo thành phần lương" : "Cập nhật thành phần lương",
    [mode],
  );

  if (!open) {
    return null;
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.code.trim()) {
      newErrors.code = "Mã thành phần là bắt buộc";
    }
    if (!form.name.trim()) {
      newErrors.name = "Tên thành phần là bắt buộc";
    }

    const hasAmount = form.amount.trim().length > 0;
    const hasRate = form.ratePercent.trim().length > 0;

    if (!hasAmount && !hasRate) {
      newErrors.amount = "Cần nhập Số tiền hoặc Hệ số/Phần trăm";
      newErrors.ratePercent = "Cần nhập Số tiền hoặc Hệ số/Phần trăm";
    }

    if (hasAmount) {
      const parsedAmount = Number(form.amount);
      if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
        newErrors.amount = "Số tiền phải lớn hơn hoặc bằng 0";
      }
    }

    if (hasRate) {
      const parsedRate = Number(form.ratePercent);
      if (Number.isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
        newErrors.ratePercent = "Hệ số/Phần trăm phải nằm trong khoảng 0 - 100";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = (): SalaryComponentPayload => ({
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    type: form.type,
    isTaxable: form.isTaxable,
    isInsurable: form.isInsurable,
    amount: form.amount.trim() ? Number(form.amount) : null,
    ratePercent: form.ratePercent.trim() ? Number(form.ratePercent) : null,
    nature: form.nature,
    status: form.status,
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    onSubmit(buildPayload());
  };

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleTypeChange = (type: SalaryComponentPayload["type"]) => {
    if (type === "INSURANCE") {
      setForm((prev) => ({
        ...prev,
        type,
        isTaxable: false,
        isInsurable: false,
        nature: "DEDUCTION",
      }));
      return;
    }
    setForm((prev) => ({ ...prev, type }));
  };

  const isInsuranceType = form.type === "INSURANCE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl rounded-xl border bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={submitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Mã</label>
              <Input
                value={form.code}
                onChange={(e) => updateField("code", e.target.value)}
                placeholder="VD: LUONG_CO_BAN"
                disabled={submitting}
              />
              {errors.code && (
                <p className="mt-1 text-xs text-red-500">{errors.code}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Tên</label>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="VD: Lương cơ bản"
                disabled={submitting}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Loại</label>
              <select
                value={form.type}
                onChange={(e) =>
                  handleTypeChange(
                    e.target.value as SalaryComponentPayload["type"],
                  )
                }
                className="h-10 w-full rounded-md border px-3 text-sm"
                disabled={submitting}
              >
                <option value="BASE">Lương cơ bản (BASE)</option>
                <option value="ALLOWANCE">Phụ cấp (ALLOWANCE)</option>
                <option value="COMMISSION">Hoa hồng (COMMISSION)</option>
                <option value="BONUS">Thưởng (BONUS)</option>
                <option value="INSURANCE">Bảo hiểm (INSURANCE)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Tính chất
              </label>
              <select
                value={form.nature}
                onChange={(e) =>
                  updateField(
                    "nature",
                    e.target.value as SalaryComponentPayload["nature"],
                  )
                }
                className="h-10 w-full rounded-md border px-3 text-sm"
                disabled={submitting || isInsuranceType}
              >
                <option value="INCOME">Thu nhập (Income)</option>
                <option value="DEDUCTION">Khấu trừ (Deduction)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Trạng thái
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  updateField(
                    "status",
                    e.target.value as SalaryComponentPayload["status"],
                  )
                }
                className="h-10 w-full rounded-md border px-3 text-sm"
                disabled={submitting}
              >
                <option value="ACTIVE">Đang áp dụng (ACTIVE)</option>
                <option value="INACTIVE">Ngừng áp dụng (INACTIVE)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Số tiền (không bắt buộc)
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => updateField("amount", e.target.value)}
                placeholder="0"
                disabled={submitting}
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Hệ số/Phần trăm (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.ratePercent}
                onChange={(e) => updateField("ratePercent", e.target.value)}
                placeholder="VD: 8"
                disabled={submitting}
              />
              {errors.ratePercent && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.ratePercent}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isTaxable}
                onChange={(e) => updateField("isTaxable", e.target.checked)}
                disabled={submitting || isInsuranceType}
              />
              Tính thuế
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isInsurable}
                onChange={(e) => updateField("isInsurable", e.target.checked)}
                disabled={submitting || isInsuranceType}
              />
              Tính bảo hiểm
            </label>
          </div>

          {isInsuranceType ? (
            <p className="text-xs text-amber-600">
              Với loại Bảo hiểm, hệ thống tự động để Tính chất = Khấu trừ và bỏ
              tích Chịu thuế/Đóng BHXH.
            </p>
          ) : null}

          {serverError ? (
            <p className="text-sm text-red-600">{serverError}</p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Đang lưu..."
                : mode === "create"
                  ? "Tạo mới"
                  : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

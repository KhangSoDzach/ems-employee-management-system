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

type ComponentTypeRule = {
  nature: SalaryComponentPayload["nature"];
  showAmount: boolean;
  showRatePercent: boolean;
  isTaxable: boolean;
  isInsurable: boolean;
};

const TYPE_RULES: Record<SalaryComponentPayload["type"], ComponentTypeRule> = {
  BASE:       { nature: "INCOME",    showAmount: true,  showRatePercent: false, isTaxable: true,  isInsurable: true  },
  ALLOWANCE:  { nature: "INCOME",    showAmount: true,  showRatePercent: false, isTaxable: true,  isInsurable: true  },
  COMMISSION: { nature: "INCOME",    showAmount: false, showRatePercent: true,  isTaxable: true,  isInsurable: true  },
  BONUS:      { nature: "INCOME",    showAmount: true,  showRatePercent: true,  isTaxable: true,  isInsurable: true  },
  DEDUCTION:  { nature: "DEDUCTION", showAmount: true,  showRatePercent: false, isTaxable: false, isInsurable: false },
  INSURANCE:  { nature: "DEDUCTION", showAmount: false, showRatePercent: true,  isTaxable: false, isInsurable: false },
};

const DEFAULT_STATE: FormState = {
  code: "", name: "", type: "ALLOWANCE",
  isTaxable: true, isInsurable: true,
  amount: "", ratePercent: "",
  nature: "INCOME", status: "ACTIVE",
};

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-sm font-medium">
      {children}
      {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) { return null; }
  return <p className="mt-1 flex items-center gap-1 text-xs text-red-500">{message}</p>;
}

export function SalaryComponentForm({
  open, mode, initialValue, submitting, serverError, onClose, onSubmit,
}: Readonly<SalaryComponentFormProps>) {
  const [form, setForm]     = useState<FormState>(DEFAULT_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const normalizeFormState = (
    nextMode: "create" | "edit",
    nextInitialValue?: SalaryComponentResponse | null,
  ): FormState => {
    if (nextMode === "edit" && nextInitialValue) {
      const rule = TYPE_RULES[nextInitialValue.type];
      return {
        code:        nextInitialValue.code,
        name:        nextInitialValue.name,
        type:        nextInitialValue.type,
        isTaxable:   rule.isTaxable,
        isInsurable: rule.isInsurable,
        amount:      nextInitialValue.amount === null ? "" : String(nextInitialValue.amount),
        ratePercent: nextInitialValue.ratePercent === null ? "" : String(nextInitialValue.ratePercent),
        nature:      rule.nature,
        status:      nextInitialValue.status,
      };
    }
    return DEFAULT_STATE;
  };

  useEffect(() => {
    if (!open) { return; }
    const nextForm = normalizeFormState(mode, initialValue);
    queueMicrotask(() => {
      setForm(nextForm);
      setErrors({});
      setTouched({});
    });
  }, [open, mode, initialValue]);

  const title = useMemo(
    () => mode === "create" ? "Tạo thành phần lương" : "Cập nhật thành phần lương",
    [mode],
  );

  if (!open) { return null; }

  const validate = (f: FormState = form): Record<string, string> => {
    const errs: Record<string, string> = {};
    const rule = TYPE_RULES[f.type];

    if (!f.code.trim()) {
      errs.code = "Mã là bắt buộc";
    } else if (!/^[A-Z0-9_]+$/i.test(f.code.trim())) {
      errs.code = "Mã chỉ được chứa chữ cái, số và dấu gạch dưới (_)";
    } else if (f.code.trim().length > 50) {
      errs.code = "Mã không được vượt quá 50 ký tự";
    }

    if (!f.name.trim()) {
      errs.name = "Tên là bắt buộc";
    } else if (f.name.trim().length > 255) {
      errs.name = "Tên không được vượt quá 255 ký tự";
    }

    if (rule.showAmount) {
      if (!f.amount.trim()) {
        errs.amount = "Số tiền là bắt buộc";
      } else {
        const n = Number(f.amount);
        if (Number.isNaN(n))     { errs.amount = "Số tiền phải là số hợp lệ"; }
        else if (n < 0)          { errs.amount = "Số tiền không được âm"; }
        else if (n > 999_999_999){ errs.amount = "Số tiền quá lớn (tối đa 999,999,999)"; }
      }
    }

    if (rule.showRatePercent) {
      if (!f.ratePercent.trim()) {
        errs.ratePercent = "Hệ số (%) là bắt buộc";
      } else {
        const r = Number(f.ratePercent);
        if (Number.isNaN(r))   { errs.ratePercent = "Hệ số phải là số hợp lệ"; }
        else if (r < 0)        { errs.ratePercent = "Hệ số không được âm"; }
        else if (r > 100)      { errs.ratePercent = "Hệ số không được vượt quá 100%"; }
      }
    }

    return errs;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const errs = validate();
    setErrors(prev => ({
      ...prev,
      [field]: errs[field] ?? "",
    }));
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    const nextForm = { ...form, [key]: value };
    setForm(nextForm);
    if (touched[key]) {
      const errs = validate(nextForm);
      setErrors(prev => ({ ...prev, [key]: errs[key] ?? "" }));
    }
  };

  const handleTypeChange = (type: SalaryComponentPayload["type"]) => {
    const rule = TYPE_RULES[type];
    setForm(prev => ({
      ...prev, type,
      nature:      rule.nature,
      isTaxable:   rule.isTaxable,
      isInsurable: rule.isInsurable,
      amount:      rule.showAmount      ? prev.amount      : "",
      ratePercent: rule.showRatePercent ? prev.ratePercent : "",
    }));
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ code: true, name: true, amount: true, ratePercent: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) { return; }
    onSubmit(buildPayload());
  };

  const buildPayload = (): SalaryComponentPayload => ({
    code:        form.code.trim().toUpperCase(),
    name:        form.name.trim(),
    type:        form.type,
    isTaxable:   TYPE_RULES[form.type].isTaxable,
    isInsurable: TYPE_RULES[form.type].isInsurable,
    amount:      TYPE_RULES[form.type].showAmount && form.amount.trim() ? Number(form.amount) : null,
    ratePercent: TYPE_RULES[form.type].showRatePercent && form.ratePercent.trim() ? Number(form.ratePercent) : null,
    nature:      TYPE_RULES[form.type].nature,
    status:      form.status,
  });

  const rule = TYPE_RULES[form.type];

  const fieldError = (key: string) =>
    touched[key] ? errors[key] : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl rounded-xl border bg-white p-6 shadow-xl dark:bg-slate-900">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={submitting}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* Mã */}
            <div>
              <Label required>Mã</Label>
              <Input
                value={form.code}
                onChange={e => updateField("code", e.target.value)}
                onBlur={() => handleBlur("code")}
                placeholder="VD: LUONG_CO_BAN"
                disabled={submitting}
                className={fieldError("code") ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              <FieldError message={fieldError("code")} />
            </div>

            {/* Tên */}
            <div>
              <Label required>Tên</Label>
              <Input
                value={form.name}
                onChange={e => updateField("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                placeholder="VD: Lương cơ bản"
                disabled={submitting}
                className={fieldError("name") ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              <FieldError message={fieldError("name")} />
            </div>

            {/* Loại */}
            <div>
              <Label required>Loại</Label>
              <select
                value={form.type}
                onChange={e => handleTypeChange(e.target.value as SalaryComponentPayload["type"])}
                className="h-10 w-full rounded-md border px-3 text-sm"
                disabled={submitting}
              >
                {form.type === "BASE" && <option value="BASE">Lương cơ bản (BASE)</option>}
                <option value="ALLOWANCE">Phụ cấp (ALLOWANCE)</option>
                <option value="COMMISSION">Hoa hồng (COMMISSION)</option>
                <option value="BONUS">Thưởng (BONUS)</option>
                <option value="DEDUCTION">Khấu trừ (DEDUCTION)</option>
                <option value="INSURANCE">Bảo hiểm (INSURANCE)</option>
              </select>
            </div>

            {/* Tính chất (auto-locked) */}
            <div>
              <Label>Tính chất</Label>
              <select
                value={form.nature}
                className="h-10 w-full rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground"
                disabled
              >
                <option value="INCOME">Thu nhập (Income)</option>
                <option value="DEDUCTION">Khấu trừ (Deduction)</option>
              </select>
            </div>

            {/* Trạng thái */}
            <div>
              <Label required>Trạng thái</Label>
              <select
                value={form.status}
                onChange={e => updateField("status", e.target.value as SalaryComponentPayload["status"])}
                className="h-10 w-full rounded-md border px-3 text-sm"
                disabled={submitting}
              >
                <option value="ACTIVE">Đang áp dụng (ACTIVE)</option>
                <option value="INACTIVE">Ngừng áp dụng (INACTIVE)</option>
              </select>
            </div>

            {/* Số tiền */}
            {rule.showAmount && (
              <div>
                <Label required>Số tiền (VND)</Label>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={form.amount}
                  onChange={e => updateField("amount", e.target.value)}
                  onBlur={() => handleBlur("amount")}
                  placeholder="VD: 500000"
                  disabled={submitting}
                  className={fieldError("amount") ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                <FieldError message={fieldError("amount")} />
              </div>
            )}

            {/* Hệ số % */}
            {rule.showRatePercent && (
              <div>
                <Label required>Hệ số / Phần trăm (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={form.ratePercent}
                  onChange={e => updateField("ratePercent", e.target.value)}
                  onBlur={() => handleBlur("ratePercent")}
                  placeholder="VD: 8"
                  disabled={submitting}
                  className={fieldError("ratePercent") ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                <FieldError message={fieldError("ratePercent")} />
              </div>
            )}
          </div>

          {/* Helper text */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Tính chất được tự động khóa theo loại: Bảo hiểm → Khấu trừ, Thưởng → Thu nhập.
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500">*</span> Trường bắt buộc
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-200">
              {serverError}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : mode === "create" ? "Tạo mới" : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

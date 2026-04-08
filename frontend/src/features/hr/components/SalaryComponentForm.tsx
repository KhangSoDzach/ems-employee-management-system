import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type SalaryComponentPayload,
  type SalaryComponentResponse,
} from "@/services/salaryComponentApi";
import { PAYROLL_ADMIN_CONSTANTS } from "../../../constants/payroll.constants";
import { SYSTEM_MESSAGES } from "@/constants/messages";

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
  BASE: {
    nature: "INCOME",
    showAmount: true,
    showRatePercent: false,
    isTaxable: true,
    isInsurable: true,
  },
  ALLOWANCE: {
    nature: "INCOME",
    showAmount: true,
    showRatePercent: false,
    isTaxable: true,
    isInsurable: true,
  },
  COMMISSION: {
    nature: "INCOME",
    showAmount: false,
    showRatePercent: true,
    isTaxable: true,
    isInsurable: true,
  },
  BONUS: {
    nature: "INCOME",
    showAmount: true,
    showRatePercent: true,
    isTaxable: true,
    isInsurable: true,
  },
  DEDUCTION: {
    nature: "DEDUCTION",
    showAmount: true,
    showRatePercent: false,
    isTaxable: false,
    isInsurable: false,
  },
  INSURANCE: {
    nature: "DEDUCTION",
    showAmount: false,
    showRatePercent: true,
    isTaxable: false,
    isInsurable: false,
  },
};

const DEFAULT_STATE: FormState = {
  code: "",
  name: "",
  type: "ALLOWANCE",
  isTaxable: true,
  isInsurable: true,
  amount: "",
  ratePercent: "",
  nature: "INCOME",
  status: "ACTIVE",
};

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-1 block text-sm font-medium">
      {children}
      {required && (
        <span className="ml-0.5 text-red-500" aria-hidden="true">
          {SYSTEM_MESSAGES.SYMBOLS.ASTERISK}
        </span>
      )}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
      {message}
    </p>
  );
}

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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const normalizeFormState = (
    nextMode: "create" | "edit",
    nextInitialValue?: SalaryComponentResponse | null,
  ): FormState => {
    if (nextMode === "edit" && nextInitialValue) {
      const rule = TYPE_RULES[nextInitialValue.type];
      return {
        code: nextInitialValue.code,
        name: nextInitialValue.name,
        type: nextInitialValue.type,
        isTaxable: rule.isTaxable,
        isInsurable: rule.isInsurable,
        amount:
          nextInitialValue.amount === null
            ? ""
            : String(nextInitialValue.amount),
        ratePercent:
          nextInitialValue.ratePercent === null
            ? ""
            : String(nextInitialValue.ratePercent),
        nature: rule.nature,
        status: nextInitialValue.status,
      };
    }
    return DEFAULT_STATE;
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const nextForm = normalizeFormState(mode, initialValue);
    queueMicrotask(() => {
      setForm(nextForm);
      setErrors({});
      setTouched({});
    });
  }, [open, mode, initialValue]);

  const title = useMemo(
    () =>
      mode === "create"
        ? PAYROLL_ADMIN_CONSTANTS.MODAL.TITLE_CREATE
        : PAYROLL_ADMIN_CONSTANTS.MODAL.TITLE_EDIT,
    [mode],
  );

  if (!open) {
    return null;
  }

  const validate = (f: FormState = form): Record<string, string> => {
    const errs: Record<string, string> = {};
    const rule = TYPE_RULES[f.type];

    if (!f.code.trim()) {
      errs.code = PAYROLL_ADMIN_CONSTANTS.VALIDATION.CODE_REQUIRED;
    } else if (
      !PAYROLL_ADMIN_CONSTANTS.VALIDATION.CODE_REGEX.test(f.code.trim())
    ) {
      errs.code = PAYROLL_ADMIN_CONSTANTS.VALIDATION.CODE_INVALID_FORMAT;
    } else if (
      f.code.trim().length > PAYROLL_ADMIN_CONSTANTS.VALIDATION.CODE_MAX_LENGTH
    ) {
      errs.code = PAYROLL_ADMIN_CONSTANTS.VALIDATION.CODE_TOO_LONG;
    }

    if (!f.name.trim()) {
      errs.name = PAYROLL_ADMIN_CONSTANTS.VALIDATION.NAME_REQUIRED;
    } else if (
      f.name.trim().length > PAYROLL_ADMIN_CONSTANTS.VALIDATION.NAME_MAX_LENGTH
    ) {
      errs.name = PAYROLL_ADMIN_CONSTANTS.VALIDATION.NAME_TOO_LONG;
    }

    if (rule.showAmount) {
      if (!f.amount.trim()) {
        errs.amount = PAYROLL_ADMIN_CONSTANTS.VALIDATION.AMOUNT_REQUIRED;
      } else {
        const n = Number(f.amount);
        if (
          Number.isNaN(n) ||
          n < PAYROLL_ADMIN_CONSTANTS.VALIDATION.AMOUNT_MIN
        ) {
          errs.amount = PAYROLL_ADMIN_CONSTANTS.VALIDATION.AMOUNT_INVALID;
        }
      }
    }

    if (rule.showRatePercent) {
      if (!f.ratePercent.trim()) {
        errs.ratePercent = PAYROLL_ADMIN_CONSTANTS.VALIDATION.RATE_REQUIRED;
      } else {
        const r = Number(f.ratePercent);
        if (
          Number.isNaN(r) ||
          r < PAYROLL_ADMIN_CONSTANTS.VALIDATION.RATE_MIN ||
          r > PAYROLL_ADMIN_CONSTANTS.VALIDATION.RATE_MAX
        ) {
          errs.ratePercent = PAYROLL_ADMIN_CONSTANTS.VALIDATION.RATE_INVALID;
        }
      }
    }

    return errs;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate();
    setErrors((prev) => ({
      ...prev,
      [field]: errs[field] ?? "",
    }));
  };

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    const nextForm = { ...form, [key]: value };
    setForm(nextForm);
    if (touched[key]) {
      const errs = validate(nextForm);
      setErrors((prev) => ({ ...prev, [key]: errs[key] ?? "" }));
    }
  };

  const handleTypeChange = (type: SalaryComponentPayload["type"]) => {
    const rule = TYPE_RULES[type];
    setForm((prev) => ({
      ...prev,
      type,
      nature: rule.nature,
      isTaxable: rule.isTaxable,
      isInsurable: rule.isInsurable,
      amount: rule.showAmount ? prev.amount : "",
      ratePercent: rule.showRatePercent ? prev.ratePercent : "",
    }));
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ code: true, name: true, amount: true, ratePercent: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      return;
    }
    onSubmit(buildPayload());
  };

  const buildPayload = (): SalaryComponentPayload => ({
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    type: form.type,
    isTaxable: TYPE_RULES[form.type].isTaxable,
    isInsurable: TYPE_RULES[form.type].isInsurable,
    amount:
      TYPE_RULES[form.type].showAmount && form.amount.trim()
        ? Number(form.amount)
        : null,
    ratePercent:
      TYPE_RULES[form.type].showRatePercent && form.ratePercent.trim()
        ? Number(form.ratePercent)
        : null,
    nature: TYPE_RULES[form.type].nature,
    status: form.status,
  });

  const rule = TYPE_RULES[form.type];

  const fieldError = (key: string) => (touched[key] ? errors[key] : undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
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

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Mã */}
            <div>
              <Label required>{PAYROLL_ADMIN_CONSTANTS.MODAL.LABEL_CODE}</Label>
              <Input
                value={form.code}
                onChange={(e) => updateField("code", e.target.value)}
                onBlur={() => handleBlur("code")}
                placeholder={PAYROLL_ADMIN_CONSTANTS.MODAL.PLACEHOLDER_CODE}
                disabled={submitting}
                className={
                  fieldError("code")
                    ? "border-red-500 focus-visible:ring-red-500 rounded-xl"
                    : "rounded-xl border-border bg-muted/20"
                }
              />
              <FieldError message={fieldError("code")} />
            </div>

            {/* Tên */}
            <div>
              <Label required>{PAYROLL_ADMIN_CONSTANTS.MODAL.LABEL_NAME}</Label>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                placeholder={PAYROLL_ADMIN_CONSTANTS.MODAL.PLACEHOLDER_NAME}
                disabled={submitting}
                className={
                  fieldError("name")
                    ? "border-red-500 focus-visible:ring-red-500 rounded-xl"
                    : "rounded-xl border-border bg-muted/20"
                }
              />
              <FieldError message={fieldError("name")} />
            </div>

            {/* Loại */}
            <div>
              <Label required>{PAYROLL_ADMIN_CONSTANTS.MODAL.LABEL_TYPE}</Label>
              <select
                value={form.type}
                onChange={(e) =>
                  handleTypeChange(
                    e.target.value as SalaryComponentPayload["type"],
                  )
                }
                className="h-10 w-full rounded-xl border border-border bg-muted/20 px-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                disabled={submitting}
              >
                {form.type === "BASE" && (
                  <option value="BASE">
                    {PAYROLL_ADMIN_CONSTANTS.TYPE_LABELS.BASE}
                  </option>
                )}
                <option value="ALLOWANCE">
                  {PAYROLL_ADMIN_CONSTANTS.TYPE_LABELS.ALLOWANCE}
                </option>
                <option value="COMMISSION">
                  {PAYROLL_ADMIN_CONSTANTS.TYPE_LABELS.COMMISSION}
                </option>
                <option value="BONUS">
                  {PAYROLL_ADMIN_CONSTANTS.TYPE_LABELS.BONUS}
                </option>
                <option value="DEDUCTION">
                  {PAYROLL_ADMIN_CONSTANTS.TYPE_LABELS.DEDUCTION}
                </option>
                <option value="INSURANCE">
                  {PAYROLL_ADMIN_CONSTANTS.TYPE_LABELS.INSURANCE}
                </option>
              </select>
            </div>

            {/* Tính chất (auto-locked) */}
            <div>
              <Label>{PAYROLL_ADMIN_CONSTANTS.MODAL.LABEL_NATURE}</Label>
              <select
                value={form.nature}
                className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-70"
                disabled
              >
                <option value="INCOME">
                  {PAYROLL_ADMIN_CONSTANTS.NATURE_LABELS.INCOME}
                </option>
                <option value="DEDUCTION">
                  {PAYROLL_ADMIN_CONSTANTS.NATURE_LABELS.DEDUCTION}
                </option>
              </select>
            </div>

            {/* Trạng thái */}
            <div>
              <Label required>
                {PAYROLL_ADMIN_CONSTANTS.MODAL.LABEL_STATUS}
              </Label>
              <select
                value={form.status}
                onChange={(e) =>
                  updateField(
                    "status",
                    e.target.value as SalaryComponentPayload["status"],
                  )
                }
                className="h-10 w-full rounded-xl border border-border bg-muted/20 px-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                disabled={submitting}
              >
                <option value="ACTIVE">
                  {PAYROLL_ADMIN_CONSTANTS.STATUS_LABELS.ACTIVE}
                </option>
                <option value="INACTIVE">
                  {PAYROLL_ADMIN_CONSTANTS.STATUS_LABELS.INACTIVE}
                </option>
              </select>
            </div>

            {/* Số tiền */}
            {rule.showAmount && (
              <div>
                <Label required>
                  {PAYROLL_ADMIN_CONSTANTS.MODAL.LABEL_AMOUNT}
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={form.amount}
                  onChange={(e) => updateField("amount", e.target.value)}
                  onBlur={() => handleBlur("amount")}
                  placeholder={PAYROLL_ADMIN_CONSTANTS.MODAL.PLACEHOLDER_AMOUNT}
                  disabled={submitting}
                  className={
                    fieldError("amount")
                      ? "border-red-500 focus-visible:ring-red-500 rounded-xl"
                      : "rounded-xl border-border bg-muted/20"
                  }
                />
                <FieldError message={fieldError("amount")} />
              </div>
            )}

            {/* Hệ số % */}
            {rule.showRatePercent && (
              <div>
                <Label required>
                  {PAYROLL_ADMIN_CONSTANTS.MODAL.LABEL_RATE}
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={form.ratePercent}
                  onChange={(e) => updateField("ratePercent", e.target.value)}
                  onBlur={() => handleBlur("ratePercent")}
                  placeholder={PAYROLL_ADMIN_CONSTANTS.MODAL.PLACEHOLDER_RATE}
                  disabled={submitting}
                  className={
                    fieldError("ratePercent")
                      ? "border-red-500 focus-visible:ring-red-500 rounded-xl"
                      : "rounded-xl border-border bg-muted/20"
                  }
                />
                <FieldError message={fieldError("ratePercent")} />
              </div>
            )}
          </div>

          {/* Helper text */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground italic">
              {PAYROLL_ADMIN_CONSTANTS.MODAL.HELPER_LOCK}
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-200">
              {serverError}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl px-6 h-11 font-bold text-muted-foreground"
            >
              {SYSTEM_MESSAGES.BTN_CANCEL}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-xl px-8 h-11 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              {submitting
                ? SYSTEM_MESSAGES.SAVING
                : mode === "create"
                  ? PAYROLL_ADMIN_CONSTANTS.BTN_CREATE
                  : SYSTEM_MESSAGES.BTN_SAVE}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { Textarea } from "@/components/ui/textarea";
import { SYSTEM_MESSAGES } from "@/constants/messages";

interface ReviewSheetFeedbackProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

export function ReviewSheetFeedback({
  value,
  onChange,
  placeholder,
  label,
  error,
}: ReviewSheetFeedbackProps) {
  return (
    <div className="space-y-4">
      <h4 className="section-title-muted uppercase tracking-wider">
        {label || SYSTEM_MESSAGES.APPROVE.LABEL_FEEDBACK}
      </h4>

      <div
        className={`bg-white rounded-xl border ${error ? "border-destructive focus-within:ring-destructive/20" : "border-slate-200 focus-within:ring-primary/20"} shadow-sm overflow-hidden transition-all`}
      >
        <Textarea
          placeholder={
            placeholder || SYSTEM_MESSAGES.APPROVE.FEEDBACK_PLACEHOLDER
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="resize-none h-32 border-none focus-visible:ring-0 shadow-none placeholder:text-slate-400 p-4 text-sm"
        />
      </div>
      {error && (
        <p className="text-xs font-semibold text-destructive mt-1.5 animate-in fade-in slide-in-from-top-1 px-1">
          {error}
        </p>
      )}
    </div>
  );
}

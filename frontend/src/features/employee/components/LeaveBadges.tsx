import { cn } from "@/lib/utils";
import { X } from "lucide-react";

import {
  type LeaveStatus,
  LEAVE_STATUS_CONFIG,
  type LeaveType,
  LEAVE_TYPE_CONFIG,
} from "@/constants/leave-request";

/* ══════════════ STATUS BADGE ══════════════ */

export const StatusBadge = ({ status }: { status: LeaveStatus }) => {
  const config = LEAVE_STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap border",
        config.badgeClass,
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full inline-block shrink-0",
          status === "PENDING" && "bg-amber-500",
          status === "APPROVED" && "bg-emerald-500",
          status === "REJECTED" && "bg-rose-500",
          status === "RETURNED" && "bg-orange-500",
        )}
      />
      {config.label}
    </span>
  );
};

/* ══════════════ TYPE BADGE ══════════════ */

export const TypeBadge = ({ type }: { type: LeaveType }) => {
  const config = LEAVE_TYPE_CONFIG[type] || {
    label: type,
    badgeClass: "bg-muted text-muted-foreground border-slate-200",
    dotClass: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap border",
        config.badgeClass,
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full inline-block",
          config.dotClass || "bg-slate-400",
        )}
      />
      {config.label}
    </span>
  );
};

/* ══════════════ ACTIVE FILTER BADGE ══════════════ */

export const ActiveFilterBadge = ({
  value,
  colorClass,
  onClear,
}: {
  value: string;
  colorClass: string;
  onClear: () => void;
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold",
      colorClass,
    )}
  >
    {value}
    <span
      role="button"
      tabIndex={0}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClear();
      }}
      className="opacity-60 hover:opacity-100 transition-opacity rounded-full cursor-pointer"
      aria-label={`Xóa bộ lọc "${value}"`}
    >
      <X className="w-2.5 h-2.5" />
    </span>
  </span>
);

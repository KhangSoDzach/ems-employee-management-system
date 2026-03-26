import { cn } from "@/lib/utils";
import { X } from "lucide-react";

import {
  LeaveStatus,
  LEAVE_STATUS_CONFIG,
  LeaveType,
  LEAVE_TYPE_CONFIG,
} from "../leave-request.constants";

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
  const config = LEAVE_TYPE_CONFIG[type];

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
          type === "annual" && "bg-indigo-500",
          type === "sick" && "bg-rose-500",
          type === "unpaid" && "bg-slate-500",
          type === "personal" && "bg-violet-500",
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
  isActive,
  onClick,
}: {
  value: string;
  colorClass: string;
  onClear: () => void;
  isActive?: boolean;
  onClick?: () => void;
}) => (
  <span
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all cursor-pointer select-none",
      isActive === false
        ? "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        : cn(colorClass, "border-current shadow-sm"),
      isActive && "scale-105",
    )}
  >
    {value}
    {(isActive === undefined || isActive) && (
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        className="opacity-60 hover:opacity-100 transition-opacity rounded-full ml-0.5"
        aria-label={`Xóa bộ lọc "${value}"`}
      >
        <X className="w-3 h-3" />
      </button>
    )}
  </span>
);

import { cn } from "@/lib/utils";
import { SYSTEM_MESSAGES } from "@/constants/messages";

const LEAVE_TYPE_STATS_CONFIG: Record<string, { bg: string; text: string }> = {
  ANNUAL: {
    bg: "bg-purple-50/50 dark:bg-purple-900/10",
    text: "text-purple-600",
  },
  SICK: { bg: "bg-blue-50/50 dark:bg-blue-900/10", text: "text-blue-600" },
  PERSONAL: {
    bg: "bg-amber-50/50 dark:bg-amber-900/10",
    text: "text-amber-600",
  },
  DEFAULT: { bg: "bg-gray-50/50 dark:bg-gray-900/10", text: "text-gray-600" },
};

interface ProfileStatsProps {
  leaveBalances: any[];
  attendancePercentage: number;
}

export function ProfileStats({
  leaveBalances,
  attendancePercentage,
}: ProfileStatsProps) {
  return (
    <div className="content-card">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
        {SYSTEM_MESSAGES.PROFILE.STATS_TITLE}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Leave Balances */}
        {(leaveBalances || []).map((balance: any, index: number) => {
          const type = balance.leaveType;
          const config =
            LEAVE_TYPE_STATS_CONFIG[type] || LEAVE_TYPE_STATS_CONFIG.DEFAULT;
          const labelKey = `TYPE_${type}` as keyof typeof SYSTEM_MESSAGES.LEAVE;
          const rawLabel = (SYSTEM_MESSAGES.LEAVE[labelKey] as string) || type;
          const label = rawLabel.replace("Nghỉ ", "");

          if (!config) {
            return null;
          }

          return (
            <div
              key={index}
              className={cn(
                "border rounded-xl p-4 text-center transition-all hover:shadow-md flex flex-col justify-center",
                config.bg,
              )}
            >
              <p className={cn("text-3xl font-black mb-1", config.text)}>
                {balance.remainingDays}
              </p>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-tight leading-tight">
                {label}
              </p>
            </div>
          );
        })}

        {/* Attendance Percentage */}
        <div className="border bg-teal-50/50 dark:bg-teal-900/10 rounded-xl p-4 text-center transition-all hover:shadow-md flex flex-col justify-center">
          <p className="text-3xl font-black text-teal-600 mb-1">
            {Math.round(attendancePercentage * 10) / 10}
            <span className="text-xl">
              {SYSTEM_MESSAGES.PROFILE.PERCENT_SIGN}
            </span>
          </p>
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-tight leading-tight">
            {SYSTEM_MESSAGES.PROFILE.STATS_ATTENDANCE}
          </p>
        </div>
      </div>
    </div>
  );
}

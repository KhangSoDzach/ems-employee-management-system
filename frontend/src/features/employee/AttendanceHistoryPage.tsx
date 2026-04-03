import { useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  LogIn,
  LogOut,
} from "lucide-react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  attendanceService,
  AttendanceCalendarData,
  AttendanceCalendarDay,
} from "@/services/attendanceService";

import { SYSTEM_MESSAGES } from "@/constants/messages";
import { ATTENDANCE_STATUS } from "@/constants/options";

type StatusKey = NonNullable<AttendanceCalendarDay["status"]>;

type CalendarMetric = AttendanceCalendarData["fullWorkDays"];

type CalendarMetricSet = {
  fullWorkDays: CalendarMetric;
  lateDays: CalendarMetric;
  noClockOutDays: CalendarMetric;
  absentDays: CalendarMetric;
};

function zeroMetric(): CalendarMetric {
  return { current: 0, changePercent: 0 };
}

function buildMetricsFromDays(
  days: AttendanceCalendarDay[],
): CalendarMetricSet {
  const fullWorkDays = days.filter(
    (day) =>
      day.hasRecord &&
      day.status !== "ABSENT" &&
      day.status !== "ON_LEAVE" &&
      Boolean(day.checkInTime),
  ).length;

  const lateDays = days.filter(
    (day) => day.hasRecord && (day.status === "LATE" || day.isLate === true),
  ).length;

  const noClockOutDays = days.filter(
    (day) =>
      day.hasRecord &&
      (day.missingClockOut === true ||
        (Boolean(day.checkInTime) && !day.checkOutTime)),
  ).length;

  const absentDays = days.filter(
    (day) => day.hasRecord && day.status === "ABSENT",
  ).length;

  return {
    fullWorkDays: { current: fullWorkDays, changePercent: 0 },
    lateDays: { current: lateDays, changePercent: 0 },
    noClockOutDays: { current: noClockOutDays, changePercent: 0 },
    absentDays: { current: absentDays, changePercent: 0 },
  };
}

function resolveCalendarMetrics(
  data: AttendanceCalendarData | undefined,
): CalendarMetricSet {
  if (!data) {
    return {
      fullWorkDays: zeroMetric(),
      lateDays: zeroMetric(),
      noClockOutDays: zeroMetric(),
      absentDays: zeroMetric(),
    };
  }

  const apiMetrics: CalendarMetricSet = {
    fullWorkDays: data.fullWorkDays ?? zeroMetric(),
    lateDays: data.lateDays ?? zeroMetric(),
    noClockOutDays: data.noClockOutDays ?? zeroMetric(),
    absentDays: data.absentDays ?? zeroMetric(),
  };

  const hasAnyRecord = data.days.some((day) => day.hasRecord);
  const allApiMetricsZero =
    apiMetrics.fullWorkDays.current === 0 &&
    apiMetrics.lateDays.current === 0 &&
    apiMetrics.noClockOutDays.current === 0 &&
    apiMetrics.absentDays.current === 0;

  if (hasAnyRecord && allApiMetricsZero) {
    return buildMetricsFromDays(data.days);
  }

  return apiMetrics;
}

function statusInfo(status: AttendanceCalendarDay["status"]) {
  const map: Record<StatusKey, { label: string; cls: string }> = {
    PRESENT: {
      label: ATTENDANCE_STATUS.PRESENT.label,
      cls: ATTENDANCE_STATUS.PRESENT.cls,
    },
    LATE: {
      label: ATTENDANCE_STATUS.LATE.label,
      cls: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    ABSENT: {
      label: ATTENDANCE_STATUS.ABSENT.label,
      cls: ATTENDANCE_STATUS.ABSENT.cls,
    },
    HALF_DAY: {
      label: ATTENDANCE_STATUS.HALF_DAY.label,
      cls: ATTENDANCE_STATUS.HALF_DAY.cls,
    },
    ON_LEAVE: {
      label: ATTENDANCE_STATUS.ON_LEAVE.label,
      cls: ATTENDANCE_STATUS.ON_LEAVE.cls,
    },
  };

  if (!status) {
    return {
      label: SYSTEM_MESSAGES.COMMON.EMPTY_VALUE,
      cls: "bg-muted text-muted-foreground",
    };
  }

  return (
    map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" }
  );
}

function fmtTime(iso: string | null) {
  if (!iso) {
    return SYSTEM_MESSAGES.COMMON.EMPTY_VALUE;
  }
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWorkHours(minutes: number | null) {
  if (minutes === null || minutes === undefined) {
    return SYSTEM_MESSAGES.COMMON.EMPTY_VALUE;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0
    ? `${hours}${SYSTEM_MESSAGES.COMMON.HOURS_UNIT}`
    : `${hours}${SYSTEM_MESSAGES.COMMON.HOURS_UNIT} ${mins}m`;
}

function formatTrend(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function MetricCard({
  title,
  value,
  trend,
  color,
  loading,
}: Readonly<{
  title: string;
  value: number;
  trend: number;
  color: string;
  loading?: boolean;
}>) {
  return (
    <Card className="card-border">
      <CardContent className="p-5">
        <p className="section-title-muted mb-1">{title}</p>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin my-1 text-muted-foreground" />
        ) : (
          <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {loading ? "…" : formatTrend(trend)}{" "}
          {SYSTEM_MESSAGES.ATTENDANCE_HIST.COMPARE_PREV_MONTH}
        </p>
      </CardContent>
    </Card>
  );
}

const WEEKDAY_LABELS = ["Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "CN"];

export default function AttendanceHistoryPage() {
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedDateOverride, setSelectedDateOverride] = useState<
    string | null
  >(null);

  const monthParam = format(viewMonth, "yyyy-MM");

  const calendarQuery = useQuery<AttendanceCalendarData>({
    queryKey: ["attendance", "calendar", monthParam],
    queryFn: () => attendanceService.getCalendar({ month: monthParam }),
    retry: 1,
    retryDelay: 400,
  });

  const dayMap = useMemo(() => {
    const map = new Map<string, AttendanceCalendarDay>();
    for (const day of calendarQuery.data?.days ?? []) {
      map.set(day.date, day);
    }
    return map;
  }, [calendarQuery.data?.days]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarCells = useMemo(() => {
    const dates: Date[] = [];
    for (
      let cursor = gridStart;
      cursor <= gridEnd;
      cursor = new Date(
        cursor.getFullYear(),
        cursor.getMonth(),
        cursor.getDate() + 1,
      )
    ) {
      dates.push(cursor);
    }
    return dates;
  }, [gridStart, gridEnd]);

  const selectedDate = useMemo(() => {
    if (selectedDateOverride && dayMap.has(selectedDateOverride)) {
      return selectedDateOverride;
    }

    if (!calendarQuery.data) {
      return null;
    }

    const todayKey = format(new Date(), "yyyy-MM-dd");
    const hasTodayInMonth = calendarQuery.data.days.some(
      (d) => d.date === todayKey,
    );
    if (hasTodayInMonth && todayKey.startsWith(monthParam)) {
      return todayKey;
    }

    return calendarQuery.data.days[0]?.date ?? null;
  }, [calendarQuery.data, dayMap, monthParam, selectedDateOverride]);

  const selectedDay = selectedDate ? dayMap.get(selectedDate) : null;
  const metrics = useMemo(
    () => resolveCalendarMetrics(calendarQuery.data),
    [calendarQuery.data],
  );

  return (
    <main className="page-layout-wrapper">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-heading">
            {SYSTEM_MESSAGES.ATTENDANCE_HIST.TITLE}
          </h1>
          <p className="text-muted-foreground mt-1">
            {SYSTEM_MESSAGES.ATTENDANCE_HIST.DESC}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title={SYSTEM_MESSAGES.ATTENDANCE_HIST.CARD_FULL_WORK_DAYS}
          value={metrics.fullWorkDays.current}
          trend={metrics.fullWorkDays.changePercent}
          color="text-emerald-600"
          loading={calendarQuery.isLoading}
        />
        <MetricCard
          title={SYSTEM_MESSAGES.ATTENDANCE_HIST.CARD_LATE_DAYS}
          value={metrics.lateDays.current}
          trend={metrics.lateDays.changePercent}
          color="text-amber-600"
          loading={calendarQuery.isLoading}
        />
        <MetricCard
          title={SYSTEM_MESSAGES.ATTENDANCE_HIST.CARD_NO_CLOCK_OUT_DAYS}
          value={metrics.noClockOutDays.current}
          trend={metrics.noClockOutDays.changePercent}
          color="text-violet-600"
          loading={calendarQuery.isLoading}
        />
        <MetricCard
          title={SYSTEM_MESSAGES.ATTENDANCE_HIST.CARD_ABSENT_DAYS}
          value={metrics.absentDays.current}
          trend={metrics.absentDays.changePercent}
          color="text-rose-600"
          loading={calendarQuery.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <Card className="card-border xl:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {SYSTEM_MESSAGES.ATTENDANCE_HIST.CALENDAR_TITLE}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => {
                    setSelectedDateOverride(null);
                    setViewMonth((prev) => addMonths(prev, -1));
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="min-w-[130px] text-center font-semibold text-base">
                  {SYSTEM_MESSAGES.ATTENDANCE_HIST.CARD_MONTH_LABEL(
                    format(viewMonth, "M, yyyy"),
                  )}
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => {
                    setSelectedDateOverride(null);
                    setViewMonth((prev) => addMonths(prev, 1));
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {calendarQuery.isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-7 text-sm text-muted-foreground font-medium">
                  {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className="px-2 py-2 text-center">
                      {label}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border border-border bg-border">
                  {calendarCells.map((date) => {
                    const dateKey = format(date, "yyyy-MM-dd");
                    const dayData = dayMap.get(dateKey);
                    const inCurrentMonth = isSameMonth(date, viewMonth);
                    const active = selectedDate === dateKey;
                    let dayNumberClass = "text-muted-foreground/60";
                    if (inCurrentMonth) {
                      dayNumberClass = isToday(date)
                        ? "text-primary"
                        : "text-foreground";
                    }

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        onClick={() =>
                          inCurrentMonth && setSelectedDateOverride(dateKey)
                        }
                        className={`h-[112px] bg-background p-2 text-left transition-colors ${
                          inCurrentMonth ? "hover:bg-muted/30" : "bg-muted/20"
                        } ${active ? "ring-2 ring-primary" : ""}`}
                        disabled={!inCurrentMonth}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-sm font-semibold ${dayNumberClass}`}
                          >
                            {format(date, "d")}
                          </span>
                          {dayData?.hasRecord && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                        </div>

                        {inCurrentMonth && dayData?.hasRecord && (
                          <div className="mt-2 space-y-1">
                            <Badge
                              variant="outline"
                              className={`status-badge px-2 py-0 ${statusInfo(dayData.status).cls}`}
                            >
                              {statusInfo(dayData.status).label}
                            </Badge>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                              {fmtTime(dayData.checkInTime)} -{" "}
                              {fmtTime(dayData.checkOutTime)}
                            </p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {SYSTEM_MESSAGES.ATTENDANCE_HIST.DETAIL_TITLE}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDay?.hasRecord ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {SYSTEM_MESSAGES.ATTENDANCE_HIST.LABEL_DATE}
                  </p>
                  <p className="font-semibold">
                    {format(parseISO(selectedDay.date), "dd/MM/yyyy")}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {SYSTEM_MESSAGES.ATTENDANCE_HIST.LABEL_STATUS}
                  </p>
                  <Badge
                    variant="outline"
                    className={`status-badge px-2.5 py-0.5 ${statusInfo(selectedDay.status).cls}`}
                  >
                    {statusInfo(selectedDay.status).label}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-lg border border-border p-3">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <LogIn className="w-3.5 h-3.5" />
                      {SYSTEM_MESSAGES.ATTENDANCE_HIST.LABEL_CHECKIN}
                    </div>
                    <div className="font-medium">
                      {fmtTime(selectedDay.checkInTime)}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-3">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <LogOut className="w-3.5 h-3.5" />
                      {SYSTEM_MESSAGES.ATTENDANCE_HIST.LABEL_CHECKOUT}
                    </div>
                    <div className="font-medium">
                      {fmtTime(selectedDay.checkOutTime)}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-3">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {SYSTEM_MESSAGES.ATTENDANCE_HIST.LABEL_TOTAL_WORK_HOURS}
                    </div>
                    <div className="font-medium">
                      {formatWorkHours(selectedDay.workHours)}
                    </div>
                  </div>
                </div>

                {selectedDay.missingClockOut && (
                  <p className="text-xs text-violet-600">
                    {SYSTEM_MESSAGES.ATTENDANCE_HIST.LABEL_MISSING_CLOCKOUT}
                  </p>
                )}

                {selectedDay.notes && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {SYSTEM_MESSAGES.ATTENDANCE_HIST.LABEL_NOTES}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedDay.notes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {SYSTEM_MESSAGES.ATTENDANCE_HIST.DETAIL_EMPTY}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

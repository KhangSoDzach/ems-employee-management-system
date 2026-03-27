import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { announcementService } from "@/services/announcementService";
import { assetService } from "@/services/assetService";
import { attendanceService } from "@/services/attendanceService";
import { leaveService } from "@/services/leaveService";

type SidebarRole = "admin" | "employee" | "manager" | "hr";

const BADGE_POLL_INTERVAL_MS = 5_000;

export function useSidebarBadgeCounts(
  role: SidebarRole,
  userId: number | null,
) {
  const announcementQuery = useQuery({
    queryKey: ["sidebar-badge", "announcements", userId],
    queryFn: () => {
      if (userId === null) {
        return Promise.resolve([]);
      }
      return announcementService.getAnnouncementsByUserId(userId);
    },
    enabled: userId !== null,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: BADGE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const leavePendingQuery = useQuery({
    queryKey: ["sidebar-badge", "leave-pending", role],
    queryFn: () => leaveService.getTeamLeaves({ page: 0, size: 1000 }),
    enabled: role === "manager" || role === "hr",
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: BADGE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const adjustmentPendingQuery = useQuery({
    queryKey: ["sidebar-badge", "adjustment-pending", role],
    queryFn: () =>
      attendanceService.getPendingAdjustments({ page: 0, size: 1000 }),
    enabled: role === "manager" || role === "hr",
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: BADGE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const reportPendingQuery = useQuery({
    queryKey: ["sidebar-badge", "asset-report-pending", role],
    queryFn: () =>
      assetService.getAllReports({
        status: "PENDING",
        page: 0,
        size: 1,
      }),
    enabled: role === "hr",
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: BADGE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const assetRequestPendingQuery = useQuery({
    queryKey: ["sidebar-badge", "asset-request-pending", role],
    queryFn: () =>
      assetService.getAllAssetRequests({
        status: "PENDING",
        page: 0,
        size: 1,
      }),
    enabled: role === "hr",
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: BADGE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const counts = useMemo(() => {
    const announcementUnread = (announcementQuery.data ?? []).filter(
      (item) => !item.isRead,
    ).length;

    const leavePending = (leavePendingQuery.data?.content ?? []).filter(
      (item) => item.status.startsWith("PENDING"),
    ).length;

    const adjustmentPending = (
      adjustmentPendingQuery.data?.content ?? []
    ).filter((item) => item.status.startsWith("PENDING")).length;

    const reportPending = reportPendingQuery.data?.totalElements ?? 0;
    const assetRequestPending =
      assetRequestPendingQuery.data?.totalElements ?? 0;

    return {
      "/announcements": announcementUnread,
      "/approve": leavePending,
      "/approve-adjustments": adjustmentPending,
      "/asset-reports": reportPending,
      "/asset-requests": assetRequestPending,
    } as Record<string, number>;
  }, [
    announcementQuery.data,
    leavePendingQuery.data,
    adjustmentPendingQuery.data,
    reportPendingQuery.data,
    assetRequestPendingQuery.data,
  ]);

  return counts;
}

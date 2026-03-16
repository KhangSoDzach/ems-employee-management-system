import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  memberService,
  type SaveReviewRequest,
} from "@/services/memberService";
import { TEAM_MEMBERS_QUERY_KEY } from "./useTeamMembers";

/** React Query key prefix for performance review queries */
export const REVIEW_QUERY_KEY = "performance-review" as const;

/**
 * Fetches the latest performance review for a specific employee.
 * If no review exists the backend returns an empty object with totalScore=0.
 *
 * @param employeeId - ID of the employee to fetch review for (pass 0 / undefined to skip)
 */
export function useLatestReview(employeeId: number | null | undefined) {
  return useQuery({
    queryKey: [REVIEW_QUERY_KEY, "latest", employeeId],
    queryFn: () => memberService.getLatestReview(employeeId!),
    enabled: !!employeeId,
    staleTime: 60_000,
  });
}

/**
 * Mutation hook to save (or update) a performance evaluation.
 * On success: shows a toast and invalidates the latest-review cache.
 */
export function useSaveReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveReviewRequest) =>
      memberService.saveReview(payload),
    onSuccess: (_, variables) => {
      toast.success("Đánh giá đã được lưu thành công");
      // Invalidate so the view-mode sheet picks up the new scores immediately
      queryClient.invalidateQueries({
        queryKey: [REVIEW_QUERY_KEY, "latest", variables.revieweeId],
      });
      queryClient.invalidateQueries({ queryKey: [TEAM_MEMBERS_QUERY_KEY] });
    },
    onError: (error: Error) => {
      toast.error(error?.message ?? "Có lỗi xảy ra khi lưu đánh giá");
    },
  });
}

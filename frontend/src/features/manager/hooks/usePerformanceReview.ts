import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { memberService, type SaveReviewRequest } from "@/services/memberService";
import { TEAM_MEMBERS_QUERY_KEY } from "./useTeamMembers";

export const REVIEW_QUERY_KEY    = "performance-review" as const;
export const AGGREGATE_QUERY_KEY = "performance-review-aggregate" as const;

type AxiosLike = { response?: { data?: { message?: string } }; message?: string };
function backendMessage(error: unknown, fallback: string): string {
  const e = error as AxiosLike;
  return e?.response?.data?.message ?? e?.message ?? fallback;
}

export function useLatestReview(employeeId: number | null | undefined) {
  return useQuery({
    queryKey: [REVIEW_QUERY_KEY, "latest", employeeId],
    queryFn: () => memberService.getLatestReview(employeeId!),
    enabled: !!employeeId,
    staleTime: 60_000,
  });
}

export function useAggregateReview(
  employeeId: number | null | undefined,
  period?: string,
) {
  return useQuery({
    queryKey: [AGGREGATE_QUERY_KEY, employeeId, period ?? "latest"],
    queryFn: () => memberService.getAggregate(employeeId!, period),
    enabled: !!employeeId,
    staleTime: 30_000,
  });
}

export function useSaveReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveReviewRequest) => memberService.saveReview(payload),
    onSuccess: (_, variables) => {
      toast.success("Đánh giá đã được lưu thành công");
      queryClient.invalidateQueries({ queryKey: [AGGREGATE_QUERY_KEY, variables.revieweeId] });
      queryClient.invalidateQueries({ queryKey: [REVIEW_QUERY_KEY, "latest", variables.revieweeId] });
      queryClient.invalidateQueries({ queryKey: [TEAM_MEMBERS_QUERY_KEY] });
    },
    onError: (error: unknown) => {
      toast.error(backendMessage(error, "Có lỗi xảy ra khi lưu đánh giá"));
    },
  });
}
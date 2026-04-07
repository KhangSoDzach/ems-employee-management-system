import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { memberService, type CreateMeetingRequest } from "@/services/memberService";

export const MEETING_QUERY_KEY = "one-on-one-meetings" as const;

type AxiosLike = { response?: { data?: { message?: string } }; message?: string };
function backendMessage(error: unknown, fallback: string): string {
  const e = error as AxiosLike;
  return e?.response?.data?.message ?? e?.message ?? fallback;
}

export function useMeetings(employeeId: number | null | undefined) {
  return useQuery({
    queryKey: [MEETING_QUERY_KEY, employeeId],
    queryFn: () => memberService.getMeetings(employeeId!),
    enabled: !!employeeId,
    staleTime: 30_000,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMeetingRequest) => memberService.createMeeting(payload),
    onSuccess: (_, variables) => {
      toast.success("Đã lưu bản ghi cuộc họp");
      queryClient.invalidateQueries({ queryKey: [MEETING_QUERY_KEY, variables.employeeId] });
    },
    onError: (error: unknown) => {
      toast.error(backendMessage(error, "Không thể lưu bản ghi cuộc họp"));
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreateMeetingRequest }) =>
      memberService.updateMeeting(id, payload),
    onSuccess: (data) => {
      toast.success("Đã cập nhật bản ghi");
      queryClient.invalidateQueries({ queryKey: [MEETING_QUERY_KEY, data.employeeId] });
    },
    onError: (error: unknown) => {
      toast.error(backendMessage(error, "Không thể cập nhật bản ghi"));
    },
  });
}

export function useDeleteMeeting(employeeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => memberService.deleteMeeting(id),
    onSuccess: () => {
      toast.success("Đã xóa bản ghi");
      queryClient.invalidateQueries({ queryKey: [MEETING_QUERY_KEY, employeeId] });
    },
    onError: (error: unknown) => {
      toast.error(backendMessage(error, "Không thể xóa bản ghi"));
    },
  });
}
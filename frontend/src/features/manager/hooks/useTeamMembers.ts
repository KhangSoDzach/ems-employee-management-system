import { useQuery } from "@tanstack/react-query";
import {
  memberService,
  type GetTeamMembersParams,
} from "@/services/memberService";

/** React Query key prefix for team member queries */
export const TEAM_MEMBERS_QUERY_KEY = "team-members" as const;

/**
 * Fetches the paginated list of employees under the logged-in Manager's team.
 * Automatically refetches when `params` change (page / size / search).
 *
 * @example
 * const { data, isLoading, isError } = useTeamMembers({ page: 0, size: 10, search: '' });
 */
export function useTeamMembers(params: GetTeamMembersParams = {}) {
  return useQuery({
    queryKey: [TEAM_MEMBERS_QUERY_KEY, params],
    queryFn: () => memberService.getTeamMembers(params),
    placeholderData: (prev) => prev, // keep previous page data while next page loads
    staleTime: 30_000, // 30 s – list doesn't change very often
  });
}

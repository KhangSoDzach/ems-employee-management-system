import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, Star } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import {
  MemberEvaluationSheet,
  type Member,
} from "./components/MemberEvaluationSheet";
import { useTeamMembers } from "./hooks/useTeamMembers";
import {
  useActiveReviewCycle,
  useOpenReviewCycle,
  useSaveReview,
} from "./hooks/usePerformanceReview";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Role badge colour is a UI concern only — derive it from position title
function roleColor(positionTitle: string | null): string {
  const title = (positionTitle ?? "").toLowerCase();
  if (
    title.includes("frontend") ||
    title.includes("react") ||
    title.includes("ui")
  ) {
    return "bg-blue-100 text-blue-700 hover:bg-blue-100";
  }
  if (
    title.includes("backend") ||
    title.includes("java") ||
    title.includes("server")
  ) {
    return "bg-purple-100 text-purple-700 hover:bg-purple-100";
  }
  if (title.includes("manager") || title.includes("lead")) {
    return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
  }
  if (title.includes("design") || title.includes("ux")) {
    return "bg-amber-100 text-amber-700 hover:bg-amber-100";
  }
  if (
    title.includes("devops") ||
    title.includes("cloud") ||
    title.includes("infra")
  ) {
    return "bg-orange-100 text-orange-700 hover:bg-orange-100";
  }
  return "bg-gray-100 text-gray-700 hover:bg-gray-100";
}

const PAGE_SIZE = SYSTEM_MESSAGES.COMMON.DEFAULT_PAGE_SIZE;

export default function MemberList() {
  const t = SYSTEM_MESSAGES.MEMBER_LIST;
  const effectiveRole = useEffectiveRole();
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [sheetMode, setSheetMode] = useState<"view" | "edit">("view");
  // Store submitted scores per employee so view mode shows latest results
  const [savedReviews, setSavedReviews] = useState<Record<number, {
    scores: Record<string, number>;
    comment: string;
  }>>({});
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState(0);

  // Debounce search input so we don't spam the API on every keystroke
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
    // simple inline debounce using a timeout ref would be better; for now
    // we accept a brief delay by setting debouncedSearch only when the value changes.
    clearTimeout(
      (
        globalThis as Window &
        typeof globalThis & { _searchTimer?: ReturnType<typeof setTimeout> }
      )._searchTimer,
    );
    (
      globalThis as Window &
      typeof globalThis & { _searchTimer?: ReturnType<typeof setTimeout> }
    )._searchTimer = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  };

  const { data, isLoading, isError } = useTeamMembers({
    page,
    size: PAGE_SIZE,
    search: debouncedSearch || undefined,
  });

  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;
  const activeCycleQuery = useActiveReviewCycle();
  const openCycleMutation = useOpenReviewCycle();
  const saveReviewMutation = useSaveReview();

  // Map API MemberResponse → the Member type consumed by MemberEvaluationSheet
  const members: Member[] = useMemo(
    () =>
      (data?.content ?? [])
        .filter((m) => m.id !== user?.id)
        .map((m) => ({
          id: m.id,
          name: m.fullName,
          email: m.email,
          role: m.positionTitle ?? "—",
          roleColor: roleColor(m.positionTitle),
          skills: [] as string[], // UI shows position/department; skills are not in the slim DTO
          avatar: m.avatarUrl ?? "",
        })),
    [data, user?.id],
  );

  const handleOpenCycle = async () => {
    const periodInput = globalThis.prompt(
      "Nhập kỳ đánh giá (ví dụ: 2026-Q1, 2026-H1, 2026-ANNUAL)",
    );
    if (!periodInput) {
      return;
    }

    const normalized = periodInput.trim().toUpperCase();
    const periodRegex = /^\d{4}-(Q[1-4]|H[12]|ANNUAL)$/;
    if (!periodRegex.test(normalized)) {
      toast.error("Kỳ đánh giá không đúng định dạng");
      return;
    }

    await openCycleMutation.mutateAsync({ reviewPeriod: normalized });
    await activeCycleQuery.refetch();
  };

  return (
    <SidebarProvider>
      <AppSidebar role={effectiveRole} variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background min-h-screen">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="page-heading">{t.TITLE}</h1>
                <p className="text-muted-foreground mt-1">{t.DESC}</p>
                {activeCycleQuery.data && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    Đợt đánh giá {activeCycleQuery.data.reviewPeriod} đang mở
                    đến{" "}
                    {new Date(activeCycleQuery.data.endAt).toLocaleString(
                      "vi-VN",
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {effectiveRole !== "employee" && (
                  <Button
                    type="button"
                    onClick={handleOpenCycle}
                    disabled={openCycleMutation.isPending}
                  >
                    {openCycleMutation.isPending
                      ? "Đang mở đợt..."
                      : "Mở đợt đánh giá (3 ngày)"}
                  </Button>
                )}

                <div className="relative w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder={t.SEARCH_PLACEHOLDER}
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Table Card */}
            <div className="card-soft">
              {isLoading ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  {t.LOADING_LIST}
                </div>
              ) : isError ? (
                <div className="py-16 text-center text-sm text-destructive">
                  {t.ERROR_FETCH}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>{t.TABLE_NAME}</TableHead>
                      <TableHead>{t.TABLE_ROLE}</TableHead>
                      <TableHead>{t.TABLE_SKILLS}</TableHead>
                      <TableHead className="text-right">
                        {t.TABLE_ACTIONS}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-12 text-center text-sm text-muted-foreground"
                        >
                          {t.EMPTY_LIST}
                        </TableCell>
                      </TableRow>
                    ) : (
                      members.map((member) => (
                        <TableRow key={member.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 border">
                                <AvatarImage
                                  src={member.avatar}
                                  alt={member.name}
                                />
                                <AvatarFallback>
                                  {member.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-foreground">
                                  {member.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {member.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`border-transparent ${member.roleColor}`}
                            >
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {/* Skills not in slim DTO — display department when available */}
                            {(data?.content ?? []).find(
                              (m) => m.id === member.id,
                            )?.departmentName ? (
                              <Badge variant="secondary">
                                {
                                  (data?.content ?? []).find(
                                    (m) => m.id === member.id,
                                  )?.departmentName
                                }
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {"—"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-primary hover:bg-primary/10"
                                title={t.BTN_VIEW_EVALUATION}
                                aria-label={t.BTN_VIEW_EVALUATION}
                                onClick={() => {
                                  setSelectedMember(member);
                                  setSheetMode("view");
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-primary hover:bg-primary/10"
                                title={t.BTN_EVALUATE}
                                aria-label={t.BTN_EVALUATE}
                                onClick={() => {
                                  setSelectedMember(member);
                                  setSheetMode("edit");
                                }}
                              >
                                <Star className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-5 py-3 bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  {t.PAGINATION_SHOW}{" "}
                  <span className="font-medium text-foreground">
                    {totalElements === 0 ? 0 : page * PAGE_SIZE + 1}
                    {"–"}
                    {Math.min((page + 1) * PAGE_SIZE, totalElements)}
                  </span>{" "}
                  {t.PAGINATION_IN}{" "}
                  <span className="font-medium text-foreground">
                    {totalElements}
                  </span>{" "}
                  {t.PAGINATION_MEMBERS}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i}
                      size="icon"
                      variant={i === page ? "default" : "ghost"}
                      className={`w-8 h-8 ${i === page ? "bg-[#e41b21] hover:bg-[#c9181d] text-white" : ""}`}
                      onClick={() => setPage(i)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= totalPages - 1}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <MemberEvaluationSheet
          member={selectedMember}
          open={!!selectedMember}
          mode={sheetMode}
          initialScores={selectedMember ? savedReviews[selectedMember.id]?.scores : undefined}
          initialComment={selectedMember ? savedReviews[selectedMember.id]?.comment : undefined}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedMember(null);
              setSheetMode("view");
            }
          }}
          onSubmit={async ({ scores, comment }) => {
            if (!selectedMember) {
              return;
            }
            if (!activeCycleQuery.data?.reviewPeriod) {
              toast.error("Hiện chưa có đợt đánh giá đang mở");
              return;
            }

            await saveReviewMutation.mutateAsync({
              revieweeId: selectedMember.id,
              reviewType: effectiveRole === "employee" ? "PEER" : "MANAGER",
              reviewPeriod: activeCycleQuery.data.reviewPeriod,
              scores: {
                expertise: Number(scores["expertise"] ?? 0),
                communication: Number(scores["communication"] ?? 0),
                attitude: Number(scores["attitude"] ?? 0),
              },
              comment,
            });

            setSelectedMember(null);
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

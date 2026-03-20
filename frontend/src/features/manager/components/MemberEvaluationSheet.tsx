import { Download, Info, MessageCircle, Star, UserCheck, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { SYSTEM_MESSAGES } from "@/constants/messages"
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations"

export type Member = {
  id: number;
  name: string;
  email: string;
  role: string;
  roleColor: string;
  skills: string[];
  avatar: string;
};

type EvaluationCriterion = {
  key: string;
  label: string;
  description: string;
  score: number;
  rating: string;
  ratingClass: string;
  icon: React.ReactNode;
};

type MemberEvaluationSheetProps = {
  member: Member | null;
  open: boolean;
  mode?: "view" | "edit";
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: {
    scores: Record<string, number>;
    comment: string;
  }) => void;
};

function getEvaluationForMember(
  member: Member,
  t: typeof SYSTEM_MESSAGES.MEMBER_LIST,
) {
  // Mocked evaluation data per member (based on id to vary slightly)
  const base = 80 + (member.id % 3) * 3;

  const criteria: EvaluationCriterion[] = [
    {
      key: "expertise",
      label: t.SHEET_CRITERIA_EXPERTISE,
      description: t.SHEET_CRITERIA_DESC_EXPERTISE,
      score: base + 5,
      rating: base + 5 >= 90 ? t.SHEET_RATING_EXCELLENT : t.SHEET_RATING_GOOD,
      ratingClass:
        base + 5 >= 90
          ? "bg-emerald-100 text-emerald-700"
          : "bg-primary/10 text-primary",
      icon: <Star className="w-4 h-4" />,
    },
    {
      key: "communication",
      label: t.SHEET_CRITERIA_COMMUNICATION,
      description: t.SHEET_CRITERIA_DESC_COMMUNICATION,
      score: base,
      rating:
        base >= 85 ? t.SHEET_RATING_GOOD : t.SHEET_RATING_NEEDS_IMPROVEMENT,
      ratingClass:
        base >= 85
          ? "bg-primary/10 text-primary"
          : "bg-amber-100 text-amber-700",
      icon: <MessageCircle className="w-4 h-4" />,
    },
    {
      key: "attitude",
      label: t.SHEET_CRITERIA_ATTITUDE,
      description: t.SHEET_CRITERIA_DESC_ATTITUDE,
      score: base + 2,
      rating:
        base + 2 >= 85 ? t.SHEET_RATING_GOOD : t.SHEET_RATING_NEEDS_IMPROVEMENT,
      ratingClass:
        base + 2 >= 85
          ? "bg-primary/10 text-primary"
          : "bg-amber-100 text-amber-700",
      icon: <UserCheck className="w-4 h-4" />,
    },
  ];

  const totalScore = Math.round(
    (criteria.reduce((acc, cur) => acc + cur.score, 0) /
      (criteria.length * 100)) *
      100,
  );
  const rank =
    totalScore >= 90
      ? t.SHEET_RANK_A
      : totalScore >= 80
        ? t.SHEET_RANK_B
        : t.SHEET_RANK_C;

  const radarPoints = "100,30 170,100 100,160 50,100";

  return { criteria, totalScore, rank, radarPoints };
}

export function MemberEvaluationSheet({ member, open, mode = "view", onOpenChange, onSubmit }: Readonly<MemberEvaluationSheetProps>) {
  const t = SYSTEM_MESSAGES.MEMBER_LIST
  const baseline = useMemo(() => {
    if (!member) { return { criteria: [], totalScore: 0, rank: "", radarPoints: "" }; }
    return getEvaluationForMember(member, t);
  }, [member, t])

  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(baseline.criteria.map((c) => [c.key, c.score])),
  );
  const [comment, setComment] = useState<string>(t.SHEET_COMMENT_TEXT);

  useEffect(() => {
    setScores(Object.fromEntries(baseline.criteria.map((c) => [c.key, c.score])))
    setComment(t.SHEET_COMMENT_TEXT)
  }, [baseline.criteria, member?.id, t.SHEET_COMMENT_TEXT])

  const totalScore = useMemo(() => {
    const values = Object.values(scores)
    if (!values.length) { return 0; }
    const sum = values.reduce((acc, cur) => acc + cur, 0)
    return Math.round(sum / values.length)
  }, [scores])

  const rank = useMemo(() => {
    if (totalScore >= 90) { return t.SHEET_RANK_A; }
    if (totalScore >= 80) { return t.SHEET_RANK_B; }
    return t.SHEET_RANK_C
  }, [totalScore, t])

  const getRating = (value: number) => {
    if (value >= 90) { return t.SHEET_RATING_EXCELLENT; }
    if (value >= 80) { return t.SHEET_RATING_GOOD; }
    return t.SHEET_RATING_NEEDS_IMPROVEMENT
  }

  const getRatingClass = (value: number) => {
    if (value >= 90) { return "bg-emerald-100 text-emerald-700"; }
    if (value >= 80) { return "bg-primary/10 text-primary"; }
    return "bg-amber-100 text-amber-700"
  }

  const [submitting, setSubmitting] = useState(false)

  if (!member) { return null; }

  const handleSubmit = async () => {
    const hasEmpty = Object.values(scores).some(
      (s) => s === null || s === undefined || Number.isNaN(Number(s)),
    );
    if (hasEmpty) {
      toast.error(FORM_VALIDATION_MESSAGES.MISSING_CONTENT)
      return
    }
    setSubmitting(true);
    try {
      // Backend evaluation API not yet implemented — simulate success
      // When ready: await evaluationService.submit({ memberId: member.id, scores, comment })
      await new Promise((resolve) => setTimeout(resolve, 800))
      onSubmit?.({ scores, comment })
      toast.success(t.SHEET_SUBMIT_SUCCESS)
      onOpenChange(false)
    } catch {
      toast.error(t.SHEET_SUBMIT_ERROR)
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportPDF = () => {
    if (!member) { return; }
    const rows = baseline.criteria.map((c) =>
      `<div class="score-row"><span class="label">${c.label}</span><span class="score">${scores[c.key] ?? c.score}/100</span></div>`
    ).join("")
    const html = `<html><head><title>Danh gia - ${member.name}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:32px;color:#1e293b}
        h1{font-size:22px;font-weight:bold;margin-bottom:4px}
        .sub{color:#64748b;font-size:13px;margin-bottom:24px}
        .meta{background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:20px}
        .meta p{margin:4px 0;font-size:14px}
        .total{background:#fef2f2;border-left:4px solid #e41b21;padding:16px;border-radius:4px;margin-bottom:20px}
        .score-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e2e8f0}
        .label{font-weight:600;font-size:14px}
        .score{font-weight:bold;color:#e41b21;font-size:16px}
        .comment{background:#f8fafc;padding:16px;border-radius:8px;font-size:13px;line-height:1.6;margin-top:20px}
        @media print{body{padding:16px}}
      </style></head><body>
      <h1>Phiếu đánh giá năng lực</h1>
      <div class="sub">Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}</div>
      <div class="meta">
        <p><strong>Họ và tên:</strong> ${member.name}</p>
        <p><strong>Email:</strong> ${member.email}</p>
        <p><strong>Vị trí:</strong> ${member.role}</p>
        <p><strong>Mã NV:</strong> ${member.id}</p>
      </div>
      <div class="total"><strong>Tổng điểm: ${totalScore}/100 — Xếp loại: ${rank}</strong></div>
      ${rows}
      <div class="comment"><strong>Nhận xét:</strong><br/>${comment}</div>
      </body></html>`
    const win = window.open("", "_blank")
    if (!win) { toast.error(t.SHEET_EXPORT_POPUP_ERROR); return; }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
    toast.success(t.SHEET_EXPORT_SUCCESS)
  }

  const canEdit = mode === "edit";

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) { onOpenChange(false); } }}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-l shadow-2xl">
        <div className="px-5 py-4 border-b bg-muted/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />

          <SheetHeader className="text-left space-y-1">
            <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
              {canEdit ? t.SHEET_EDIT_TITLE : t.SHEET_TITLE}
            </SheetTitle>
            <SheetDescription className="text-sm font-medium text-muted-foreground">
              {canEdit ? t.SHEET_EDIT_DESC : t.SHEET_DESC}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Avatar className="w-14 h-14 border">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {member.name}
                </p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
                <p className="text-sm font-medium text-primary mt-1">{member.role}</p>
                <p className="text-xs text-muted-foreground">{t.SHEET_EMP_CODE_LABEL}{":"} {member.id}</p>
              </div>
            </div>

            {/* Role indicator
            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-start gap-3">
              <Info className="text-primary text-xl" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.SHEET_ROLE_LABEL}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {t.SHEET_ROLE_DESC}
                  <span className="font-bold text-primary">{member.role}</span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => {}}
              >
                {t.SHEET_ROLE_CHANGE}
              </Button>
            </div> */}

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 rounded-lg p-3 bg-white dark:bg-slate-900 shadow-sm border-l-4 border-primary">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  {t.SHEET_TOTAL_SCORE}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-primary text-3xl font-bold leading-tight">{totalScore}</span>
                  <span className="text-slate-400 text-lg font-medium">{"/100"}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-lg p-3 bg-white dark:bg-slate-900 shadow-sm border-l-4 border-emerald-500">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  {t.SHEET_RANK}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 text-2xl font-bold leading-tight">
                    {rank}
                  </span>
                </div>
              </div>
            </div>

            {/* Radar chart
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm flex flex-col items-center">
              <h3 className="text-slate-900 dark:text-white text-sm font-bold w-full mb-4">
                {t.SHEET_CRITERIA}
              </h3>
              <div className="relative w-full aspect-square max-w-[240px]">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  <circle className="radar-grid" cx="100" cy="100" r="80" />
                  <circle className="radar-grid" cx="100" cy="100" r="60" />
                  <circle className="radar-grid" cx="100" cy="100" r="40" />
                  <circle className="radar-grid" cx="100" cy="100" r="20" />
                  <line className="radar-grid" x1="100" x2="100" y1="20" y2="180" />
                  <line className="radar-grid" x1="20" x2="180" y1="100" y2="100" />
                  <polygon className="radar-area" points={evaluation.radarPoints} />
                </svg>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-[10px] font-bold text-slate-500 uppercase">
                  {t.SHEET_CRITERIA_EXPERTISE}
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 text-[10px] font-bold text-slate-500 uppercase">
                  {t.SHEET_CRITERIA_ATTITUDE}
                </div>
                <div className="absolute top-1/2 right-0 translate-x-4 -translate-y-1/2 text-[10px] font-bold text-slate-500 uppercase rotate-90">
                  {t.SHEET_CRITERIA_COMMUNICATION}
                </div>
                <div className="absolute top-1/2 left-0 -translate-x-4 -translate-y-1/2 text-[10px] font-bold text-slate-500 uppercase -rotate-90">
                  {t.SHEET_CRITERIA_DISCIPLINE}
                </div>
              </div>
            </div> */}

            {/* Criteria breakdown */}
            <div className="space-y-3">
              {baseline.criteria.map((criterion) => {
                const score = scores[criterion.key] ?? criterion.score;
                const rating = canEdit ? getRating(score) : criterion.rating;
                const ratingClass = canEdit
                  ? getRatingClass(score)
                  : criterion.ratingClass;

                return (
                  <div
                    key={criterion.key}
                    className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {criterion.icon}
                      </div>
                      <div>
                        <p className="text-slate-900 dark:text-white text-sm font-bold">
                          {criterion.label}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">
                          {criterion.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {canEdit ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={score}
                            onChange={(e) => {
                              const next = Math.min(
                                100,
                                Math.max(0, Number(e.target.value)),
                              );
                              setScores((prev) => ({
                                ...prev,
                                [criterion.key]: next,
                              }));
                            }}
                            placeholder={t.SHEET_SCORE_PLACEHOLDER}
                            className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded h-9 px-2 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          />
                          <span className="text-sm font-semibold text-slate-500">{"/ 100"}</span>
                        </div>
                      ) : (
                        <p className="text-slate-900 dark:text-white font-bold text-base">
                          {criterion.score}{"/100"}
                        </p>
                      )}
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md ${ratingClass} text-[10px] font-bold`}
                      >
                        {rating}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Manager comment */}
            {canEdit ? (
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t.SHEET_COMMENT_TITLE}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t.SHEET_COMMENT_PLACEHOLDER}
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                />
                <p className="text-[11px] text-slate-400 italic">
                  {t.SHEET_COMMENT_HELPER}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 italic relative">
                <span className="absolute -top-3 -left-1 text-4xl text-primary/10 font-serif">{'"'}</span>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {t.SHEET_COMMENT_TEXT}
                </p>
                <div className="mt-4 flex items-center gap-2 not-italic">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                    {t.SHEET_COMMENT_AUTHOR_NAME.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white text-xs font-bold leading-none">
                      {t.SHEET_COMMENT_AUTHOR_NAME}
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      {t.SHEET_COMMENT_AUTHOR_ROLE}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t bg-muted/20 flex flex-col sm:flex-row gap-3">
          {canEdit ? (
            <>
              <Button
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2 py-3"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
                {t.SHEET_CANCEL}
              </Button>
              <Button
                className="flex-1 flex items-center justify-center gap-2 py-3"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? t.SHEET_SUBMITTING : t.SHEET_SUBMIT}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                className="flex-1 flex items-center justify-center gap-2"
                onClick={handleExportPDF}
              >
                <Download className="w-4 h-4" />
                {t.SHEET_EXPORT}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                {t.SHEET_CLOSE}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

import React from "react"
import { Download, MessageCircle, Star, UserCheck, X, Users, ClipboardList, Plus, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SYSTEM_MESSAGES } from "@/constants/messages"
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations"
import { useAggregateReview } from "../hooks/usePerformanceReview"
import { useMeetings, useCreateMeeting, useDeleteMeeting } from "../hooks/useOneOnOne"
import type { AggregateReviewResponse, ReviewBreakdown } from "@/services/memberService"

export type Member = {
  id: number; name: string; email: string;
  isSelf?: boolean;
  role: string; roleColor: string; skills: string[]; avatar: string;
};

type Tab = "360" | "meeting";

type MemberEvaluationSheetProps = {
  member: Member | null;
  open: boolean;
  mode?: "view" | "edit";
  onOpenChange: (open: boolean) => void;
  initialScores?: Record<string, number>;
  initialComment?: string;
  onSubmit?: (data: { scores: Record<string, number>; comment: string }) => void | Promise<void>;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function resolveRank(score: number, has: boolean): string {
  if (!has) return "—";
  if (score >= 90) return "Xuất sắc - A";
  if (score >= 80) return "Tốt - B";
  if (score >= 70) return "Khá - C";
  if (score >= 60) return "Trung bình - D";
  return "Cần cải thiện - E";
}

function rankClass(score: number, has: boolean): string {
  if (!has) return "text-slate-400";
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 80) return "text-primary";
  if (score >= 70) return "text-blue-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-500";
}

function getRating(v: number, t: typeof SYSTEM_MESSAGES.MEMBER_LIST): string {
  if (v >= 90) return t.SHEET_RATING_EXCELLENT;
  if (v >= 80) return t.SHEET_RATING_GOOD;
  if (v >= 60) return "Khá";
  return t.SHEET_RATING_NEEDS_IMPROVEMENT;
}

function getRatingClass(v: number): string {
  if (v >= 90) return "bg-emerald-100 text-emerald-700";
  if (v >= 80) return "bg-primary/10 text-primary";
  if (v >= 60) return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
}

function typeLabel(t: string): string {
  return { MANAGER: "Quản lý", SELF: "Tự đánh giá", PEER: "Đồng nghiệp", UPWARD: "Upward" }[t] ?? t;
}
function typeBadge(t: string): string {
  return { MANAGER: "bg-amber-100 text-amber-800", SELF: "bg-purple-100 text-purple-800",
           PEER: "bg-blue-100 text-blue-800", UPWARD: "bg-pink-100 text-pink-800" }[t] ?? "bg-slate-100 text-slate-700";
}

// ─── ScoreRow ────────────────────────────────────────────────────────────────

function ScoreRow({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
        </div>
        <span className="font-semibold w-8 text-right">{score}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${getRatingClass(score)}`}>
          {score >= 90 ? "Xuất sắc" : score >= 80 ? "Tốt" : score >= 60 ? "Khá" : "Cần cải thiện"}
        </span>
      </div>
    </div>
  );
}

// ─── BreakdownCard ────────────────────────────────────────────────────────────

function BreakdownCard({ r, label }: { r: ReviewBreakdown; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${typeBadge(r.reviewType)}`}>{label}</span>
          <span className="text-xs text-slate-500">{r.reviewerName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary text-sm">{r.totalScore}/100</span>
          <button className="text-xs text-slate-400 hover:text-primary" onClick={() => setOpen(v => !v)}>
            {open ? "Thu gọn" : "Chi tiết"}
          </button>
        </div>
      </div>
      {open && (
        <div className="space-y-1 pt-1 border-t border-slate-50 dark:border-slate-800">
          <ScoreRow label="Chuyên môn" score={r.expertiseScore} />
          <ScoreRow label="Giao tiếp"  score={r.communicationScore} />
          <ScoreRow label="Thái độ"    score={r.attitudeScore} />
          {r.comment && (
            <p className="text-xs italic text-slate-500 pt-1 border-t border-slate-50 dark:border-slate-800">{r.comment}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 360° view ────────────────────────────────────────────────────────────────

function AggregateView({ member }: { member: Member }) {
  const { data: agg, isLoading } = useAggregateReview(member.id);
  if (isLoading) return <div className="py-16 text-center text-sm text-muted-foreground">Đang tải...</div>;
  if (!agg) return null;
  const has = agg.overallScore !== null;
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Kỳ đánh giá</span>
        <Badge variant="outline" className="font-mono text-xs">{agg.reviewPeriod}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 rounded-lg p-3 bg-white dark:bg-slate-900 shadow-sm border-l-4 border-primary">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng điểm 360°</p>
          <div className="flex items-baseline gap-1">
            {has ? <><span className="text-primary text-3xl font-bold">{agg.overallScore}</span><span className="text-slate-400 text-lg">/100</span></>
                 : <span className="text-slate-400 text-3xl font-bold">—</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1 rounded-lg p-3 bg-white dark:bg-slate-900 shadow-sm border-l-4 border-emerald-500">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Xếp loại</p>
          <span className={`text-2xl font-bold ${rankClass(agg.overallScore ?? 0, has)}`}>{agg.overallRank}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { ok: agg.hasManagerReview, label: "Quản lý",      cls: "bg-amber-100 text-amber-800" },
          { ok: agg.hasSelfReview,    label: "Tự đánh giá",  cls: "bg-purple-100 text-purple-800" },
          { ok: agg.peerReviewCount > 0, label: `Đồng nghiệp (${agg.peerReviewCount})`, cls: "bg-blue-100 text-blue-800" },
          { ok: agg.hasUpwardReview,  label: "Upward",        cls: "bg-pink-100 text-pink-800" },
        ].map(({ ok, label, cls }) => (
          <span key={label} className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ok ? cls : "bg-slate-100 text-slate-400"}`}>
            {ok ? "✓" : "○"} {label}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 italic">Trọng số: Quản lý 40% · Đồng nghiệp 30% · Tự đánh giá 20% · Upward 10%</p>
      <div className="space-y-2">
        {agg.managerReview  && <BreakdownCard r={agg.managerReview}  label={typeLabel("MANAGER")} />}
        {agg.selfReview     && <BreakdownCard r={agg.selfReview}     label={typeLabel("SELF")} />}
        {agg.peerReviews.map(r => <BreakdownCard key={r.reviewId} r={r} label={typeLabel("PEER")} />)}
        {agg.upwardReview   && <BreakdownCard r={agg.upwardReview}   label={typeLabel("UPWARD")} />}
        {agg.totalReviewers === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">Chưa có đánh giá nào trong kỳ này.</div>
        )}
      </div>
    </div>
  );
}

// ─── One-on-one tab ───────────────────────────────────────────────────────────

function OneOnOneView({ member }: { member: Member }) {
  const { data, isLoading } = useMeetings(member.id);
  const createMutation = useCreateMeeting();
  const deleteMutation = useDeleteMeeting(member.id);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ meetingDate: "", agenda: "", notes: "", actionItems: "" });

  const handleCreate = async () => {
    if (!form.meetingDate) { toast.error("Chọn ngày họp"); return; }
    await createMutation.mutateAsync({
      employeeId: member.id, meetingDate: form.meetingDate,
      agenda: form.agenda || undefined, notes: form.notes || undefined,
      actionItems: form.actionItems || undefined,
    });
    setForm({ meetingDate: "", agenda: "", notes: "", actionItems: "" });
    setShowForm(false);
  };

  const meetings = data?.content ?? [];
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Lịch sử buổi 1-on-1 với {member.name}</p>
        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowForm(v => !v)}>
          <Plus className="w-3 h-3" />Ghi chú mới
        </Button>
      </div>
      {showForm && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 space-y-2">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Buổi họp mới</p>
          <input type="date" value={form.meetingDate}
            onChange={e => setForm(f => ({ ...f, meetingDate: e.target.value }))}
            className="w-full border border-slate-200 dark:border-slate-700 rounded p-2 text-sm bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/20" />
          <input placeholder="Chủ đề / agenda" value={form.agenda}
            onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))}
            className="w-full border border-slate-200 dark:border-slate-700 rounded p-2 text-sm bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/20" />
          <textarea placeholder="Nội dung trao đổi..." rows={3} value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="w-full border border-slate-200 dark:border-slate-700 rounded p-2 text-sm bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          <textarea placeholder="Action items..." rows={2} value={form.actionItems}
            onChange={e => setForm(f => ({ ...f, actionItems: e.target.value }))}
            className="w-full border border-slate-200 dark:border-slate-700 rounded p-2 text-sm bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending} className="flex-1">
              {createMutation.isPending ? "Đang lưu..." : "Lưu bản ghi"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
          </div>
        </div>
      )}
      {isLoading ? <p className="text-sm text-slate-400 text-center py-8">Đang tải...</p>
        : meetings.length === 0 ? <p className="text-sm text-slate-400 text-center py-12">Chưa có buổi 1-on-1 nào.</p>
        : (
          <div className="space-y-2">
            {meetings.map(m => (
              <div key={m.id} className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{new Date(m.meetingDate).toLocaleDateString("vi-VN")}</span>
                  <button className="text-slate-300 hover:text-red-500 transition-colors" onClick={() => deleteMutation.mutate(m.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {m.agenda && <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{m.agenda}</p>}
                {m.notes && <p className="text-xs text-slate-500 leading-relaxed">{m.notes}</p>}
                {m.actionItems && (
                  <div className="pt-1 border-t border-slate-50 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Action items</p>
                    <p className="text-xs text-primary">{m.actionItems}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Edit form ────────────────────────────────────────────────────────────────

function EditForm({ member, initialScores, initialComment, onOpenChange, onSubmit }:
  Pick<MemberEvaluationSheetProps, "member" | "initialScores" | "initialComment" | "onOpenChange" | "onSubmit"> & { member: Member }) {
  const t = SYSTEM_MESSAGES.MEMBER_LIST;
  const defaultScores = { expertise: 0, communication: 0, attitude: 0 };
  const [scores, setScores] = useState<Record<string, number>>(initialScores ?? defaultScores);
  const [comment, setComment] = useState(initialComment ?? "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (initialScores) setScores(initialScores); }, [initialScores]);
  useEffect(() => { if (initialComment !== undefined) setComment(initialComment); }, [initialComment]);

  const totalScore = useMemo(() => {
    const vals = Object.values(scores);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }, [scores]);
  const hasAnyScore = useMemo(() => Object.values(scores).some(s => s > 0), [scores]);

  const criteria = [
    { key: "expertise",     label: t.SHEET_CRITERIA_EXPERTISE,     desc: t.SHEET_CRITERIA_DESC_EXPERTISE,     icon: <Star className="w-4 h-4" /> },
    { key: "communication", label: t.SHEET_CRITERIA_COMMUNICATION, desc: t.SHEET_CRITERIA_DESC_COMMUNICATION, icon: <MessageCircle className="w-4 h-4" /> },
    { key: "attitude",      label: t.SHEET_CRITERIA_ATTITUDE,      desc: t.SHEET_CRITERIA_DESC_ATTITUDE,      icon: <UserCheck className="w-4 h-4" /> },
  ];

  const handleSubmit = async () => {
    const hasEmpty = Object.values(scores).some(s => s === null || s === undefined || Number.isNaN(Number(s)));
    if (hasEmpty) { toast.error(FORM_VALIDATION_MESSAGES.MISSING_CONTENT); return; }
    setSubmitting(true);
    try { await onSubmit?.({ scores, comment }); }
    catch { /* handled by mutation onError */ }
    finally { setSubmitting(false); }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 rounded-lg p-3 bg-white dark:bg-slate-900 shadow-sm border-l-4 border-primary">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t.SHEET_TOTAL_SCORE}</p>
            <div className="flex items-baseline gap-1">
              {hasAnyScore ? <><span className="text-primary text-3xl font-bold">{totalScore}</span><span className="text-slate-400 text-lg">/100</span></>
                           : <span className="text-slate-400 text-3xl font-bold">—</span>}
            </div>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 bg-white dark:bg-slate-900 shadow-sm border-l-4 border-emerald-500">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t.SHEET_RANK}</p>
            <span className={`text-2xl font-bold ${rankClass(totalScore, hasAnyScore)}`}>{resolveRank(totalScore, hasAnyScore)}</span>
          </div>
        </div>
        <div className="space-y-3">
          {criteria.map(c => {
            const score = scores[c.key] ?? 0;
            return (
              <div key={c.key} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{c.icon}</div>
                  <div>
                    <p className="text-sm font-bold">{c.label}</p>
                    <p className="text-xs text-slate-500">{c.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} max={100} value={score === 0 ? "" : score}
                      onChange={e => { const raw = e.target.value; setScores(p => ({ ...p, [c.key]: raw === "" ? 0 : Math.min(100, Math.max(0, Number(raw))) })); }}
                      placeholder={t.SHEET_SCORE_PLACEHOLDER}
                      className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded h-9 px-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    <span className="text-sm font-semibold text-slate-500">/ 100</span>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded-md ${getRatingClass(score)} text-[10px] font-bold`}>{getRating(score, t)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
          <label className="text-sm font-bold">{t.SHEET_COMMENT_TITLE}</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder={t.SHEET_COMMENT_PLACEHOLDER} rows={4}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
          <p className="text-[11px] text-slate-400 italic">{t.SHEET_COMMENT_HELPER}</p>
        </div>
      </div>
      <div className="px-5 py-4 border-t bg-muted/20 flex gap-3">
        <Button variant="outline" className="flex-1 py-3" onClick={() => onOpenChange?.(false)}>
          <X className="w-4 h-4 mr-2" />{t.SHEET_CANCEL}
        </Button>
        <Button className="flex-1 py-3" onClick={handleSubmit} disabled={submitting}>
          {submitting ? t.SHEET_SUBMITTING : t.SHEET_SUBMIT}
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MemberEvaluationSheet({ member, open, mode = "view", initialScores, initialComment, onOpenChange, onSubmit }: Readonly<MemberEvaluationSheetProps>) {
  const t = SYSTEM_MESSAGES.MEMBER_LIST;
  const [tab, setTab] = useState<Tab>("360");
  const canEdit = mode === "edit";
  const prevMemberRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (member?.id !== prevMemberRef.current) {
      prevMemberRef.current = member?.id ?? null;
      setTab("360");
    }
  }, [member?.id]);

  if (!member) return null;

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onOpenChange(false); }}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-l shadow-2xl">
        <div className="px-5 py-4 border-b bg-muted/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />
          <SheetHeader className="text-left space-y-1">
            <SheetTitle className="text-xl font-bold tracking-tight">{canEdit ? t.SHEET_EDIT_TITLE : t.SHEET_TITLE}</SheetTitle>
            <SheetDescription className="text-sm font-medium text-muted-foreground">{canEdit ? t.SHEET_EDIT_DESC : t.SHEET_DESC}</SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-5 py-3 border-b bg-muted/5 flex items-center gap-3">
          <Avatar className="w-12 h-12 border">
            <AvatarImage src={member.avatar} alt={member.name} />
            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-base font-semibold">{member.name}</p>
            <p className="text-xs text-muted-foreground">{member.email}</p>
            <p className="text-xs font-medium text-primary">{member.role}</p>
          </div>
        </div>

        {!canEdit && (
          <div className="flex border-b bg-muted/5">
            {([["360", "Đánh giá 360°", Users], ["meeting", "One-on-One", ClipboardList]] as const).map(([key, label, Icon]) => (
              <button key={key}
                className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${tab === key ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setTab(key as Tab)}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {canEdit ? (
            <EditForm member={member} initialScores={initialScores} initialComment={initialComment} onOpenChange={onOpenChange} onSubmit={onSubmit} />
          ) : tab === "360" ? (
            <AggregateView member={member} />
          ) : (
            <OneOnOneView member={member} />
          )}
        </div>

        {!canEdit && (
          <div className="px-5 py-4 border-t bg-muted/20">
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>{t.SHEET_CLOSE}</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

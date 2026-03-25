import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assetService, AssetRequestRow } from "@/services/assetService";
import { SYSTEM_MESSAGES } from "@/constants/messages";

export function AssetRequestsTab() {
  const [requests, setRequests] = useState<AssetRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetType, setAssetType] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState<
    "LOW" | "NORMAL" | "HIGH" | "URGENT"
  >("NORMAL");
  const [errors, setErrors] = useState<{ assetType?: string; reason?: string }>(
    {},
  );

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await assetService.getMyAssetRequests(0, 50);
      setRequests(res.content);
    } catch (_error) {
      toast.error(SYSTEM_MESSAGES.ASSET_REQUEST.MSG_FETCH_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleOpenModal = () => {
    setAssetType("");
    setReason("");
    setPriority("NORMAL");
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const newErrors: { assetType?: string; reason?: string } = {};
    if (!assetType.trim()) {
      newErrors.assetType = "Vui lòng nhập loại tài sản.";
    }
    if (!reason.trim() || reason.trim().length < 10) {
      newErrors.reason = "Vui lòng nhập lý do tối thiểu 10 ký tự.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await assetService.submitAssetRequest({
        assetType,
        reason,
        priority,
      });
      toast.success(SYSTEM_MESSAGES.ASSET_REQUEST.MSG_CREATE_SUCCESS);
      setIsModalOpen(false);
      fetchRequests();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          SYSTEM_MESSAGES.ASSET_REQUEST.MSG_CREATE_ERROR,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">
            {SYSTEM_MESSAGES.ASSET_REQUEST.TITLE_EMPLOYEE}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {SYSTEM_MESSAGES.ASSET_REQUEST.DESC_EMPLOYEE}
          </p>
        </div>
        <Button
          onClick={handleOpenModal}
          className="h-9 gap-2 shadow-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {SYSTEM_MESSAGES.ASSET_REQUEST.BTN_CREATE}
        </Button>
      </div>

      <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_REQUEST_ID}
              </TableHead>
              <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_ASSET_TYPE}
              </TableHead>
              <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_PRIORITY}
              </TableHead>
              <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_DATE}
              </TableHead>
              <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_STATUS}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="w-5 h-5 mx-auto animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : requests.length > 0 ? (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="px-5 py-3 text-sm font-medium text-foreground">
                    #{request.requestId}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-sm font-medium text-foreground">
                    {request.assetType}
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    <Badge className={request.priorityColor}>
                      {request.priorityLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                    {request.dateRequested}
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    <Badge className={request.statusColor}>
                      {request.statusLabel}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  {SYSTEM_MESSAGES.ASSET_REQUEST.EMPTY_TITLE}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {SYSTEM_MESSAGES.ASSET_REQUEST.MODAL_CREATE_TITLE}
            </DialogTitle>
            <DialogDescription>
              {SYSTEM_MESSAGES.ASSET_REQUEST.MODAL_CREATE_DESC}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {SYSTEM_MESSAGES.ASSET_REQUEST.LABEL_ASSET_TYPE}{" "}
                <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder={SYSTEM_MESSAGES.ASSET_REQUEST.PLACEHOLDER_TYPE}
                value={assetType}
                onChange={(e) => {
                  setAssetType(e.target.value);
                  setErrors((prev) => ({ ...prev, assetType: undefined }));
                }}
              />
              {errors.assetType && (
                <p className="text-red-500 text-xs">{errors.assetType}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {SYSTEM_MESSAGES.ASSET_REQUEST.LABEL_PRIORITY}
              </label>
              <Select
                value={priority}
                onValueChange={(val: any) => setPriority(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Thấp</SelectItem>
                  <SelectItem value="NORMAL">Bình thường</SelectItem>
                  <SelectItem value="HIGH">Cao</SelectItem>
                  <SelectItem value="URGENT">Khẩn cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {SYSTEM_MESSAGES.ASSET_REQUEST.LABEL_REASON}{" "}
                <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder={SYSTEM_MESSAGES.ASSET_REQUEST.PLACEHOLDER_REASON}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setErrors((prev) => ({ ...prev, reason: undefined }));
                }}
                className="resize-none h-24"
              />
              {errors.reason && (
                <p className="text-red-500 text-xs">{errors.reason}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              {SYSTEM_MESSAGES.ASSET_REQUEST.BTN_CANCEL}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {SYSTEM_MESSAGES.ASSET_REQUEST.BTN_SUBMIT}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

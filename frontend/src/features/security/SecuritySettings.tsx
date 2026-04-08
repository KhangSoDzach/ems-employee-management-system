/**
 * @file SecuritySettings.tsx
 * @description Thành phần quản lý cài đặt bảo mật và tùy chỉnh giao diện người dùng.
 * Component for managing security settings and user interface customization.
 */

import * as React from "react";
import {
  ShieldCheck,
  Copy,
  CheckCircle2,
  QrCode,
  AlertTriangle,
  Bell,
  Moon,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverArrow,
} from "@/components/ui/popover";
import { SECURITY_CONSTANTS as TEXT } from "@/constants/security";
import { useTheme } from "@/contexts/useTheme";
import {
  disable2FA,
  get2FAStatus,
  setup2FA,
  verify2FA,
} from "./securityService";

// --- SidebarSettings Component ---

interface SidebarSettingsProps {
  isNotificationsEnabled?: boolean;
  setIsNotificationsEnabled?: (value: boolean) => void;
}

/**
 * @component SidebarSettings
 * @description Thành phần thanh bên cho phép người dùng cấu hình 2FA và chế độ tối/sáng.
 * Sidebar component allowing users to configure 2FA and dark/light mode.
 */
/**
 * SidebarSettings Component (Security & Preferences)
 * A slide-out interface for managing personal account security and UI preferences.
 *
 * Capabilities:
 * - 2FA Management: Enable/Disable Two-Factor Authentication with QR code and recovery codes.
 * - Security Notifications: Toggle system-wide security alerts and notifications.
 * - Visual Personalization: Seamless switching between Dark Mode and Light Mode.
 * - Session Management: Integrated secure logout functionality.
 * - Responsive Feedback: Real-time UI updates reflecting security status changes.
 */
export default function SidebarSettings({
  isNotificationsEnabled: externalNotificationsEnabled,
  setIsNotificationsEnabled: setExternalNotificationsEnabled,
}: SidebarSettingsProps = {}) {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  // 2FA States
  const [is2faEnabled, setIs2faEnabled] = React.useState(false);
  const [showEnableDialog, setShowEnableDialog] = React.useState(false);
  const [showDisableDialog, setShowDisableDialog] = React.useState(false);
  const [twoFaStep, setTwoFaStep] = React.useState<"setup" | "recovery">(
    "setup",
  );
  const [otpValue, setOtpValue] = React.useState("");
  const [disablePassword, setDisablePassword] = React.useState("");

  const [setupSecret, setSetupSecret] = React.useState("");
  const [setupQrCode, setSetupQrCode] = React.useState("");
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([]);

  const statusQuery = useQuery({
    queryKey: ["security", "2fa", "status"],
    queryFn: get2FAStatus,
  });

  React.useEffect(() => {
    if (typeof statusQuery.data === "boolean") {
      setIs2faEnabled(statusQuery.data);
    }
  }, [statusQuery.data]);

  const setupMutation = useMutation({
    mutationFn: setup2FA,
  });

  const verifyMutation = useMutation({
    mutationFn: verify2FA,
  });

  const disableMutation = useMutation({
    mutationFn: disable2FA,
  });

  const handleToggle2FA = async (checked: boolean) => {
    if (checked) {
      try {
        const payload = await setupMutation.mutateAsync();
        setSetupSecret(payload.secret ?? "");
        setSetupQrCode(payload.qrCode ?? "");
        setRecoveryCodes([]);
        setTwoFaStep("setup");
        setOtpValue("");
        setShowEnableDialog(true);
      } catch (error) {
        const message = (
          error as { response?: { data?: { message?: string } } }
        )?.response?.data?.message;
        toast.error(message ?? TEXT.SIDEBAR_SETTINGS.LOGOUT_ERROR);
        setIs2faEnabled(false);
      }
    } else {
      setShowDisableDialog(true);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpValue.length !== 6) {
      return;
    }

    try {
      const payload = await verifyMutation.mutateAsync(otpValue);
      setRecoveryCodes(payload.recoveryCodes ?? []);
      setIs2faEnabled(true);
      setTwoFaStep("recovery");
      queryClient.invalidateQueries({
        queryKey: ["security", "2fa", "status"],
      });
      toast.success(TEXT.TWO_FACTOR.MSG_ENABLE_SUCCESS);
    } catch (_) {
      toast.dismiss();
      toast.error(TEXT.TWO_FACTOR.MSG_INVALID_OTP);
    }
  };

  const handleConfirmDisable = async () => {
    if (!disablePassword) {
      return;
    }

    try {
      await disableMutation.mutateAsync(disablePassword);
      setIs2faEnabled(false);
      setShowDisableDialog(false);
      setDisablePassword("");
      setSetupSecret("");
      setSetupQrCode("");
      setRecoveryCodes([]);
      queryClient.invalidateQueries({
        queryKey: ["security", "2fa", "status"],
      });
      toast.success(TEXT.TWO_FACTOR.MSG_DISABLE_SUCCESS);
      toast.info(TEXT.TWO_FACTOR.MSG_EMAIL_SENT);
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message ?? TEXT.TWO_FACTOR.ALERT_DISABLE_DESC);
    }
  };

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const { isDark, setTheme } = useTheme();

  const [internalNotificationsEnabled, setInternalNotificationsEnabled] =
    React.useState(true);

  const isNotificationsEnabled =
    externalNotificationsEnabled ?? internalNotificationsEnabled;
  const setIsNotificationsEnabled =
    setExternalNotificationsEnabled ?? setInternalNotificationsEnabled;

  const handleDarkModeToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch {
      toast.error(TEXT.SIDEBAR_SETTINGS.LOGOUT_ERROR);
    }
  };

  function render2FAContent() {
    return (
      <div className="w-72 p-5 space-y-5">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
          {TEXT.SIDEBAR_SETTINGS.SECURITY_2FA}
        </h3>
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-muted-foreground/10">
          <div className="space-y-0.5">
            <p className="text-xs font-bold">
              {TEXT.TWO_FACTOR.LABEL_2FA_TOGGLE}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {is2faEnabled
                ? TEXT.TWO_FACTOR.STATUS_ENABLED
                : TEXT.TWO_FACTOR.STATUS_DISABLED}
            </p>
          </div>
          <Switch
            checked={is2faEnabled}
            onCheckedChange={handleToggle2FA}
            className="data-[state=checked]:bg-green-500 scale-90"
          />
        </div>

        {is2faEnabled && (
          <div className="p-3.5 border border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
            <h4 className="font-bold text-[10px] uppercase tracking-tight text-amber-600">
              {TEXT.TWO_FACTOR.RECOVERY_TITLE}
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {recoveryCodes.slice(0, 4).map((code) => (
                <div
                  key={code}
                  className="bg-card border-border border p-1.5 text-center rounded text-[9px] font-mono font-bold shadow-sm"
                >
                  {code}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-[10px] rounded-lg"
              onClick={() =>
                copyToClipboard(
                  recoveryCodes.join("\n"),
                  TEXT.TWO_FACTOR.COPY_SUCCESS,
                )
              }
            >
              <Copy size={10} className="mr-2" /> {TEXT.TWO_FACTOR.BTN_COPY}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-72 bg-card overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="p-4 pb-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {TEXT.SIDEBAR_SETTINGS.TITLE}
        </h2>
      </div>

      {/* User Info */}
      <div className="p-4 pt-2 flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-slate-100 dark:border-slate-800">
          <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
            {user?.firstName?.[0] || user?.username?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-bold truncate text-slate-900 dark:text-white">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {user?.email}
          </p>
        </div>
      </div>

      <Separator className="my-1 opacity-50" />

      {/* Preferences */}
      <div className="p-4 space-y-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {TEXT.SIDEBAR_SETTINGS.PREFERENCES}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-slate-500">
              <Bell size={18} />
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {TEXT.SIDEBAR_SETTINGS.NOTIFICATIONS}
            </span>
          </div>
          <Switch
            checked={isNotificationsEnabled}
            onCheckedChange={setIsNotificationsEnabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-slate-500">
              <Moon size={18} />
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {TEXT.SIDEBAR_SETTINGS.DARK_MODE}
            </span>
          </div>
          <Switch checked={isDark} onCheckedChange={handleDarkModeToggle} />
        </div>
      </div>

      <Separator className="my-1 opacity-50" />

      {/* Account */}
      <div className="p-4 space-y-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {TEXT.SIDEBAR_SETTINGS.ACCOUNT}
        </p>

        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-between w-full group py-1 outline-none">
              <div className="flex items-center gap-3">
                <div className="text-slate-500 group-hover:text-primary transition-colors">
                  <ShieldCheck size={18} />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 transition-colors">
                  {TEXT.SIDEBAR_SETTINGS.SECURITY_2FA}
                </span>
              </div>
              <ChevronRight
                size={14}
                className="text-slate-300 group-hover:text-slate-500 transition-colors"
              />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            sideOffset={24}
            alignOffset={-14}
            className="p-0 border border-border shadow-2xl rounded-2xl overflow-visible bg-card"
          >
            <PopoverArrow className="fill-card" width={12} height={6} />
            {render2FAContent()}
          </PopoverContent>
        </Popover>
      </div>

      <Separator className="my-1 opacity-50" />

      {/* Logout */}
      <div className="p-4">
        <Button
          variant="outline"
          className="w-full h-10 rounded-xl justify-center gap-2 font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          <span>{TEXT.SIDEBAR_SETTINGS.SIGN_OUT}</span>
        </Button>
      </div>

      {/* Enable 2FA Dialog */}
      <Dialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-2xl shadow-2xl">
          <DialogHeader className="p-8 pb-0 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <QrCode size={32} className="text-primary" />
            </div>
            <DialogTitle className="text-2xl">
              {TEXT.TWO_FACTOR.DIALOG_ENABLE_TITLE}
            </DialogTitle>
            <DialogDescription className="mt-2">
              {TEXT.TWO_FACTOR.DIALOG_ENABLE_DESC}
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 pt-6 space-y-6">
            {twoFaStep === "setup" && (
              <>
                <div className="flex justify-center bg-card p-4 rounded-2xl border-2 border-border shadow-inner">
                  {setupQrCode ? (
                    <img
                      src={setupQrCode}
                      alt="2FA QR"
                      className="w-40 h-40 border-4 border-muted rounded-lg"
                    />
                  ) : (
                    <div className="w-40 h-40 bg-muted flex items-center justify-center border-4 border-muted">
                      <QrCode size={100} className="text-slate-300" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase">
                    {TEXT.TWO_FACTOR.LABEL_SECRET_KEY}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={setupSecret}
                      className="font-mono text-xs font-bold text-center bg-muted/20 h-9"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() =>
                        copyToClipboard(
                          setupSecret,
                          TEXT.TWO_FACTOR.COPY_SUCCESS,
                        )
                      }
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-center">
                    <div className="flex gap-1.5">
                      {[...Array(6)].map((_, i) => (
                        <input
                          key={i}
                          type="text"
                          maxLength={1}
                          className="w-8 h-10 text-center border-2 rounded-lg font-bold text-lg focus:border-primary outline-none"
                          value={otpValue[i] || ""}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace") {
                              e.preventDefault();
                              const newOtpArr = otpValue.split("");
                              if (otpValue[i]) {
                                // Clear current
                                newOtpArr[i] = "";
                                setOtpValue(newOtpArr.join(""));
                              } else if (i > 0) {
                                // Move back and clear previous
                                newOtpArr[i - 1] = "";
                                setOtpValue(newOtpArr.join(""));
                                (
                                  e.currentTarget
                                    .previousSibling as HTMLInputElement
                                )?.focus();
                              }
                            } else if (e.key === "Enter") {
                              e.preventDefault();
                              if (otpValue.length === 6) {
                                handleVerifyOTP();
                              }
                            } else if (e.key === "ArrowLeft" && i > 0) {
                              (
                                e.currentTarget
                                  .previousSibling as HTMLInputElement
                              )?.focus();
                            } else if (e.key === "ArrowRight" && i < 5) {
                              (
                                e.currentTarget.nextSibling as HTMLInputElement
                              )?.focus();
                            }
                          }}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (val) {
                              const char = val.charAt(val.length - 1);
                              const newOtpArr = otpValue
                                .padEnd(6, " ")
                                .split("");
                              newOtpArr[i] = char;
                              const finalOtp = newOtpArr
                                .join("")
                                .replace(/\s/g, "");
                              setOtpValue(finalOtp);

                              if (i < 5) {
                                (
                                  e.currentTarget
                                    .nextSibling as HTMLInputElement
                                )?.focus();
                              }

                              // Auto-submit if complete
                              if (finalOtp.length === 6) {
                                setTimeout(() => handleVerifyOTP(), 10);
                              }
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pasteData = e.clipboardData
                              .getData("text")
                              .replace(/\D/g, "")
                              .slice(0, 6);
                            if (pasteData) {
                              setOtpValue(pasteData);
                              // Auto submit if 6 digits are pasted
                              if (pasteData.length === 6) {
                                setTimeout(() => handleVerifyOTP(), 0);
                              }
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <Button
                    className="w-full h-10 rounded-xl font-bold"
                    onClick={handleVerifyOTP}
                    disabled={otpValue.length < 6 || verifyMutation.isPending}
                  >
                    {TEXT.TWO_FACTOR.BTN_CONFIRM}
                  </Button>
                </div>
              </>
            )}

            {twoFaStep === "recovery" && (
              <div className="space-y-6 animate-in zoom-in duration-300">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-green-600" />
                  </div>
                  <p className="font-bold text-green-600">
                    {TEXT.TWO_FACTOR.MSG_ENABLE_SUCCESS}
                  </p>
                </div>
                <Button
                  className="w-full h-11 rounded-xl font-bold"
                  onClick={() => setShowEnableDialog(false)}
                >
                  {TEXT.TWO_FACTOR.BTN_DONE}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-2xl shadow-2xl">
          <DialogHeader className="p-8 pb-0 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <DialogTitle className="text-xl">
              {TEXT.TWO_FACTOR.ALERT_DISABLE_TITLE}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 pt-6 space-y-6">
            <Input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder={TEXT.SIDEBAR_SETTINGS.CONFIRM_PWD_PLACEHOLDER}
              className="h-11 rounded-xl"
            />
            <div className="flex flex-col gap-2">
              <Button
                className="w-full h-11 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white"
                onClick={handleConfirmDisable}
              >
                {TEXT.TWO_FACTOR.BTN_CONFIRM_DISABLE}
              </Button>
              <Button
                variant="ghost"
                className="w-full h-11 rounded-xl font-bold"
                onClick={() => setShowDisableDialog(false)}
              >
                {TEXT.TWO_FACTOR.BTN_CANCEL}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

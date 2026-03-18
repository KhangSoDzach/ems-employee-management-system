import { useState, useEffect } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label, RequiredLabel } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SYSTEM_MESSAGES } from "@/constants/messages";

const TEXT = {
  ...SYSTEM_MESSAGES.LOGIN,
  TOAST_VALIDATION_ERROR: "Vui lòng kiểm tra lại thông tin đăng nhập",
  LOADING: "Đang xác thực...",
  SUCCESS: "Đăng nhập thành công!",
};

const loginSchema = z.object({
  email: z.string().min(1, SYSTEM_MESSAGES.VALIDATION.EMAIL_REQUIRED),
  password: z.string().min(1, SYSTEM_MESSAGES.VALIDATION.PASSWORD_REQUIRED),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/** Trả về route home tương ứng với role của user */
function getRedirectByRole(roles: string[]): string {
  if (roles.includes("ROLE_ADMIN")) {
    return "/profile";
  }
  if (roles.includes("ROLE_HR")) {
    return "/profile";
  }
  if (roles.includes("ROLE_MANAGER")) {
    return "/profile";
  }
  return "/profile"; // ROLE_EMPLOYEE
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [show2faDialog, setShow2faDialog] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [isVerifying2fa, setIsVerifying2fa] = useState(false);
  const [pendingLoginData, setPendingLoginData] =
    useState<LoginFormValues | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  // Redirect nếu đã đăng nhập và không đang trong quá trình submit
  useEffect(() => {
    if (isAuthenticated && !isSubmitting && user) {
      navigate(getRedirectByRole(user.roles), { replace: true });
    }
  }, [isAuthenticated, isSubmitting, navigate, user]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setValue("email", savedEmail);
      setValue("remember", true);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginFormValues) => {
    toast.dismiss();

    const loadingId = toast.loading(TEXT.LOADING);
    try {
      const result = await login(data.email, data.password);

      if (result.twoFactorRequired) {
        toast.dismiss(loadingId);
        setPendingLoginData(data);
        setShow2faDialog(true);
        return;
      }

      if (!result.user) {
        throw new Error(SYSTEM_MESSAGES.VALIDATION.EMAIL_PASSWORD_INVALID);
      }

      if (data.remember) {
        localStorage.setItem("rememberedEmail", data.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      toast.dismiss(loadingId);
      toast.success(TEXT.SUCCESS);
      navigate(getRedirectByRole(result.user.roles), { replace: true });
    } catch (err: unknown) {
      toast.dismiss(loadingId);
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(
        apiErr.response?.data?.message ||
        SYSTEM_MESSAGES.VALIDATION.EMAIL_PASSWORD_INVALID,
      );
    }
  };

  const handleVerify2fa = async () => {
    if (otpValue.length < 6 || !pendingLoginData) {
      return;
    }

    setIsVerifying2fa(true);
    toast.dismiss();

    try {
      const result = await login(
        pendingLoginData.email,
        pendingLoginData.password,
        otpValue,
      );

      if (!result.user || result.twoFactorRequired) {
        toast.error(SYSTEM_MESSAGES.TWO_FACTOR_LOGIN.TOAST_INVALID);
        return;
      }

      if (pendingLoginData.remember) {
        localStorage.setItem("rememberedEmail", pendingLoginData.email);
      }

      setShow2faDialog(false);
      setOtpValue("");
      setPendingLoginData(null);
      toast.success(TEXT.SUCCESS);
      navigate(getRedirectByRole(result.user.roles), { replace: true });
    } catch {
      toast.error(SYSTEM_MESSAGES.TWO_FACTOR_LOGIN.TOAST_INVALID);
    } finally {
      setIsVerifying2fa(false);
    }
  };

  const onError = (errors: FieldErrors<LoginFormValues>) => {
    toast.dismiss();
    const firstErrorPath = Object.keys(
      errors,
    )[0] as keyof FieldErrors<LoginFormValues>;
    if (firstErrorPath) {
      toast.error(TEXT.TOAST_VALIDATION_ERROR);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-background overflow-hidden p-4">
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "#ffffff",
          backgroundImage: `
        radial-gradient(
          circle at top right,
          rgba(249, 86, 86, 0.938),
          transparent 70%
        )
      `,
          filter: "blur(80px)",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          maskImage: `radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)`,
        }}
      />
      <Card className="w-full max-w-md relative z-10 animate-slide-in-up shadow-2xl border border-muted-foreground/30">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="flex aspect-square size-16 mx-auto items-center justify-center rounded-lg bg-sidebar-primary/50 text-sidebar-primary-foreground overflow-hidden mb-2 shadow-sm border border-primary/20">
            <img src="/icon.png" className="size-full object-cover" alt="Logo" />
          </div>
          <CardTitle className="text-2xl font-bold">{TEXT.TITLE}</CardTitle>
          <CardDescription>{TEXT.DESC}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form
            onSubmit={handleSubmit(onSubmit, onError)}
            className="space-y-6"
          >
            <div className="space-y-2">
              <RequiredLabel
                htmlFor="email"
                className={errors.email ? "text-destructive" : ""}
              >
                {TEXT.LABEL_EMAIL}
              </RequiredLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  id="email"
                  placeholder={TEXT.PLACEHOLDER_EMAIL}
                  className={`pl-9 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <RequiredLabel
                htmlFor="password"
                className={errors.password ? "text-destructive" : ""}
              >
                {TEXT.LABEL_PASSWORD}
              </RequiredLabel>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />

                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={TEXT.PLACEHOLDER_PASSWORD}
                  className={`pl-9 pr-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  {...register("password")}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  onCheckedChange={(checked) =>
                    setValue("remember", checked as boolean)
                  }
                  defaultChecked={
                    localStorage.getItem("rememberedEmail") ? true : false
                  }
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {TEXT.LABEL_REMEMBER}
                </Label>
              </div>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-primary hover:underline font-medium"
              >
                {TEXT.LINK_FORGOT}
              </button>
            </div>

            <Button
              className="w-full font-bold"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  {TEXT.BTN_PROCESSING}
                </>
              ) : (
                TEXT.BTN_LOGIN
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2FA Login Dialog */}
      <Dialog open={show2faDialog} onOpenChange={setShow2faDialog}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="bg-primary/5 p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-primary/20">
              <ShieldCheck size={40} className="text-primary" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-slate-900">
                {SYSTEM_MESSAGES.TWO_FACTOR_LOGIN.TITLE}
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                {SYSTEM_MESSAGES.TWO_FACTOR_LOGIN.DESC}
              </DialogDescription>
            </div>
          </div>

          <div className="p-8 pt-6 space-y-8">
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block text-center">
                {SYSTEM_MESSAGES.TWO_FACTOR_LOGIN.LABEL_OTP}
              </label>

              <div className="flex justify-center gap-3">
                {[...Array(6)].map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    className="w-12 h-14 text-center border-2 border-slate-100 rounded-2xl font-bold text-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-slate-50/50"
                    value={otpValue[i] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      if (val) {
                        const newOtp = otpValue.split("");
                        newOtp[i] = val;
                        const finalOtp = newOtp.join("");
                        setOtpValue(finalOtp);
                        if (i < 5) {
                          (e.target.nextSibling as HTMLInputElement)?.focus();
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otpValue[i] && i > 0) {
                        const newOtp = otpValue.split("");
                        newOtp[i - 1] = "";
                        setOtpValue(newOtp.join(""));
                        (
                          e.currentTarget.previousSibling as HTMLInputElement
                        )?.focus();
                      }
                    }}
                  />
                ))}
              </div>

              <p className="text-[11px] text-center text-slate-400">
                {SYSTEM_MESSAGES.TWO_FACTOR_LOGIN.DESC}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                className="w-full h-12 rounded-2xl font-bold text-base shadow-lg shadow-primary/20"
                onClick={handleVerify2fa}
                disabled={otpValue.length < 6 || isVerifying2fa}
              >
                {isVerifying2fa ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                    {TEXT.BTN_PROCESSING}
                  </>
                ) : (
                  SYSTEM_MESSAGES.TWO_FACTOR_LOGIN.BTN_VERIFY
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full h-12 rounded-2xl font-bold text-slate-500 hover:text-slate-900 transition-colors"
                onClick={() => {
                  setShow2faDialog(false);
                  setOtpValue("");
                }}
              >
                <ArrowLeft size={18} className="mr-2" />
                {SYSTEM_MESSAGES.TWO_FACTOR_LOGIN.BTN_BACK}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

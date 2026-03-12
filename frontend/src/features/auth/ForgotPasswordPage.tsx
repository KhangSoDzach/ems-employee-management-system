import { useState, useEffect } from "react";
import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, ArrowLeft, KeyRound, Timer, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { forgotPassword, resetPassword, changePassword } from "./authService";
import { toast } from "sonner";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations";

const TEXT = {
    ...SYSTEM_MESSAGES.FORGOT_PASSWORD,
    TOAST_VALIDATION_ERROR: "Vui lòng kiểm tra lại các thông tin nhập liệu",
    LOADING_SEND_OTP: "Đang gửi mã OTP...",
    LOADING_RESET: "Đang cập nhật mật khẩu...",
    SUCCESS_RESET: "Đổi mật khẩu thành công!",
    LABEL_CURRENT_PASSWORD: "Mật khẩu hiện tại",
    PLACEHOLDER_CURRENT_PASSWORD: "Nhập mật khẩu hiện tại",
};

interface ForgotPasswordPageProps {
    isProfileMode?: boolean;
    userEmail?: string;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const emailSchema = z.object({
    email: z.string().email(FORM_VALIDATION_MESSAGES.EMAIL_INVALID),
});

const otpAndPasswordSchema = z.object({
    otp: z
        .string()
        .length(6, FORM_VALIDATION_MESSAGES.OTP_LENGTH)
        .regex(/^\d+$/, FORM_VALIDATION_MESSAGES.OTP_NUMERIC),
    newPassword: z
        .string()
        .min(8, FORM_VALIDATION_MESSAGES.PASSWORD_MIN),
    confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
    message: FORM_VALIDATION_MESSAGES.PASSWORD_MISMATCH,
    path: ["confirmPassword"],
});

const profileChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, FORM_VALIDATION_MESSAGES.REQUIRED),
    newPassword: z.string().min(8, FORM_VALIDATION_MESSAGES.PASSWORD_MIN),
    confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
    message: FORM_VALIDATION_MESSAGES.PASSWORD_MISMATCH,
    path: ["confirmPassword"],
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpPasswordFormValues = z.infer<typeof otpAndPasswordSchema>;
type ProfileChangePasswordFormValues = z.infer<typeof profileChangePasswordSchema>;
type ResetFormValues = OtpPasswordFormValues & ProfileChangePasswordFormValues;

// ─── Component ────────────────────────────────────────────────────────────────

export const ForgotPasswordPage = ({ isProfileMode = false, userEmail = "" }: ForgotPasswordPageProps) => {
    const navigate = useNavigate();

    /** 1 = enter email | 2 = enter OTP + new password | 3 = success */
    const [step, setStep] = useState<1 | 2 | 3>(isProfileMode ? 2 : 1);
    const [savedEmail, setSavedEmail] = useState(userEmail || "");
    const [timeLeft, setTimeLeft] = useState(300);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);

    // Sync savedEmail with userEmail prop securely
    useEffect(() => {
        if (isProfileMode && userEmail && userEmail !== savedEmail) {
            setSavedEmail(userEmail);
        }
    }, [isProfileMode, userEmail, savedEmail]);

    // ── Form: step 1 ──
    const {
        register: registerEmail,
        handleSubmit: handleSubmitEmail,
        formState: { errors: emailErrors, isSubmitting: isEmailSubmitting },
    } = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) });

    // ── Form: step 2 (Dual Mode: Reset with OTP or Change with Current Password) ──
    const {
        register: registerForm,
        handleSubmit: handleSubmitForm,
        setError: setFormError,
        formState: { errors: formErrors, isSubmitting: isFormSubmitting },
    } = useForm<ResetFormValues>({
        // @ts-expect-error - Dynamic resolver based on mode
        resolver: zodResolver(isProfileMode ? profileChangePasswordSchema : otpAndPasswordSchema)
    });

    // ── Timer ──
    useEffect(() => {
        if (!isTimerRunning || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setIsTimerRunning(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // ── Handlers ──

    const onSendCode = async (data: EmailFormValues) => {
        toast.dismiss();

        const promise = forgotPassword(data.email).then(() => {
            setSavedEmail(data.email);
            setStep(2);
            setTimeLeft(300);
            setIsTimerRunning(true);
        });

        toast.promise(promise, {
            loading: TEXT.LOADING_SEND_OTP,
            success: TEXT.TOAST_OTP_SENT,
            error: (err: unknown) => {
                return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? TEXT.TOAST_SEND_ERROR;
            },
        });
    };

    const onSubmitReset = async (data: ResetFormValues) => {
        toast.dismiss();

        const promise = isProfileMode
            ? changePassword(data.currentPassword, data.newPassword)
            : resetPassword(savedEmail, data.otp, data.newPassword);

        toast.promise(promise, {
            loading: TEXT.LOADING_RESET,
            success: TEXT.SUCCESS_RESET,
            error: (err: unknown) => {
                const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? (isProfileMode ? "Mật khẩu hiện tại không chính xác" : TEXT.TOAST_OTP_INVALID);

                if (isProfileMode) {
                    setFormError("currentPassword", { message });
                } else if (message.toLowerCase().includes("hết hạn") || message.toLowerCase().includes("expired")) {
                    setFormError("otp" as keyof ResetFormValues, { message: TEXT.TOAST_OTP_INVALID });
                } else {
                    setFormError("otp" as keyof ResetFormValues, { message });
                }
                return message;
            },
        });

        try {
            await promise;
            setStep(3);
        } catch (error) {
            console.error("Password change error:", error);
        }
    };

    const handleResend = async () => {
        if (timeLeft > 0 || isResending) return;
        toast.dismiss();
        setIsResending(true);

        const promise = forgotPassword(savedEmail).then(() => {
            setTimeLeft(300);
            setIsTimerRunning(true);
        }).finally(() => {
            setIsResending(false);
        });

        toast.promise(promise, {
            loading: TEXT.LOADING_SEND_OTP,
            success: TEXT.TOAST_OTP_RESENT,
            error: TEXT.TOAST_RESEND_ERROR,
        });
    };

    const onError = (errors: FieldErrors<EmailFormValues | OtpPasswordFormValues>) => {
        toast.dismiss();
        if (Object.keys(errors).length > 0) {
            toast.error(TEXT.TOAST_VALIDATION_ERROR);
        }
    };

    // ── Handle Profile Send OTP (Deprecated in new UI but kept for safety if needed elsewhere) ──

    // ─── Render ───────────────────────────────────────────────────────────────

    const renderContent = () => (
        <>
            <Card className="w-full max-w-md relative z-10 animate-slide-in-up shadow-2xl border border-muted-foreground/30">

                <CardHeader className="text-center space-y-2 pb-6">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-2 shadow-sm border border-primary/20">
                        {step === 1 && <User className="text-primary w-8 h-8" />}
                        {step === 2 && <KeyRound className="text-primary w-8 h-8" />}
                        {step === 3 && <CheckCircle2 className="text-green-500 w-8 h-8" />}
                    </div>

                    <CardTitle className="text-2xl font-bold">
                        {isProfileMode && SYSTEM_MESSAGES.PROFILE_RESET.DIALOG_TITLE}
                        {!isProfileMode && step === 1 && TEXT.TITLE}
                        {!isProfileMode && step === 2 && TEXT.TITLE_OTP}
                        {step === 3 && TEXT.SUCCESS_TITLE}
                    </CardTitle>

                    <CardDescription>
                        {isProfileMode && SYSTEM_MESSAGES.PROFILE_RESET.DIALOG_DESC}
                        {!isProfileMode && step === 1 && TEXT.DESC}
                        {!isProfileMode && step === 2 && <>{TEXT.DESC_OTP_PREFIX}<span className="font-semibold text-foreground">{savedEmail}</span></>}
                        {step === 3 && TEXT.SUCCESS_DESC}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">

                    {/* ── Profile Mode: Current Password + New Password (Step 2) ── */}
                    {isProfileMode && step === 2 && (
                        <form onSubmit={handleSubmitForm((data) => onSubmitReset(data as unknown as ResetFormValues))} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">

                            {/* Current Password */}
                            <div className="space-y-2">
                                <RequiredLabel
                                    htmlFor="currentPassword"
                                    className={formErrors.currentPassword ? "text-destructive" : ""}
                                >
                                    {TEXT.LABEL_CURRENT_PASSWORD}
                                </RequiredLabel>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrent ? "text" : "password"}
                                        placeholder={TEXT.PLACEHOLDER_CURRENT_PASSWORD}
                                        className={`pr-10 ${formErrors.currentPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                        disabled={isFormSubmitting}
                                        {...registerForm("currentPassword")}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent((v) => !v)}
                                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                        tabIndex={-1}
                                    >
                                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {formErrors.currentPassword && <p className="text-red-500 text-xs mt-1">{formErrors.currentPassword?.message?.toString()}</p>}
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <RequiredLabel
                                    htmlFor="newPassword"
                                    className={formErrors.newPassword ? "text-destructive" : ""}
                                >
                                    {TEXT.LABEL_PASSWORD}
                                </RequiredLabel>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder={TEXT.PLACEHOLDER_PASSWORD}
                                        className={`pr-10 ${formErrors.newPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                        disabled={isFormSubmitting}
                                        {...registerForm("newPassword")}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {formErrors.newPassword && <p className="text-red-500 text-xs mt-1">{formErrors.newPassword?.message?.toString()}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <RequiredLabel
                                    htmlFor="confirmPassword"
                                    className={formErrors.confirmPassword ? "text-destructive" : ""}
                                >
                                    {TEXT.LABEL_CONFIRM}
                                </RequiredLabel>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirm ? "text" : "password"}
                                        placeholder={TEXT.PLACEHOLDER_CONFIRM}
                                        className={`pr-10 ${formErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                        disabled={isFormSubmitting}
                                        {...registerForm("confirmPassword")}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm((v) => !v)}
                                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                        tabIndex={-1}
                                    >
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {formErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword?.message?.toString()}</p>}
                            </div>

                            <Button className="w-full font-bold" size="lg" disabled={isFormSubmitting}>
                                {isFormSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{TEXT.BTN_VERIFYING}</> : TEXT.BTN_VERIFY}
                            </Button>
                        </form>
                    )}

                    {/* ── Step 1: Email (Non-Profile Mode) ── */}
                    {step === 1 && (
                        <form onSubmit={handleSubmitEmail(onSendCode, onError)} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <RequiredLabel
                                    htmlFor="email"
                                    className={emailErrors.email ? "text-destructive" : ""}
                                >
                                    {TEXT.LABEL_EMAIL}
                                </RequiredLabel>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                                    <Input
                                        id="email"
                                        placeholder={TEXT.PLACEHOLDER_EMAIL}
                                        className={`pl-9 ${emailErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                        disabled={isEmailSubmitting}
                                        {...registerEmail("email")}
                                    />
                                </div>
                                {emailErrors.email && <p className="text-red-500 text-xs mt-1">{emailErrors.email.message}</p>}
                            </div>

                            <Button type="submit" className="w-full font-bold" size="lg" disabled={isEmailSubmitting}>
                                {isEmailSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{TEXT.BTN_SENDING}</> : TEXT.BTN_SEND}
                            </Button>
                        </form>
                    )}

                    {/* ── Step 2: OTP + New Password (Non-Profile Mode) ── */}
                    {!isProfileMode && step === 2 && (
                        <form onSubmit={handleSubmitForm((data) => onSubmitReset(data as unknown as ResetFormValues))} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">

                            {/* OTP input */}
                            <div className="space-y-2">
                                <RequiredLabel
                                    htmlFor="otp"
                                    className={cn("justify-center", formErrors.otp ? "text-destructive" : "")}
                                >
                                    {TEXT.LABEL_OTP}
                                </RequiredLabel>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder={TEXT.PLACEHOLDER_OTP}
                                    className={`text-center text-2xl tracking-[0.5em] font-bold h-14 ${formErrors.otp ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                    maxLength={6}
                                    inputMode="numeric"
                                    disabled={isFormSubmitting}
                                    {...registerForm("otp" as keyof ResetFormValues)}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, "");
                                        registerForm("otp" as keyof ResetFormValues).onChange({ target: { value, name: "otp" } });
                                        e.target.value = value;
                                    }}
                                />
                                {formErrors.otp && <p className="text-red-500 text-xs mt-1 text-center">{formErrors.otp?.message?.toString()}</p>}
                            </div>

                            {/* Timer + Resend */}
                            <div className="flex items-center justify-between text-xs">
                                <p className={`flex items-center gap-1 ${timeLeft === 0 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                                    <Timer className="w-3 h-3" />
                                    {timeLeft > 0 ? `${TEXT.OTP_VALID_SUFFIX}${formatTime(timeLeft)}` : TEXT.OTP_EXPIRED}
                                </p>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={timeLeft > 0 || isResending}
                                    className={`font-medium transition-colors ${timeLeft > 0 || isResending ? "text-muted-foreground cursor-not-allowed opacity-50" : "text-primary hover:underline cursor-pointer"}`}
                                >
                                    {isResending ? <><Loader2 className="inline mr-1 h-3 w-3 animate-spin" />{TEXT.BTN_RESENDING}</> : TEXT.BTN_RESEND}
                                </button>
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <RequiredLabel
                                    htmlFor="newPassword"
                                    className={formErrors.newPassword ? "text-destructive" : ""}
                                >
                                    {TEXT.LABEL_PASSWORD}
                                </RequiredLabel>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder={TEXT.PLACEHOLDER_PASSWORD}
                                        className={`pr-10 ${formErrors.newPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                        disabled={isFormSubmitting}
                                        {...registerForm("newPassword")}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {formErrors.newPassword && <p className="text-red-500 text-xs mt-1">{formErrors.newPassword?.message?.toString()}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <RequiredLabel
                                    htmlFor="confirmPassword"
                                    className={formErrors.confirmPassword ? "text-destructive" : ""}
                                >
                                    {TEXT.LABEL_CONFIRM}
                                </RequiredLabel>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirm ? "text" : "password"}
                                        placeholder={TEXT.PLACEHOLDER_CONFIRM}
                                        className={`pr-10 ${formErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                        disabled={isFormSubmitting}
                                        {...registerForm("confirmPassword")}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm((v) => !v)}
                                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                        tabIndex={-1}
                                    >
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {formErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword?.message?.toString()}</p>}
                            </div>

                            <Button className="w-full font-bold" size="lg" disabled={isFormSubmitting}>
                                {isFormSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{TEXT.BTN_VERIFYING}</> : TEXT.BTN_VERIFY}
                            </Button>
                        </form>
                    )}

                    {/* ── Step 3: Success ── */}
                    {step === 3 && (
                        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <Button className="w-full font-bold" size="lg" onClick={() => isProfileMode ? window.location.reload() : navigate("/login")}>
                                {isProfileMode ? SYSTEM_MESSAGES.BTN_CLOSE : TEXT.BTN_GO_LOGIN}
                            </Button>
                        </div>
                    )}

                    {/* Back link */}
                    {!isProfileMode && step !== 3 && (
                        <div className="text-center pt-2">
                            {step === 1 ? (
                                <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    {TEXT.LINK_BACK_LOGIN}
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setIsTimerRunning(false); }}
                                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    {TEXT.BTN_BACK_EMAIL}
                                </button>
                            )}
                        </div>
                    )}

                </CardContent>
            </Card>
        </>
    );

    if (isProfileMode) {
        return renderContent();
    }

    return (
        <div className="min-h-screen w-full relative flex items-center justify-center bg-background overflow-hidden p-4">
            {/* Background */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    background: "#ffffff",
                    backgroundImage: `radial-gradient(circle at top right, rgba(249, 86, 86, 0.938), transparent 70%)`,
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
                }}
            />
            {renderContent()}
        </div>
    );
};

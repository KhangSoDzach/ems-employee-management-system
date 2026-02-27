import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, ArrowLeft, KeyRound, Timer, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { forgotPassword, resetPassword } from "./authService";
import { toast } from "sonner";

const TEXT = {
    titleForgot: "Quên mật khẩu?",
    titleOtp: "Xác thực OTP",
    titleNewPass: "Đặt mật khẩu mới",
    descForgot: "Nhập email để nhận mã xác thực.",
    descOtpPrefix: "Đã gửi mã 6 số đến ",
    descNewPass: "Nhập mật khẩu mới cho tài khoản của bạn.",
    labelEmail: "Email công ty",
    btnSendMail: "Gửi mã xác thực",
    btnSending: "Đang gửi...",
    btnVerify: "Xác nhận & Đặt mật khẩu",
    btnVerifying: "Đang xử lý...",
    labelOtp: "Mã OTP",
    labelNewPass: "Mật khẩu mới",
    labelConfirmPass: "Xác nhận mật khẩu",
    otpValidSuffix: "Mã hết hạn sau ",
    otpExpired: "Mã đã hết hạn",
    btnResend: "Gửi lại mã mới",
    btnResending: "Đang gửi lại...",
    linkBackLogin: "Quay lại đăng nhập",
    btnBackEmail: "Nhập lại Email",
    successTitle: "Đặt lại mật khẩu thành công!",
    successDesc: "Bạn có thể đăng nhập bằng mật khẩu mới.",
    btnGoLogin: "Về trang đăng nhập",
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const emailSchema = z.object({
    email: z.string().email("Địa chỉ email không hợp lệ"),
});

const otpAndPasswordSchema = z.object({
    otp: z
        .string()
        .length(6, "Mã OTP phải có đúng 6 chữ số")
        .regex(/^\d+$/, "Mã OTP chỉ được chứa số"),
    newPassword: z
        .string()
        .min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpPasswordFormValues = z.infer<typeof otpAndPasswordSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export const ForgotPasswordPage = () => {
    const navigate = useNavigate();

    /** 1 = enter email | 2 = enter OTP + new password | 3 = success */
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [savedEmail, setSavedEmail] = useState("");
    const [timeLeft, setTimeLeft] = useState(300);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // ── Form: step 1 ──
    const {
        register: registerEmail,
        handleSubmit: handleSubmitEmail,
        formState: { errors: emailErrors, isSubmitting: isEmailSubmitting },
    } = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) });

    // ── Form: step 2 ──
    const {
        register: registerForm,
        handleSubmit: handleSubmitForm,
        setError: setFormError,
        formState: { errors: formErrors, isSubmitting: isFormSubmitting },
    } = useForm<OtpPasswordFormValues>({ resolver: zodResolver(otpAndPasswordSchema) });

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
        try {
            await forgotPassword(data.email);
            setSavedEmail(data.email);
            setStep(2);
            setTimeLeft(300);
            setIsTimerRunning(true);
            toast.success("Mã OTP đã được gửi đến email của bạn.");
        } catch (err: unknown) {
            // Anti-enumeration: backend always returns 200, so errors here are network issues
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                ?? "Không thể gửi mã. Vui lòng thử lại.";
            toast.error(message);
        }
    };

    const onSubmitReset = async (data: OtpPasswordFormValues) => {
        try {
            await resetPassword(savedEmail, data.otp, data.newPassword);
            setStep(3);
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                ?? "Mã OTP không hợp lệ hoặc đã hết hạn.";

            if (message.toLowerCase().includes("hết hạn") || message.toLowerCase().includes("expired")) {
                setFormError("otp", { message: "Mã OTP đã hết hạn. Vui lòng gửi lại mã mới." });
            } else {
                setFormError("otp", { message });
            }
        }
    };

    const handleResend = async () => {
        if (timeLeft > 0 || isResending) return;
        setIsResending(true);
        try {
            await forgotPassword(savedEmail);
            setTimeLeft(300);
            setIsTimerRunning(true);
            toast.success("Đã gửi lại mã OTP mới.");
        } catch {
            toast.error("Không thể gửi lại mã. Vui lòng thử lại.");
        } finally {
            setIsResending(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

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

            <Card className="w-full max-w-md relative z-10 animate-slide-in-up shadow-2xl border border-muted-foreground/30">

                <CardHeader className="text-center space-y-2 pb-6">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-2 shadow-sm border border-primary/20">
                        {step === 1 && <User className="text-primary w-8 h-8" />}
                        {step === 2 && <KeyRound className="text-primary w-8 h-8" />}
                        {step === 3 && <CheckCircle2 className="text-green-500 w-8 h-8" />}
                    </div>

                    <CardTitle className="text-2xl font-bold">
                        {step === 1 && TEXT.titleForgot}
                        {step === 2 && TEXT.titleOtp}
                        {step === 3 && TEXT.successTitle}
                    </CardTitle>

                    <CardDescription>
                        {step === 1 && TEXT.descForgot}
                        {step === 2 && <>{TEXT.descOtpPrefix}<span className="font-semibold text-foreground">{savedEmail}</span></>}
                        {step === 3 && TEXT.successDesc}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">

                    {/* ── Step 1: Email ── */}
                    {step === 1 && (
                        <form onSubmit={handleSubmitEmail(onSendCode)} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <Label htmlFor="email">{TEXT.labelEmail}</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                                    <Input
                                        id="email"
                                        placeholder="user@example.com"
                                        className={`pl-9 ${emailErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                        disabled={isEmailSubmitting}
                                        {...registerEmail("email")}
                                    />
                                </div>
                                {emailErrors.email && (
                                    <p className="text-sm text-destructive font-medium">{emailErrors.email.message}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full font-bold" size="lg" disabled={isEmailSubmitting}>
                                {isEmailSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{TEXT.btnSending}</> : TEXT.btnSendMail}
                            </Button>
                        </form>
                    )}

                    {/* ── Step 2: OTP + New Password ── */}
                    {step === 2 && (
                        <form onSubmit={handleSubmitForm(onSubmitReset)} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">

                            {/* OTP input */}
                            <div className="space-y-2">
                                <Label htmlFor="otp" className="sr-only">{TEXT.labelOtp}</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="000000"
                                    className={`text-center text-2xl tracking-[0.5em] font-bold h-14 ${formErrors.otp ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                    maxLength={6}
                                    inputMode="numeric"
                                    disabled={isFormSubmitting}
                                    {...registerForm("otp")}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, "");
                                        registerForm("otp").onChange({ target: { value, name: "otp" } });
                                        e.target.value = value;
                                    }}
                                />
                                {formErrors.otp && (
                                    <p className="text-sm text-destructive font-medium text-center">{formErrors.otp.message}</p>
                                )}
                            </div>

                            {/* Timer + Resend */}
                            <div className="flex items-center justify-between text-xs">
                                <p className={`flex items-center gap-1 ${timeLeft === 0 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                                    <Timer className="w-3 h-3" />
                                    {timeLeft > 0 ? `${TEXT.otpValidSuffix}${formatTime(timeLeft)}` : TEXT.otpExpired}
                                </p>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={timeLeft > 0 || isResending}
                                    className={`font-medium transition-colors ${timeLeft > 0 || isResending ? "text-muted-foreground cursor-not-allowed opacity-50" : "text-primary hover:underline cursor-pointer"}`}
                                >
                                    {isResending ? <><Loader2 className="inline mr-1 h-3 w-3 animate-spin" />{TEXT.btnResending}</> : TEXT.btnResend}
                                </button>
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">{TEXT.labelNewPass}</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Tối thiểu 8 ký tự"
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
                                {formErrors.newPassword && (
                                    <p className="text-sm text-destructive font-medium">{formErrors.newPassword.message}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">{TEXT.labelConfirmPass}</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirm ? "text" : "password"}
                                        placeholder="Nhập lại mật khẩu mới"
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
                                {formErrors.confirmPassword && (
                                    <p className="text-sm text-destructive font-medium">{formErrors.confirmPassword.message}</p>
                                )}
                            </div>

                            <Button className="w-full font-bold" size="lg" disabled={isFormSubmitting}>
                                {isFormSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{TEXT.btnVerifying}</> : TEXT.btnVerify}
                            </Button>
                        </form>
                    )}

                    {/* ── Step 3: Success ── */}
                    {step === 3 && (
                        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <Button className="w-full font-bold" size="lg" onClick={() => navigate("/login")}>
                                {TEXT.btnGoLogin}
                            </Button>
                        </div>
                    )}

                    {/* Back link */}
                    {step !== 3 && (
                        <div className="text-center pt-2">
                            {step === 1 ? (
                                <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    {TEXT.linkBackLogin}
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setIsTimerRunning(false); }}
                                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    {TEXT.btnBackEmail}
                                </button>
                            )}
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
};
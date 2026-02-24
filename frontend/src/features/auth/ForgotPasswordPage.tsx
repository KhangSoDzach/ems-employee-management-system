import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, ArrowLeft, KeyRound, Timer, Loader2 } from "lucide-react";
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

const emailSchema = z.object({
    email: z.string().email("Địa chỉ email không hợp lệ"),
});

const otpSchema = z.object({
    otp: z.string().length(6, "Mã OTP phải có đúng 6 chữ số").regex(/^\d+$/, "Mã OTP chỉ được chứa số"),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

export const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [savedEmail, setSavedEmail] = useState("");
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    const {
        register: registerEmail,
        handleSubmit: handleSubmitEmail,
        formState: { errors: emailErrors, isSubmitting: isEmailSubmitting },
    } = useForm<EmailFormValues>({
        resolver: zodResolver(emailSchema),
    });

    const {
        register: registerOtp,
        handleSubmit: handleSubmitOtp,
        setError: setOtpError,
        formState: { errors: otpErrors, isSubmitting: isOtpSubmitting },
    } = useForm<OtpFormValues>({
        resolver: zodResolver(otpSchema),
    });

    useEffect(() => {
        if (!isTimerRunning || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
            if (timeLeft <= 1) {
                setIsTimerRunning(false);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const onSendCode = async (data: EmailFormValues) => {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setSavedEmail(data.email);
        setStep(2);
        setTimeLeft(300);
        setIsTimerRunning(true);
    };

    const onVerifyCode = async (data: OtpFormValues) => {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (data.otp === "123456") {
            alert("Xác thực thành công! Mật khẩu mới đã được gửi vào email.");
            navigate("/login");
        } else {
            setOtpError("otp", { message: "Mã OTP không chính xác hoặc đã hết hạn" });
        }
    };

    const handleResend = async () => {
        if (timeLeft > 0) return;

        setTimeLeft(300);
        setIsTimerRunning(true);
        alert(`Đã gửi lại mã mới đến ${savedEmail}`);
    };

    return (
        <div className="min-h-screen w-full relative flex items-center justify-center bg-background overflow-hidden p-4">
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
                        {step === 1 ? (
                            <User className="text-primary w-8 h-8" />
                        ) : (
                            <KeyRound className="text-primary w-8 h-8" />
                        )}
                    </div>

                    <CardTitle className="text-2xl font-bold">
                        {step === 1 ? "Quên mật khẩu?" : "Xác thực OTP"}
                    </CardTitle>

                    <CardDescription>
                        {step === 1
                            ? "Nhập email để nhận mã xác thực."
                            : <>Đã gửi mã 6 số đến <span className="font-semibold text-foreground">{savedEmail}</span></>}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">

                    {step === 1 ? (
                        <form onSubmit={handleSubmitEmail(onSendCode)} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email công ty</Label>
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

                            <Button
                                type="submit"
                                className="w-full font-bold"
                                size="lg"
                                disabled={isEmailSubmitting}
                            >
                                {isEmailSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang gửi...</> : "Gửi mã xác thực"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmitOtp(onVerifyCode)} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <Label htmlFor="otp" className="sr-only">Mã OTP</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="000000"
                                    className={`text-center text-2xl tracking-[0.5em] font-bold h-14 ${otpErrors.otp ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                    maxLength={6}
                                    disabled={isOtpSubmitting}
                                    {...registerOtp("otp")}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, "");
                                        registerOtp("otp").onChange({ target: { value, name: "otp" } });
                                        e.target.value = value;
                                    }}
                                />
                                {otpErrors.otp && (
                                    <p className="text-sm text-destructive font-medium text-center">{otpErrors.otp.message}</p>
                                )}
                            </div>

                            <Button className="w-full font-bold" size="lg" disabled={isOtpSubmitting}>
                                {isOtpSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xác thực...</> : "Xác nhận"}
                            </Button>

                            <div className="flex flex-col items-center gap-2">
                                <p className={`text-xs text-center flex items-center gap-1 ${timeLeft === 0 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                                    <Timer className="w-3 h-3" />
                                    {timeLeft > 0 ? `Mã hết hạn sau ${formatTime(timeLeft)}` : "Mã đã hết hạn"}
                                </p>

                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={timeLeft > 0}
                                    className={`text-sm font-medium transition-colors ${timeLeft > 0 ? "text-muted-foreground cursor-not-allowed opacity-50" : "text-primary hover:underline cursor-pointer"}`}
                                >
                                    Gửi lại mã mới
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="text-center pt-2">
                        {step === 1 ? (
                            <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Quay lại đăng nhập
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Nhập lại Email
                            </button>
                        )}
                    </div>

                </CardContent>
            </Card>
        </div>
    );
};
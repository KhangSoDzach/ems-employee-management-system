import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const TEXT = {
    title: "Chào mừng trở lại",
    desc: "Đăng nhập vào hệ thống quản lý nhân sự EMS",
    labelEmail: "Email",
    placeholderEmail: "admin@ems.com",
    labelPassword: "Mật khẩu",
    placeholderPassword: "••••••••",
    labelRemember: "Ghi nhớ đăng nhập",
    btnLogin: "Đăng nhập",
    btnProcessing: "Đang xử lý...",
    errEmailReq: "Vui lòng nhập Username/Email",
    errPassReq: "Vui lòng nhập mật khẩu",
    errDefault: "Email hoặc mật khẩu không chính xác",
}

const loginSchema = z.object({
    email: z.string().min(1, TEXT.errEmailReq),
    password: z.string().min(1, TEXT.errPassReq),
    remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        setError,
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
    // Thêm !isSubmitting để tránh trường hợp này chạy đè lên lúc đang hiện thị lỗi
    useEffect(() => {
        if (isAuthenticated && !isSubmitting) {
            navigate("/dashboard", { replace: true });
        }
    }, [isAuthenticated, navigate, isSubmitting]);

    useEffect(() => {
        const savedEmail = localStorage.getItem("rememberedEmail");
        if (savedEmail) {
            setValue("email", savedEmail);
            setValue("remember", true);
        }
    }, [setValue]);

    const onSubmit = async (data: LoginFormValues) => {
        try {
            await login(data.email, data.password);

            if (data.remember) {
                localStorage.setItem("rememberedEmail", data.email);
            } else {
                localStorage.removeItem("rememberedEmail");
            }

            navigate("/dashboard", { replace: true });
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            console.error("Login error:", error);
            setError("root", {
                message: err.response?.data?.message || TEXT.errDefault,
            });
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
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-2 shadow-sm border border-primary/20">
                        <User className="text-primary w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{TEXT.title}</CardTitle>
                    <CardDescription>
                        {TEXT.desc}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">{TEXT.labelEmail}</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                                <Input
                                    id="email"
                                    placeholder={TEXT.placeholderEmail}
                                    className={`pl-9 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                    {...register("email")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">{TEXT.labelPassword}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />

                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder={TEXT.placeholderPassword}
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
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    onCheckedChange={(checked) => setValue("remember", checked as boolean)}
                                    defaultChecked={localStorage.getItem("rememberedEmail") ? true : false}
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-sm font-medium leading-none cursor-pointer"
                                >
                                    {TEXT.labelRemember}
                                </Label>
                            </div>
                        </div>

                        {errors.root && (
                            <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium text-center">
                                {errors.root.message}
                            </div>
                        )}

                        <Button className="w-full font-bold" size="lg" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {TEXT.btnProcessing}
                                </>
                            ) : (
                                TEXT.btnLogin
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
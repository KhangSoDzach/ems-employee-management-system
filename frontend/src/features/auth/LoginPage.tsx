import { useState, useEffect } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
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
    if (roles.includes("ROLE_ADMIN")) return "/admin-profile";
    if (roles.includes("ROLE_HR")) return "/hr-profile";
    if (roles.includes("ROLE_MANAGER")) return "/manager-profile";
    return "/employee"; // ROLE_EMPLOYEE or unknown
}

export const LoginPage = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, user } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

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

        const loginPromise = login(data.email, data.password).then((userInfo) => {
            if (data.remember) {
                localStorage.setItem("rememberedEmail", data.email);
            } else {
                localStorage.removeItem("rememberedEmail");
            }
            navigate(getRedirectByRole(userInfo.roles), { replace: true });
            return userInfo;
        });

        toast.promise(loginPromise, {
            loading: TEXT.LOADING,
            success: TEXT.SUCCESS,
            error: (err: unknown) => {
                const apiErr = err as { response?: { data?: { message?: string } } };
                return apiErr.response?.data?.message || SYSTEM_MESSAGES.VALIDATION.EMAIL_PASSWORD_INVALID;
            },
        });
    };

    const onError = (errors: FieldErrors<LoginFormValues>) => {
        toast.dismiss();
        const firstErrorPath = Object.keys(errors)[0] as keyof FieldErrors<LoginFormValues>;
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
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-2 shadow-sm border border-primary/20">
                        <User className="text-primary w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{TEXT.TITLE}</CardTitle>
                    <CardDescription>
                        {TEXT.DESC}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
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

                        <Button className="w-full font-bold" size="lg" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {TEXT.BTN_PROCESSING}
                                </>
                            ) : (
                                TEXT.BTN_LOGIN
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

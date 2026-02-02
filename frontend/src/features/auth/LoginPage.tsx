import { useState } from "react";
import { Briefcase, Lock, Mail, Eye, EyeClosed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";

export const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
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
                        <Briefcase className="text-primary w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription>
                        Đăng nhập vào hệ thống quản lý nhân sự EMS
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your Email"
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Mật khẩu</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />

                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="pl-9 pr-10"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition"
                            >
                                {showPassword ? (
                                    <Eye className="h-4 w-4" />
                                ) : (
                                    <EyeClosed className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="remember" />
                            <Label
                                htmlFor="remember"
                                className="text-sm font-medium leading-none cursor-pointer"
                            >
                                Ghi nhớ đăng nhập
                            </Label>
                        </div>

                        <a href="#" className="text-sm font-medium text-primary hover:underline">
                            Quên mật khẩu?
                        </a>
                    </div>

                    <Button className="w-full font-bold" size="lg">
                        Đăng nhập
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};
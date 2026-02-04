import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export const DashboardPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center">
            <Card className="w-full max-w-2xl text-center shadow-lg">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-primary">
                        Welcome to EMS Dashboard
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-muted-foreground text-lg">
                        Đây là trang Dashboard tạm thời (Placeholder).
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button asChild>
                            <Link to="/login">Đăng xuất (Về Login)</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

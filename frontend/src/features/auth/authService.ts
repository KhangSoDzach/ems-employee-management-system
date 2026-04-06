import api from "@/lib/axios";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

/**
 * Step 1: Gửi OTP về email.
 * Luôn trả 200 kể cả email không tồn tại (anti-enumeration).
 */
export const forgotPassword = async (email: string): Promise<string> => {
    const res = await api.post<never, ApiResponse<null>>("/auth/forgot-password", { email });
    return res.message;
};

/**
 * Step 2: Xác thực OTP + đặt lại mật khẩu.
 */
export const resetPassword = async (
    email: string,
    otp: string,
    newPassword: string
): Promise<string> => {
    const res = await api.post<never, ApiResponse<null>>("/auth/reset-password", {
        email,
        otp,
        newPassword,
    });
    return res.message;
};

/**
 * Đổi mật khẩu trong Profile (cần mật khẩu hiện tại)
 */
export const changePassword = async (
    currentPassword: string,
    newPassword: string
): Promise<string> => {
    const res = await api.post<never, ApiResponse<null>>("/auth/change-password", {
        currentPassword,
        newPassword,
    });
    return res.message;
};

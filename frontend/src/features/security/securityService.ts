import api from "@/lib/axios";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface TwoFactorAuthPayload {
  message?: string;
  enabled?: boolean;
  secret?: string;
  qrCode?: string;
  recoveryCodes?: string[];
}

export const get2FAStatus = async (): Promise<boolean> => {
  const res = await api.get<never, ApiResponse<boolean>>("/2fa/status");
  return Boolean(res.data);
};

export const setup2FA = async (): Promise<TwoFactorAuthPayload> => {
  const res = await api.post<never, ApiResponse<TwoFactorAuthPayload>>(
    "/2fa/setup",
  );
  return res.data;
};

export const verify2FA = async (
  code: string,
): Promise<TwoFactorAuthPayload> => {
  const res = await api.post<never, ApiResponse<TwoFactorAuthPayload>>(
    "/2fa/verify",
    { code },
  );
  return res.data;
};

export const disable2FA = async (
  password: string,
): Promise<TwoFactorAuthPayload> => {
  const res = await api.post<never, ApiResponse<TwoFactorAuthPayload>>(
    "/2fa/disable",
    { password },
  );
  return res.data;
};

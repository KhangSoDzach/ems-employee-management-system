import { useState, useEffect } from "react";
import { useForm, FieldErrors, UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  User,
  Mail,
  ArrowLeft,
  KeyRound,
  Timer,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
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
  CardTitle,
} from "@/components/ui/card";
import { forgotPassword, resetPassword, changePassword } from "./authService";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { SYSTEM_MESSAGES } from "@/constants/messages";

const TEXT = SYSTEM_MESSAGES.FORGOT_PASSWORD;

interface ForgotPasswordPageProps {
  isProfileMode?: boolean;
  userEmail?: string;
  onClose?: () => void;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

import {
  emailSchema,
  otpAndPasswordSchema,
  profileChangePasswordSchema,
  type EmailFormValues,
  type ResetFormValues,
} from "./schemas/auth.schema";

// ─── Sub-components ──────────────────────────────────────────────────────────

const StepIcon = ({ step }: { step: 1 | 2 | 3 }) => (
  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-2 shadow-sm border border-primary/20">
    {step === 1 && <User className="text-primary w-8 h-8" />}
    {step === 2 && <KeyRound className="text-primary w-8 h-8" />}
    {step === 3 && <div className="hidden" />}
  </div>
);

const StepHeader = ({
  isProfileMode,
  step,
  savedEmail,
}: {
  isProfileMode: boolean;
  step: 1 | 2;
  savedEmail: string;
}) => {
  const getTitle = () => {
    if (isProfileMode) {
      return SYSTEM_MESSAGES.PROFILE_RESET.DIALOG_TITLE;
    }
    if (step === 1) {
      return TEXT.TITLE;
    }
    return TEXT.TITLE_OTP;
  };

  const getDesc = () => {
    if (isProfileMode) {
      return SYSTEM_MESSAGES.PROFILE_RESET.DIALOG_DESC;
    }
    if (step === 1) {
      return TEXT.DESC;
    }
    return (
      <>
        {TEXT.DESC_OTP_PREFIX}
        <span className="font-semibold text-foreground">{savedEmail}</span>
      </>
    );
  };

  return (
    <div className="text-center space-y-2 pb-6">
      <StepIcon step={step} />
      <CardTitle className="text-2xl font-bold">{getTitle()}</CardTitle>
      <CardDescription>{getDesc()}</CardDescription>
    </div>
  );
};

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder: string;
  show: boolean;
  setShow: (v: boolean) => void;
  error?: string;
  disabled: boolean;
  registration: ReturnType<UseFormRegister<ResetFormValues>>;
}

const PasswordField = ({
  id,
  label,
  placeholder,
  show,
  setShow,
  error,
  disabled,
  registration,
}: PasswordFieldProps) => (
  <div className="space-y-2">
    <RequiredLabel htmlFor={id} className={error ? "text-destructive" : ""}>
      {label}
    </RequiredLabel>
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className={`pr-10 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
        disabled={disabled}
        {...registration}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const ProfileChangePasswordForm = ({
  register,
  errors,
  isSubmitting,
  onSubmit,
  showCurrent,
  setShowCurrent,
  showPassword,
  setShowPassword,
  showConfirm,
  setShowConfirm,
}: {
  register: UseFormRegister<ResetFormValues>;
  errors: FieldErrors<ResetFormValues>;
  isSubmitting: boolean;
  onSubmit: (e: React.BaseSyntheticEvent) => Promise<void>;
  showCurrent: boolean;
  setShowCurrent: (v: boolean) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showConfirm: boolean;
  setShowConfirm: (v: boolean) => void;
}) => (
  <form
    onSubmit={onSubmit}
    className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300"
  >
    <PasswordField
      id="currentPassword"
      label={TEXT.LABEL_CURRENT_PASSWORD}
      placeholder={TEXT.PLACEHOLDER_CURRENT_PASSWORD}
      show={showCurrent}
      setShow={setShowCurrent}
      error={errors.currentPassword?.message?.toString()}
      disabled={isSubmitting}
      registration={register("currentPassword")}
    />

    <PasswordField
      id="newPassword"
      label={TEXT.LABEL_PASSWORD}
      placeholder={TEXT.PLACEHOLDER_PASSWORD}
      show={showPassword}
      setShow={setShowPassword}
      error={errors.newPassword?.message?.toString()}
      disabled={isSubmitting}
      registration={register("newPassword")}
    />

    <PasswordField
      id="confirmPassword"
      label={TEXT.LABEL_CONFIRM}
      placeholder={TEXT.PLACEHOLDER_CONFIRM}
      show={showConfirm}
      setShow={setShowConfirm}
      error={errors.confirmPassword?.message?.toString()}
      disabled={isSubmitting}
      registration={register("confirmPassword")}
    />

    <Button className="w-full font-bold" size="lg" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {TEXT.BTN_VERIFYING}
        </>
      ) : (
        TEXT.BTN_VERIFY
      )}
    </Button>
  </form>
);

const EmailStepForm = ({
  register,
  errors,
  isSubmitting,
  onSubmit,
}: {
  register: UseFormRegister<EmailFormValues>;
  errors: FieldErrors<EmailFormValues>;
  isSubmitting: boolean;
  onSubmit: (e: React.BaseSyntheticEvent) => Promise<void>;
}) => (
  <form
    onSubmit={onSubmit}
    className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
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
          className={`pl-9 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
          disabled={isSubmitting}
          {...register("email")}
        />
      </div>
      {errors.email && (
        <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
      )}
    </div>
    <Button
      type="submit"
      className="w-full font-bold"
      size="lg"
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {TEXT.BTN_SENDING}
        </>
      ) : (
        TEXT.BTN_SEND
      )}
    </Button>
  </form>
);

const OtpTimerSection = ({
  timeLeft,
  formatTime,
  handleResend,
  isResending,
}: {
  timeLeft: number;
  formatTime: (s: number) => string;
  handleResend: () => void;
  isResending: boolean;
}) => (
  <div className="flex items-center justify-between text-xs">
    <p
      className={`flex items-center gap-1 ${timeLeft === 0 ? "text-destructive font-bold" : "text-muted-foreground"}`}
    >
      <Timer className="w-3 h-3" />
      {timeLeft > 0
        ? `${TEXT.OTP_VALID_SUFFIX}${formatTime(timeLeft)}`
        : TEXT.OTP_EXPIRED}
    </p>
    <button
      type="button"
      onClick={handleResend}
      disabled={timeLeft > 0 || isResending}
      className={`font-medium transition-colors ${timeLeft > 0 || isResending ? "text-muted-foreground cursor-not-allowed opacity-50" : "text-primary hover:underline cursor-pointer"}`}
    >
      {isResending ? (
        <>
          <Loader2 className="inline mr-1 h-3 w-3 animate-spin" />
          {TEXT.BTN_RESENDING}
        </>
      ) : (
        TEXT.BTN_RESEND
      )}
    </button>
  </div>
);

const OtpInput = ({
  register,
  error,
  disabled,
}: {
  register: ReturnType<UseFormRegister<ResetFormValues>>;
  error?: string;
  disabled: boolean;
}) => (
  <div className="space-y-2">
    <RequiredLabel
      htmlFor="otp"
      className={cn("justify-center", error ? "text-destructive" : "")}
    >
      {TEXT.LABEL_OTP}
    </RequiredLabel>
    <Input
      id="otp"
      type="text"
      placeholder={TEXT.PLACEHOLDER_OTP}
      className={`text-center text-2xl tracking-[0.5em] font-bold h-14 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
      maxLength={6}
      inputMode="numeric"
      disabled={disabled}
      {...register}
      onChange={(e) => {
        const value = e.target.value.replace(/[^0-9]/g, "");
        register.onChange({ target: { value, name: "otp" } });
        e.target.value = value;
      }}
    />
    {error && <p className="text-red-500 text-xs mt-1 text-center">{error}</p>}
  </div>
);

const OtpResetPasswordForm = ({
  register,
  errors,
  isSubmitting,
  onSubmit,
  timeLeft,
  formatTime,
  handleResend,
  isResending,
  showPassword,
  setShowPassword,
  showConfirm,
  setShowConfirm,
}: {
  register: UseFormRegister<ResetFormValues>;
  errors: FieldErrors<ResetFormValues>;
  isSubmitting: boolean;
  onSubmit: (e: React.BaseSyntheticEvent) => Promise<void>;
  timeLeft: number;
  formatTime: (s: number) => string;
  handleResend: () => void;
  isResending: boolean;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showConfirm: boolean;
  setShowConfirm: (v: boolean) => void;
}) => (
  <form
    onSubmit={onSubmit}
    className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300"
  >
    <OtpInput
      register={register("otp")}
      error={errors.otp?.message?.toString()}
      disabled={isSubmitting}
    />

    <OtpTimerSection
      timeLeft={timeLeft}
      formatTime={formatTime}
      handleResend={handleResend}
      isResending={isResending}
    />

    <PasswordField
      id="newPassword"
      label={TEXT.LABEL_PASSWORD}
      placeholder={TEXT.PLACEHOLDER_PASSWORD}
      show={showPassword}
      setShow={setShowPassword}
      error={errors.newPassword?.message?.toString()}
      disabled={isSubmitting}
      registration={register("newPassword")}
    />

    <PasswordField
      id="confirmPassword"
      label={TEXT.LABEL_CONFIRM}
      placeholder={TEXT.PLACEHOLDER_CONFIRM}
      show={showConfirm}
      setShow={setShowConfirm}
      error={errors.confirmPassword?.message?.toString()}
      disabled={isSubmitting}
      registration={register("confirmPassword")}
    />

    <Button className="w-full font-bold" size="lg" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {TEXT.BTN_VERIFYING}
        </>
      ) : (
        TEXT.BTN_VERIFY
      )}
    </Button>
  </form>
);

const SuccessState = ({
  isProfileMode,
  onClose,
  navigate,
}: {
  isProfileMode: boolean;
  onClose?: () => void;
  navigate: (p: string) => void;
}) => (
  <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500 py-4">
    <CheckCircle2 className="w-20 h-20 text-green-500" />
    <div className="text-center space-y-2 px-2">
      <h3 className="text-xl font-bold">{TEXT.SUCCESS_TITLE}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {TEXT.SUCCESS_DESC}
      </p>
    </div>

    <Button
      className="w-full font-bold h-12 rounded-xl text-base shadow-lg hover:shadow-xl transition-all"
      size="lg"
      onClick={() =>
        isProfileMode
          ? onClose
            ? onClose()
            : window.location.reload()
          : navigate("/login")
      }
    >
      {isProfileMode ? SYSTEM_MESSAGES.BTN_CLOSE : TEXT.BTN_GO_LOGIN}
    </Button>
  </div>
);

const ResetFooter = ({
  step,
  setStep,
  setIsTimerRunning,
}: {
  step: 1 | 2;
  setStep: React.Dispatch<React.SetStateAction<1 | 2 | 3>>;
  setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
}) => (
  <div className="text-center pt-2">
    {step === 1 ? (
      <Link
        to="/login"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {TEXT.LINK_BACK_LOGIN}
      </Link>
    ) : (
      <button
        type="button"
        onClick={() => {
          setStep(1);
          setIsTimerRunning(false);
        }}
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {TEXT.BTN_BACK_EMAIL}
      </button>
    )}
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const ForgotPasswordPage = ({
  isProfileMode = false,
  userEmail = "",
  onClose,
}: ForgotPasswordPageProps) => {
  const navigate = useNavigate();

  /** 1 = enter email | 2 = enter OTP + new password | 3 = success */
  const [step, setStep] = useState<1 | 2 | 3>(isProfileMode ? 2 : 1);
  // Initialize savedEmail with userEmail if in profile mode
  const [savedEmail, setSavedEmail] = useState(
    isProfileMode ? userEmail : userEmail || "",
  );
  const [timeLeft, setTimeLeft] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);

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
    resolver: zodResolver(
      isProfileMode ? profileChangePasswordSchema : otpAndPasswordSchema,
    ),
  });

  // ── Timer ──
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) {
      return;
    }
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
      loading: TEXT.TOAST_LOADING,
      success: TEXT.TOAST_OTP_SENT,
      error: (err: unknown) => {
        return (
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? TEXT.TOAST_SEND_ERROR
        );
      },
    });
  };

  const resetMutation = useMutation({
    mutationFn: (data: ResetFormValues) =>
      isProfileMode
        ? changePassword(data.currentPassword, data.newPassword)
        : resetPassword(savedEmail, data.otp, data.newPassword),
    onMutate: () => {
      toast.dismiss();
      toast.loading(TEXT.LOADING);
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success(TEXT.TOAST_SUCCESS);
      setStep(3);
    },
    onError: (err: unknown) => {
      toast.dismiss();
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? TEXT.TOAST_OTP_INVALID;
      toast.error(message);
      if (isProfileMode) {
        setFormError("currentPassword", {
          message:
            SYSTEM_MESSAGES.CHANGE_PASSWORD.NEWPASSWORD_DIFFERENT_CURRENT,
        });
      } else if (
        message.toLowerCase().includes("hết hạn") ||
        message.toLowerCase().includes("expired")
      ) {
        setFormError("otp" as keyof ResetFormValues, {
          message: TEXT.TOAST_OTP_EXPIRED,
        });
      } else {
        setFormError("otp" as keyof ResetFormValues, {
          message: TEXT.TOAST_OTP_INVALID,
        });
      }
    },
  });
  const onSubmitReset = async (data: ResetFormValues) => {
    try {
      await resetMutation.mutateAsync(data);
    } catch {
      // Error is handled by resetMutation's onError callback
    }
  };
  const handleResend = async () => {
    if (timeLeft > 0 || isResending) {
      return;
    }
    toast.dismiss();
    setIsResending(true);
    const promise = forgotPassword(savedEmail)
      .then(() => {
        setTimeLeft(300);
        setIsTimerRunning(true);
      })
      .finally(() => {
        setIsResending(false);
      });

    toast.promise(promise, {
      loading: TEXT.BTN_RESENDING,
      success: TEXT.TOAST_OTP_RESENT,
      error: TEXT.TOAST_RESEND_ERROR,
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const renderContent = () => (
    <Card className="w-full max-w-md relative z-10 animate-slide-in-up shadow-2xl border border-muted-foreground/30">
      <CardHeader>
        {step !== 3 && (
          <StepHeader
            isProfileMode={isProfileMode}
            step={step as 1 | 2}
            savedEmail={savedEmail}
          />
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isProfileMode && step === 2 && (
          <ProfileChangePasswordForm
            register={registerForm}
            errors={formErrors}
            isSubmitting={isFormSubmitting}
            onSubmit={handleSubmitForm((data) =>
              onSubmitReset(data as unknown as ResetFormValues),
            )}
            showCurrent={showCurrent}
            setShowCurrent={setShowCurrent}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirm={showConfirm}
            setShowConfirm={setShowConfirm}
          />
        )}
        {step === 1 && (
          <EmailStepForm
            register={registerEmail}
            errors={emailErrors}
            isSubmitting={isEmailSubmitting}
            onSubmit={handleSubmitEmail(onSendCode)}
          />
        )}
        {!isProfileMode && step === 2 && (
          <OtpResetPasswordForm
            register={registerForm}
            errors={formErrors}
            isSubmitting={isFormSubmitting}
            onSubmit={handleSubmitForm((data) =>
              onSubmitReset(data as unknown as ResetFormValues),
            )}
            timeLeft={timeLeft}
            formatTime={formatTime}
            handleResend={handleResend}
            isResending={isResending}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirm={showConfirm}
            setShowConfirm={setShowConfirm}
          />
        )}

        {step === 3 && (
          <SuccessState
            isProfileMode={isProfileMode}
            onClose={onClose}
            navigate={navigate}
          />
        )}

        {!isProfileMode && step !== 3 && (
          <ResetFooter
            step={step}
            setStep={setStep}
            setIsTimerRunning={setIsTimerRunning}
          />
        )}
      </CardContent>
    </Card>
  );

  return renderContent();
};

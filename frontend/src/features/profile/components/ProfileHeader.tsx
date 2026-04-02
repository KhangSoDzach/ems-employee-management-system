import { ShieldCheck } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { ProfileFormValues } from "@/features/profile/schemas/ProfileSchema";

const CONTRACT_CLASSES: Record<string, string> = {
  FULL_TIME: "bg-green-100 text-green-700",
  PART_TIME: "bg-blue-100 text-blue-700",
  CONTRACT: "bg-yellow-100 text-yellow-700",
  INTERN: "bg-purple-100 text-purple-700",
  DEFAULT: "bg-gray-100 text-gray-700",
};

interface ProfileHeaderProps {
  canEdit: boolean;
  form: UseFormReturn<ProfileFormValues>;
  onSubmit: (data: ProfileFormValues) => void;
}

export function ProfileHeader({ canEdit, form, onSubmit }: ProfileHeaderProps) {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        {/* Page Header */}
        <h1 className="page-heading">{SYSTEM_MESSAGES.PROFILE.TITLE}</h1>
        <div className="flex items-center gap-3">
          {canEdit ? (
            <>
              <Button
                variant="outline"
                className="font-semibold"
                onClick={() => form.reset()}
              >
                {SYSTEM_MESSAGES.BTN_CANCEL}
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                className="font-bold bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
              >
                {SYSTEM_MESSAGES.BTN_UPDATE}
              </Button>
            </>
          ) : (
            <span className={cn("status-badge")}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {SYSTEM_MESSAGES.VIEW_MODE}
            </span>
          )}
        </div>
      </div>

      <div className="content-card-header mb-6">
        <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg relative flex items-center justify-center">
            <span className="text-3xl font-bold text-gray-400">
              {form.watch("fullName")?.charAt(0) || "?"}
            </span>
          </div>
          <div className="text-center md:text-left pt-2">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
              <h2 className="text-2xl font-bold">{form.watch("fullName")}</h2>
              <span
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-full uppercase",
                  CONTRACT_CLASSES[form.watch("contractType")] ||
                    CONTRACT_CLASSES.DEFAULT,
                )}
              >
                {form.watch("contractType").replace("_", " ")}
              </span>
            </div>
            <p className="text-muted-foreground font-medium">
              {form.watch("jobRole")} &bull;{" "}
              {SYSTEM_MESSAGES.PROFILE.DEPARTMENT_PREFIX}
              {form.watch("department")}
            </p>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-6 md:gap-4 w-full md:w-auto md:text-right text-left bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl border">
          <div className="flex-1 md:flex-none">
            <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">
              {SYSTEM_MESSAGES.PROFILE.EMP_CODE}
            </p>
            <p className="font-bold">{form.watch("employeeCode")}</p>
          </div>
        </div>
      </div>
    </>
  );
}

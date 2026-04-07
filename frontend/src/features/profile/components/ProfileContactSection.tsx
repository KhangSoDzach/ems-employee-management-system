import { format } from "date-fns";
import { CalendarIcon, KeyRound, ShieldCheck } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import type { ProfileFormValues } from "../schemas/ProfileSchema";

interface ProfileContactSectionProps {
  canEdit: boolean;
  form: UseFormReturn<ProfileFormValues>;
  setResetPasswordOpen: (open: boolean) => void;
}

export function ProfileContactSection({
  canEdit,
  form,
  setResetPasswordOpen,
}: ProfileContactSectionProps) {
  return (
    <div className="content-card">
      <h3 className="section-title">
        <ShieldCheck className="w-5 h-5 text-primary" />
        {SYSTEM_MESSAGES.PROFILE.CONTACT_SECTION}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="form-label-bold">
                {SYSTEM_MESSAGES.PROFILE.FULL_NAME}
              </FormLabel>
              <FormControl>
                <Input
                  readOnly={!canEdit}
                  placeholder={SYSTEM_MESSAGES.PROFILE.NAME_PLACEHOLDER}
                  {...field}
                  className={cn(
                    "input-readonly",
                    canEdit && "bg-background focus-visible:ring-2",
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="form-label-bold">
                {SYSTEM_MESSAGES.PROFILE.EMAIL}
              </FormLabel>
              <FormControl>
                <Input
                  readOnly={!canEdit}
                  placeholder={SYSTEM_MESSAGES.PROFILE.EMAIL_PLACEHOLDER}
                  {...field}
                  className={cn(
                    "input-readonly",
                    canEdit && "bg-background focus-visible:ring-2",
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nationalId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="form-label-bold">
                {SYSTEM_MESSAGES.PROFILE.NATIONAL_ID}
              </FormLabel>
              <FormControl>
                <Input
                  readOnly={!canEdit}
                  placeholder={SYSTEM_MESSAGES.PROFILE.ID_PLACEHOLDER}
                  {...field}
                  className={cn(
                    "input-readonly",
                    canEdit && "bg-background focus-visible:ring-2",
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="form-label-bold">
                {SYSTEM_MESSAGES.PROFILE.PHONE}
              </FormLabel>
              <FormControl>
                <Input
                  readOnly={!canEdit}
                  placeholder={SYSTEM_MESSAGES.PROFILE.PHONE_PLACEHOLDER}
                  {...field}
                  className={cn(
                    "input-readonly",
                    canEdit && "bg-background focus-visible:ring-2",
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem className="form-data-item">
              <FormLabel className="form-label-bold">
                {SYSTEM_MESSAGES.PROFILE.DOB}
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      disabled={!canEdit}
                      className={cn(
                        "w-full pl-3 text-left font-normal bg-gray-50/50 hover:bg-gray-50/50 hover:text-foreground",
                        canEdit &&
                          "bg-background text-foreground hover:bg-background",
                        !canEdit &&
                          "disabled:opacity-100 dark:disabled:opacity-100 cursor-default",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>{SYSTEM_MESSAGES.PROFILE.SELECT_DATE}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    defaultMonth={field.value}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col justify-end pb-[2px]">
          <Button
            type="button"
            variant="outline"
            className="w-full md:w-auto font-semibold text-primary border-primary/30 hover:bg-primary/5 h-10"
            onClick={() => setResetPasswordOpen(true)}
          >
            <KeyRound className="w-4 h-4 mr-2" />
            {SYSTEM_MESSAGES.PROFILE_RESET.BTN_RESET_PASSWORD}
          </Button>
        </div>
      </div>
    </div>
  );
}

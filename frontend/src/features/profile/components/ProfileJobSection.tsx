import { format } from "date-fns";
import { Briefcase, CalendarIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import {
  DEPARTMENT_OPTIONS,
  ROLE_OPTIONS,
  CONTRACT_OPTIONS,
  WORK_STATUS_OPTIONS,
} from "@/constants/options";
import { ProfileFormValues } from "../schemas/ProfileSchema";

interface ProfileJobSectionProps {
  canEdit: boolean;
  form: UseFormReturn<ProfileFormValues>;
}

export function ProfileJobSection({ canEdit, form }: ProfileJobSectionProps) {
  return (
    <div className="content-card">
      <h3 className="section-title">
        <Briefcase className="w-5 h-5 text-primary" />
        {SYSTEM_MESSAGES.PROFILE.JOB_SECTION}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="employeeCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="form-label-bold">
                {SYSTEM_MESSAGES.PROFILE.EMP_CODE}
              </FormLabel>
              <FormControl>
                <Input
                  readOnly
                  {...field}
                  className="input-readonly bg-gray-100 dark:bg-gray-800"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="workStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="form-label-bold">
                {SYSTEM_MESSAGES.PROFILE.WORK_STATUS}
              </FormLabel>
              <Select
                disabled={!canEdit}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger
                    className={cn("input-readonly", canEdit && "bg-background")}
                  >
                    <SelectValue
                      placeholder={SYSTEM_MESSAGES.SELECT_PLACEHOLDER}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    {WORK_STATUS_OPTIONS.ACTIVE}
                  </SelectItem>
                  <SelectItem value="INACTIVE">
                    {WORK_STATUS_OPTIONS.INACTIVE}
                  </SelectItem>
                  <SelectItem value="SUSPENDED">
                    {WORK_STATUS_OPTIONS.SUSPENDED}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="form-label-bold">
                {SYSTEM_MESSAGES.LABEL_DEPARTMENT}
              </FormLabel>
              <Select
                disabled={!canEdit}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger
                    className={cn("input-readonly", canEdit && "bg-background")}
                  >
                    <SelectValue
                      placeholder={SYSTEM_MESSAGES.SELECT_PLACEHOLDER}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Product Design">
                    {DEPARTMENT_OPTIONS.DESIGN}
                  </SelectItem>
                  <SelectItem value="Engineering">
                    {DEPARTMENT_OPTIONS.ENGINEERING}
                  </SelectItem>
                  <SelectItem value="Human Resources">
                    {DEPARTMENT_OPTIONS.HR}
                  </SelectItem>
                  <SelectItem value="Marketing">
                    {DEPARTMENT_OPTIONS.MARKETING}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jobRole"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="form-label-bold">
                {SYSTEM_MESSAGES.LABEL_ROLE}
              </FormLabel>
              <Select
                disabled={!canEdit}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger
                    className={cn("input-readonly", canEdit && "bg-background")}
                  >
                    <SelectValue
                      placeholder={SYSTEM_MESSAGES.SELECT_PLACEHOLDER}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Senior UI/UX Designer">
                    {ROLE_OPTIONS.DESIGNER}
                  </SelectItem>
                  <SelectItem value="Frontend Engineer">
                    {ROLE_OPTIONS.FRONTEND}
                  </SelectItem>
                  <SelectItem value="Backend Engineer">
                    {ROLE_OPTIONS.BACKEND}
                  </SelectItem>
                  <SelectItem value="Product Manager">
                    {ROLE_OPTIONS.MANAGER}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contractType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="form-label-bold">
                {SYSTEM_MESSAGES.PROFILE.CONTRACT}
              </FormLabel>
              <Select
                disabled={!canEdit}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger
                    className={cn("input-readonly", canEdit && "bg-background")}
                  >
                    <SelectValue
                      placeholder={SYSTEM_MESSAGES.SELECT_PLACEHOLDER}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="FULL_TIME">
                    {CONTRACT_OPTIONS.FULL_TIME}
                  </SelectItem>
                  <SelectItem value="PART_TIME">
                    {CONTRACT_OPTIONS.PART_TIME}
                  </SelectItem>
                  <SelectItem value="CONTRACT">
                    {CONTRACT_OPTIONS.PROBATION}
                  </SelectItem>
                  <SelectItem value="INTERN">
                    {CONTRACT_OPTIONS.INTERN}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="form-data-item">
              <FormLabel className="form-label-bold">
                {SYSTEM_MESSAGES.PROFILE.START_DATE}
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
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    defaultMonth={field.value || new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="form-data-item">
              <FormLabel className="form-label-bold">
                {SYSTEM_MESSAGES.PROFILE.END_DATE}
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
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    defaultMonth={field.value || undefined}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

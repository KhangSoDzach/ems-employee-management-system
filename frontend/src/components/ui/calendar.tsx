import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        // ✅ SIZE VỪA ĐẸP
        "bg-background group/calendar p-5 [--cell-size:3rem]",
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),

        months: cn(
          "relative flex flex-col gap-4",
          defaultClassNames.months
        ),

        month: cn(
          "flex w-full flex-col gap-4",
          defaultClassNames.month
        ),

        // Header
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between",
          defaultClassNames.nav
        ),

        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] p-0",
          defaultClassNames.button_previous
        ),

        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] p-0",
          defaultClassNames.button_next
        ),

        month_caption: cn(
          "flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]",
          defaultClassNames.month_caption
        ),

        caption_label: cn(
          "select-none font-semibold text-base",
          defaultClassNames.caption_label
        ),

        table: "w-full border-collapse",

        weekdays: cn("flex", defaultClassNames.weekdays),

        weekday: cn(
          "text-muted-foreground flex-1 select-none rounded-md text-sm font-medium",
          defaultClassNames.weekday
        ),

        week: cn("mt-2 flex w-full", defaultClassNames.week),

        day: cn(
          "group/day relative aspect-square w-full p-0 text-center",
          defaultClassNames.day
        ),

        today: cn(
          "bg-accent text-accent-foreground rounded-md",
          defaultClassNames.today
        ),

        outside: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.outside
        ),

        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),

        hidden: cn("invisible", defaultClassNames.hidden),

        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon
                className={cn("size-5", className)}
                {...props}
              />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-5", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon
              className={cn("size-4", className)}
              {...props}
            />
          )
        },

        DayButton: CalendarDayButton,

        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        "h-[--cell-size] w-[--cell-size] text-base font-medium",
        modifiers.selected &&
          "bg-primary text-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Calendar }
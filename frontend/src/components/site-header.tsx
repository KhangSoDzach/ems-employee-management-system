import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SYSTEM_MESSAGES } from "@/constants/messages";

import { Settings } from "lucide-react";
import SidebarSettings from "@/features/security/SecuritySettings";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="fixed top-0 right-0 left-0 md:left-52 z-50 w-full md:w-[calc(100%-13rem)] bg-white dark:bg-slate-950 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center justify-between border-b transition-[width,height] ease-linear">
      <div className="flex items-center gap-2 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">
          {SYSTEM_MESSAGES.SIDEBAR.HEADER_TITLE}
        </h1>
      </div>
      <div className="flex items-center gap-4 px-4 lg:px-6">
        <Popover modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden w-72"
          >
            <SidebarSettings />
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}

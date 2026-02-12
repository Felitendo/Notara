"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function MobileNav() {
  const t = useTranslations("sidebar");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center px-4",
        "bg-background/60 backdrop-blur-2xl",
        "border-b border-border/30",
        "lg:hidden"
      )}
    >
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl hover:bg-accent/80 transition-all duration-200"
            aria-label={t("nav.openMenu")}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">{t("nav.navigationMenu")}</SheetTitle>
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Bell, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { isOverdue, formatReminderLabel } from "./utils";

interface ReminderBadgeProps {
  reminderAt: string;
  className?: string;
}

export function ReminderBadge({ reminderAt, className }: ReminderBadgeProps) {
  const t = useTranslations("notes");
  const overdue = isOverdue(reminderAt);
  const Icon = overdue ? BellRing : Bell;
  const formatLabels = { today: t("reminder.today"), tomorrow: t("reminder.tomorrow") };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        overdue
          ? "text-destructive"
          : "text-accent",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{formatReminderLabel(new Date(reminderAt), formatLabels)}</span>
    </span>
  );
}

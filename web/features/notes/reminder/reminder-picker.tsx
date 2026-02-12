"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Bell, BellRing, Clock, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  getLaterTodayTime,
  getTomorrowMorningTime,
  getTomorrowEveningTime,
  getNextMondayTime,
  isOverdue,
  isMobileDevice,
  formatReminderLabel,
} from "./utils";
import { CalendarTimePicker } from "./calendar-time-picker";

interface ReminderPickerProps {
  reminderAt: string | null | undefined;
  onReminderChange: (reminderAt: string | null) => void;
  disabled?: boolean;
}

export function ReminderPicker({
  reminderAt,
  onReminderChange,
  disabled = false,
}: ReminderPickerProps) {
  const t = useTranslations("notes");
  const [open, setOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [nativePickerActive, setNativePickerActive] = useState(false);
  const nativeInputRef = useRef<HTMLInputElement>(null);
  const isMobile = isMobileDevice();

  const hasReminder = !!reminderAt;
  const overdue = hasReminder && isOverdue(reminderAt!);

  // Request notification permission when the popover opens
  useEffect(() => {
    if (open && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [open]);

  const handleSetReminder = useCallback((date: Date) => {
    onReminderChange(date.toISOString());
    setNativePickerActive(false);
    setOpen(false);
    setShowCustomPicker(false);
  }, [onReminderChange]);

  const handleRemove = () => {
    onReminderChange(null);
    setOpen(false);
    setShowCustomPicker(false);
  };

  const handlePickDateTime = () => {
    if (!isMobile) {
      setShowCustomPicker(true);
    }
    // On mobile, the <label> wrapping the hidden <input> handles it directly
  };

  // On mobile, read the final value only when the picker is dismissed (blur).
  // iOS Safari fires onChange on every wheel spin, so we ignore it entirely.
  const handleNativeBlur = useCallback(() => {
    const value = nativeInputRef.current?.value;
    if (value) {
      handleSetReminder(new Date(value));
    } else {
      setNativePickerActive(false);
      setOpen(false);
    }
  }, [handleSetReminder]);

  // Prevent popover from closing while the native date picker is active
  const preventDismiss = useCallback((e: Event) => {
    if (nativePickerActive) {
      e.preventDefault();
    }
  }, [nativePickerActive]);

  const formatLabels = { today: t("reminder.today"), tomorrow: t("reminder.tomorrow") };
  const laterToday = getLaterTodayTime();
  const tomorrowMorning = getTomorrowMorningTime();
  const tomorrowEvening = getTomorrowEveningTime();
  const nextMonday = getNextMondayTime();

  const presets = [
    laterToday ? {
      label: t("reminder.laterToday"),
      time: laterToday,
      timeLabel: formatReminderLabel(laterToday, formatLabels),
    } : null,
    {
      label: t("reminder.tomorrowMorning"),
      time: tomorrowMorning,
      timeLabel: formatReminderLabel(tomorrowMorning, formatLabels),
    },
    {
      label: t("reminder.tomorrowEvening"),
      time: tomorrowEvening,
      timeLabel: formatReminderLabel(tomorrowEvening, formatLabels),
    },
    {
      label: t("reminder.nextMonday"),
      time: nextMonday,
      timeLabel: formatReminderLabel(nextMonday, formatLabels),
    },
  ].filter(Boolean) as { label: string; time: Date; timeLabel: string }[];

  return (
    <Popover
      open={open && !disabled}
      onOpenChange={(o) => {
        if (!disabled && !nativePickerActive) {
          setOpen(o);
          if (!o) setShowCustomPicker(false);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-xl transition-colors",
            hasReminder && !overdue && "text-accent bg-accent/10",
            overdue && "text-destructive bg-destructive/10"
          )}
          title={t("tooltip.reminder")}
          disabled={disabled}
        >
          {hasReminder ? (
            <BellRing className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 shadow-lg border-border/40"
        align="end"
        onFocusOutside={preventDismiss}
        onInteractOutside={preventDismiss}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/40 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Bell className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  {t("reminder.title")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("reminder.subtitle")}
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            <div className="p-3 space-y-1">
              {/* Current reminder */}
              {hasReminder && (
                <div
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg mb-2",
                    overdue
                      ? "bg-destructive/10 text-destructive"
                      : "bg-accent/10 text-accent"
                  )}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <BellRing className="h-3.5 w-3.5" />
                    <span>{formatReminderLabel(new Date(reminderAt!), formatLabels)}</span>
                    {overdue && (
                      <span className="text-xs opacity-75">
                        ({t("reminder.overdue")})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="p-1 rounded hover:bg-background/50 transition-colors"
                    title={t("reminder.remove")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Show presets or custom picker */}
              {!showCustomPicker ? (
                <>
                  {/* Presets */}
                  {presets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleSetReminder(preset.time)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{preset.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {preset.timeLabel}
                      </span>
                    </button>
                  ))}

                  {/* Pick date & time */}
                  {isMobile ? (
                    /* On mobile: the native input covers the full row so the
                       user's tap directly hits it — iOS Safari requires this */
                    <div className="relative">
                      <div className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {t("reminder.pickDateTime")}
                        </span>
                      </div>
                      <input
                        ref={nativeInputRef}
                        type="datetime-local"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ fontSize: "16px" }}
                        onFocus={() => setNativePickerActive(true)}
                        onBlur={handleNativeBlur}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePickDateTime}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors"
                    >
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {t("reminder.pickDateTime")}
                      </span>
                    </button>
                  )}
                </>
              ) : (
                /* Desktop custom picker */
                <div className="px-1 py-1">
                  <CalendarTimePicker
                    initialDate={hasReminder ? new Date(reminderAt!) : undefined}
                    onConfirm={handleSetReminder}
                    onCancel={() => setShowCustomPicker(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

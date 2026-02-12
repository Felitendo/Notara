"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  setHours,
  setMinutes,
  format,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarTimePickerProps {
  initialDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

export function CalendarTimePicker({
  initialDate,
  onConfirm,
  onCancel,
}: CalendarTimePickerProps) {
  const t = useTranslations("notes");
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(initialDate || now);
  const [selectedDay, setSelectedDay] = useState<Date | null>(initialDate || null);

  // Time state
  const initHour = initialDate ? initialDate.getHours() : 8;
  const [hour12, setHour12] = useState(initHour === 0 ? 12 : initHour > 12 ? initHour - 12 : initHour);
  const [minute, setMinute] = useState(initialDate ? Math.round(initialDate.getMinutes() / 5) * 5 : 0);
  const [amPm, setAmPm] = useState<"AM" | "PM">(initHour >= 12 ? "PM" : "AM");

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const weekDayLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const handleConfirm = () => {
    if (!selectedDay) return;
    let h = hour12 % 12;
    if (amPm === "PM") h += 12;
    const result = setMinutes(setHours(selectedDay, h), minute);
    onConfirm(result);
  };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-3">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          className="p-1 rounded hover:bg-muted/50 text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="p-1 rounded hover:bg-muted/50 text-muted-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-0">
        {weekDayLabels.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day) => {
          const inMonth = isSameMonth(day, viewMonth);
          const selected = selectedDay && isSameDay(day, selectedDay);
          const today = isToday(day);
          const pastDay = isBefore(day, startOfToday);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={pastDay}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "h-8 w-full text-xs rounded transition-colors",
                !inMonth && "text-muted-foreground/30",
                inMonth && !selected && !pastDay && "hover:bg-muted/50",
                today && !selected && "font-bold text-accent",
                selected && "bg-accent text-accent-foreground font-medium",
                pastDay && "text-muted-foreground/30 cursor-not-allowed"
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      {/* Time Selector */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs text-muted-foreground font-medium shrink-0">
          {t("reminder.time")}
        </span>
        <div className="flex items-center gap-1 flex-1 justify-end">
          <select
            value={hour12}
            onChange={(e) => setHour12(Number(e.target.value))}
            className="h-7 w-14 text-xs rounded border border-border/40 bg-background px-1 focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">:</span>
          <select
            value={minute}
            onChange={(e) => setMinute(Number(e.target.value))}
            className="h-7 w-14 text-xs rounded border border-border/40 bg-background px-1 focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </select>
          <div className="flex rounded border border-border/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setAmPm("AM")}
              className={cn(
                "px-2 py-1 text-[10px] font-medium transition-colors",
                amPm === "AM"
                  ? "bg-accent text-accent-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted/50"
              )}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => setAmPm("PM")}
              className={cn(
                "px-2 py-1 text-[10px] font-medium transition-colors",
                amPm === "PM"
                  ? "bg-accent text-accent-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted/50"
              )}
            >
              PM
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-7 text-xs"
        >
          {t("reminder.cancel")}
        </Button>
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={!selectedDay}
          className="h-7 text-xs"
        >
          {t("reminder.save")}
        </Button>
      </div>
    </div>
  );
}

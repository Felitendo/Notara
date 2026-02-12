"use client";

import { cn } from "@/lib/utils";
import {
  getBackgroundStyle,
  getBackgroundColor,
} from "@/features/notes/backgrounds";
import { useTheme } from "next-themes";
import {
  DotsPattern,
  GridPattern,
  LinesPattern,
  WavesPattern,
  IconPattern,
} from "./patterns";

interface NoteBackgroundProps {
  styleId: string | null | undefined;
  className?: string;
  children?: React.ReactNode;
}

export function NoteBackground({
  styleId,
  className,
  children,
}: NoteBackgroundProps) {
  const { theme, systemTheme } = useTheme();
  // Use system theme as fallback if theme is not set
  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const isDark = resolvedTheme === "dark";
  const style = getBackgroundStyle(styleId);
  const backgroundColor = getBackgroundColor(styleId, isDark);

  if (!style || !backgroundColor) {
    return (
      <div className={cn("relative bg-card", className)}>{children}</div>
    );
  }

  const patternColor = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.05)";

  return (
    <div
      className={cn("relative", className)}
      style={{
        backgroundColor,
      }}
    >
      {style.isPattern && (
        <div className="absolute inset-0 overflow-hidden">
          {renderPattern(style.id, patternColor)}
        </div>
      )}
      {children}
    </div>
  );
}

function renderPattern(patternId: string, color: string) {
  switch (patternId) {
    case "pattern_dots":
      return <DotsPattern color={color} />;
    case "pattern_grid":
      return <GridPattern color={color} />;
    case "pattern_lines":
      return <LinesPattern color={color} />;
    case "pattern_waves":
      return <WavesPattern color={color} />;
    case "pattern_groceries":
    case "pattern_music":
    case "pattern_travel":
    case "pattern_code":
      return <IconPattern patternId={patternId} color={color} />;
    default:
      return null;
  }
}

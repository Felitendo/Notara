"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  SOLID_COLORS,
  PATTERNS,
} from "@/features/notes/backgrounds";
import { useTheme } from "next-themes";

interface NoteBackgroundPickerProps {
  selectedBackground: string | null | undefined;
  onBackgroundChange: (background: string | null) => void;
  disabled?: boolean;
}

export function NoteBackgroundPicker({
  selectedBackground,
  onBackgroundChange,
  disabled = false,
}: NoteBackgroundPickerProps) {
  const t = useTranslations("notes");
  const [open, setOpen] = useState(false);
  const { theme, systemTheme } = useTheme();
  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const isDark = resolvedTheme === "dark";

  const handleSelect = (styleId: string | null) => {
    onBackgroundChange(styleId);
    setOpen(false);
  };

  return (
    <Popover open={open && !disabled} onOpenChange={(open) => !disabled && setOpen(open)}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          title={t("tooltip.changeBackground")}
          disabled={disabled}
        >
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0 shadow-lg border-border/40"
        align="end"
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/40 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Palette className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  {t("background.title")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("background.subtitle")}
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Colors Section */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {t("background.color")}
                </h4>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* None / Default option */}
                  <button
                    type="button"
                    onClick={() => handleSelect(null)}
                    className={cn(
                      "w-12 h-12 rounded-full border-2 transition-all duration-200",
                      "flex items-center justify-center",
                      "hover:scale-110 active:scale-95",
                      selectedBackground === null
                        ? "border-accent"
                        : "border-border/40 hover:border-border"
                    )}
                    style={{
                      backgroundColor: "var(--card)",
                    }}
                    title={t("background.default")}
                  >
                    {selectedBackground === null && (
                      <Check className="h-4 w-4 text-accent" />
                    )}
                  </button>

                  {/* Solid Colors */}
                  {SOLID_COLORS.map((style) => {
                    const isSelected = selectedBackground === style.id;
                    const backgroundColor = isDark ? style.darkColor : style.lightColor;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => handleSelect(style.id)}
                        className={cn(
                          "w-12 h-12 rounded-full border-2 transition-all duration-200",
                          "flex items-center justify-center",
                          "hover:scale-110 active:scale-95",
                          isSelected
                            ? "border-accent"
                            : "border-transparent hover:border-border/60"
                        )}
                        style={{
                          backgroundColor,
                        }}
                        title={style.id.replace("color_", "").replace("_", " ")}
                      >
                        {isSelected && (
                          <Check
                            className="h-4 w-4"
                            style={{
                              color:
                                getLuminance(backgroundColor) > 0.5
                                  ? "#000"
                                  : "#fff",
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patterns Section */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {t("background.pattern")}
                </h4>
                <div className="flex items-center gap-3 flex-wrap">
                  {PATTERNS.map((style) => {
                    const isSelected = selectedBackground === style.id;
                    const backgroundColor = isDark ? style.darkColor : style.lightColor;
                    const patternColor = isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)";
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => handleSelect(style.id)}
                        className={cn(
                          "w-12 h-12 rounded-lg border-2 transition-all duration-200 overflow-hidden",
                          "flex items-center justify-center relative",
                          "hover:scale-110 active:scale-95",
                          isSelected
                            ? "border-accent"
                            : "border-border/40 hover:border-border"
                        )}
                        title={style.id
                          .replace("pattern_", "")
                          .replace("_", " ")}
                      >
                        <div
                          className="absolute inset-0"
                          style={{ backgroundColor }}
                        >
                          <PatternPreview
                            patternId={style.id}
                            color={patternColor}
                          />
                        </div>
                        {isSelected && (
                          <div className="relative z-10 w-5 h-5 rounded-full bg-white/80 flex items-center justify-center">
                            <Check className="h-3 w-3 text-black" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Lightweight inline pattern previews — no useTheme, no NoteBackground wrapper
function PatternPreview({
  patternId,
  color,
}: {
  patternId: string;
  color: string;
}) {
  switch (patternId) {
    case "pattern_dots":
      return (
        <svg className="w-full h-full">
          <defs>
            <pattern id="pp-dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="0" cy="0" r="2" fill={color} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pp-dots)" />
        </svg>
      );
    case "pattern_grid":
      return (
        <svg className="w-full h-full">
          <defs>
            <pattern id="pp-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="24" stroke={color} strokeWidth="1" />
              <line x1="0" y1="0" x2="24" y2="0" stroke={color} strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pp-grid)" />
        </svg>
      );
    case "pattern_lines":
      return (
        <svg className="w-full h-full">
          <defs>
            <pattern id="pp-lines" width="24" height="24" patternUnits="userSpaceOnUse">
              <line x1="0" y1="24" x2="24" y2="24" stroke={color} strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pp-lines)" />
        </svg>
      );
    case "pattern_waves":
      return (
        <svg className="w-full h-full">
          <defs>
            <pattern id="pp-waves" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 0 20 Q 10 10 20 20 Q 30 30 40 20" fill="none" stroke={color} strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pp-waves)" />
        </svg>
      );
    case "pattern_groceries":
    case "pattern_music":
    case "pattern_travel":
    case "pattern_code": {
      const svgPath = ICON_PREVIEW_PATHS[patternId];
      if (!svgPath) return null;
      const svgId = `pp-${patternId}`;
      return (
        <svg className="w-full h-full">
          <defs>
            <pattern id={svgId} width="60" height="120" patternUnits="userSpaceOnUse">
              <g
                transform="translate(8, 8)"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                dangerouslySetInnerHTML={{ __html: svgPath }}
              />
              <g
                transform="translate(38, 68)"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                dangerouslySetInnerHTML={{ __html: svgPath }}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${svgId})`} />
        </svg>
      );
    }
    default:
      return null;
  }
}

const ICON_PREVIEW_PATHS: Record<string, string> = {
  pattern_groceries:
    '<path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>',
  pattern_music:
    '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  pattern_travel:
    '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  pattern_code:
    '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
};

// Helper function to calculate luminance
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((val) => {
    val = val / 255;
    return val <= 0.03928
      ? val / 12.92
      : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ]
    : null;
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { usePreferencesStore } from "@/features/preferences";
import { locales, defaultLocale, getMessages, type Locale } from "./i18n";

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return defaultLocale;

  for (const lang of navigator.languages) {
    const code = lang.split("-")[0] as Locale;
    if (locales.includes(code)) return code;
  }
  return defaultLocale;
}

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { ui, setUIPreference } = usePreferencesStore();
  const [messages, setMessages] = useState<Record<string, unknown> | null>(null);
  const [activeLocale, setActiveLocale] = useState(defaultLocale);

  useEffect(() => {
    let locale = ui.locale as Locale;
    if (!locale) {
      locale = detectLocale();
      setUIPreference("locale", locale);
    }
    if (!locales.includes(locale)) {
      locale = defaultLocale;
    }

    setActiveLocale(locale);
    document.documentElement.lang = locale;

    getMessages(locale).then(setMessages);
  }, [ui.locale, setUIPreference]);

  if (!messages) return null;

  return (
    <NextIntlClientProvider locale={activeLocale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

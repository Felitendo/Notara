export const locales = ["en", "de"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
};

export async function getMessages(locale: string) {
  const safeLocale = locales.includes(locale as Locale) ? locale : defaultLocale;

  const [common, auth, notes, sidebar, settings, admin] = await Promise.all([
    import(`@/locales/${safeLocale}/common.json`).then((m) => m.default),
    import(`@/locales/${safeLocale}/auth.json`).then((m) => m.default),
    import(`@/locales/${safeLocale}/notes.json`).then((m) => m.default),
    import(`@/locales/${safeLocale}/sidebar.json`).then((m) => m.default),
    import(`@/locales/${safeLocale}/settings.json`).then((m) => m.default),
    import(`@/locales/${safeLocale}/admin.json`).then((m) => m.default),
  ]);

  return { common, auth, notes, sidebar, settings, admin };
}

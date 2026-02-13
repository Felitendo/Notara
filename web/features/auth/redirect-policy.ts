import type { OidcConfig } from "./types";

export function isManualAuthBypass(
  searchParams?: URLSearchParams | null,
): boolean {
  return searchParams?.get("manual") === "1";
}

export function shouldAutoRedirectToOidc(
  oidcConfig?: OidcConfig | null,
  searchParams?: URLSearchParams | null,
): boolean {
  if (!oidcConfig?.oidcEnabled) return false;
  if (!oidcConfig.autoRedirect) return false;
  if (isManualAuthBypass(searchParams)) return false;
  return true;
}

export function getLoggedOutRedirectTarget(
  oidcConfig?: OidcConfig | null,
  searchParams?: URLSearchParams | null,
): string {
  return shouldAutoRedirectToOidc(oidcConfig, searchParams)
    ? "/api/auth/oidc/authorize"
    : "/login";
}

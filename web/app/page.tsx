"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth, getOidcConfig, getLoggedOutRedirectTarget } from "@/features/auth";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isInitialized, initialize } = useAuth();

  const { data: oidcConfig, isLoading: oidcConfigLoading } = useQuery({
    queryKey: ["oidc-config"],
    queryFn: getOidcConfig,
    enabled: isInitialized && !isAuthenticated,
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized) return;

    // Redirect based on authentication status
    if (isAuthenticated) {
      router.replace("/notes");
    } else {
      if (oidcConfigLoading) return;
      const destination = getLoggedOutRedirectTarget(oidcConfig, searchParams);
      if (destination === "/api/auth/oidc/authorize") {
        window.location.href = destination;
        return;
      }
      router.replace(destination);
    }
  }, [isInitialized, isAuthenticated, oidcConfigLoading, oidcConfig, searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

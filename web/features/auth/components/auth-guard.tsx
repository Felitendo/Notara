"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth, getOidcConfig, getLoggedOutRedirectTarget } from "@/features/auth";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isInitialized, initialize } = useAuth();
  const hasRedirectedRef = useRef(false);

  const { data: oidcConfig, isLoading: oidcConfigLoading } = useQuery({
    queryKey: ["oidc-config"],
    queryFn: getOidcConfig,
    enabled: isInitialized && !isAuthenticated,
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized || isAuthenticated || oidcConfigLoading || hasRedirectedRef.current) {
      return;
    }

    hasRedirectedRef.current = true;
    const destination = getLoggedOutRedirectTarget(oidcConfig, searchParams);

    if (destination === "/api/auth/oidc/authorize") {
      window.location.href = destination;
      return;
    }

    router.push(destination);
  }, [isInitialized, isAuthenticated, oidcConfig, oidcConfigLoading, searchParams, router]);

  // Show loading state while initializing
  if (!isInitialized || (!isAuthenticated && oidcConfigLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

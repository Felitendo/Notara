"use client";

import { useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore, hasAccessToken } from "../store";
import { login as loginApi, register as registerApi, getMe, getOidcConfig } from "../api";
import type { LoginCredentials, RegisterCredentials } from "../types";
import { getLoggedOutRedirectTarget } from "../redirect-policy";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function useAuth() {
  const t = useTranslations("auth");
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isInitialized,
    setAuth,
    setUser,
    setInitialized,
    logout: clearAuth,
  } = useAuthStore();

  // Initialize auth state by validating token with server
  const initialize = useCallback(async () => {
    if (!hasAccessToken()) {
      setInitialized(true);
      return;
    }

    try {
      const user = await getMe();
      setUser(user);
      setInitialized(true);
    } catch {
      // Token is invalid, clear auth state
      clearAuth();
    }
  }, [setUser, setInitialized, clearAuth]);

  // Listen for unauthorized events from API client
  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuth();
      void (async () => {
        try {
          const oidcConfig = await getOidcConfig();
          const destination = getLoggedOutRedirectTarget(
            oidcConfig,
            new URLSearchParams(window.location.search),
          );

          if (destination === "/api/auth/oidc/authorize") {
            window.location.href = destination;
            return;
          }

          router.push(destination);
        } catch {
          router.push("/login");
        }
      })();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [clearAuth, router]);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => loginApi(credentials),
    onSuccess: (data) => {
      if (data.access_token && data.refresh_token) {
        setAuth(data.user, data.access_token, data.refresh_token);
        toast.success(t("login.welcomeBack"));
        router.push("/");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || t("login.failed"));
    },
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterCredentials) => registerApi(credentials),
    onSuccess: (data) => {
      if (data.access_token && data.refresh_token) {
        // User is active, log them in
        setAuth(data.user, data.access_token, data.refresh_token);
        toast.success(t("register.success"));
        router.push("/");
      } else {
        // User is pending approval
        toast.success(data.message || t("register.pendingApproval"));
        router.push("/login");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || t("register.failed"));
    },
  });

  const logout = useCallback(() => {
    clearAuth();
    void (async () => {
      try {
        const oidcConfig = await getOidcConfig();
        const destination = getLoggedOutRedirectTarget(
          oidcConfig,
          new URLSearchParams(window.location.search),
        );

        if (destination === "/api/auth/oidc/authorize") {
          window.location.href = destination;
          return;
        }

        router.push(destination);
      } catch {
        router.push("/login");
      }
    })();
  }, [clearAuth, router]);

  return {
    user,
    isAuthenticated,
    isInitialized,
    initialize,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
  };
}

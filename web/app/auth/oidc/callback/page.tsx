"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { exchangeOidcCode, getMe } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function OidcCallbackPage() {
  const t = useTranslations("auth.oidc");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const exchangedRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      toast.error(t("loginFailed"));
      router.replace("/login");
      return;
    }

    if (exchangedRef.current) return;
    exchangedRef.current = true;

    (async () => {
      try {
        const tokens = await exchangeOidcCode(code);

        // Store tokens temporarily so getMe can authenticate
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);

        // Fetch user profile
        const user = await getMe();
        useAuthStore.getState().setAuth(user, tokens.access_token, tokens.refresh_token);

        router.replace("/");
      } catch {
        toast.error(t("loginFailed"));
        router.replace("/login");
      }
    })();
  }, [searchParams, router, setAuth, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />
      <div className="relative z-10 w-full max-w-md mx-4">
        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t("processing")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

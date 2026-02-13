"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, Loader2, LogIn } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, getOidcConfig } from "@/features/auth";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const to = useTranslations("auth.oidc");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoginPending } = useAuth();

  const { data: oidcConfig } = useQuery({
    queryKey: ["oidc-config"],
    queryFn: getOidcConfig,
  });

  const showOidc = oidcConfig?.oidcEnabled;
  const showPasswordForm = !oidcConfig?.passwordAuthDisabled;
  const showBoth = showOidc && showPasswordForm;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  const handleOidcLogin = () => {
    window.location.href = "/api/auth/oidc/authorize";
  };

  return (
    <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-4 text-center pb-2">
        <div className="mx-auto flex items-center justify-center">
          <Image
            src="/icons/notara_icon.png"
            alt="Notara"
            width={64}
            height={64}
            className="rounded-[20%]"
          />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-3xl font-serif">{t("title")}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t("subtitle")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {showOidc && (
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 font-medium"
              onClick={handleOidcLogin}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {to("loginWith", { provider: oidcConfig.providerName })}
            </Button>
            {!showPasswordForm && (
              <p className="text-xs text-center text-muted-foreground">
                {to("passwordDisabledHint")}
              </p>
            )}
          </div>
        )}

        {showBoth && (
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{to("or")}</span>
            </div>
          </div>
        )}

        {showPasswordForm && (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-background/50"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-background/50"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                disabled={isLoginPending}
              >
                {isLoginPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("submitting")}
                  </>
                ) : (
                  t("submit")
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t("noAccount")}{" "}
                <Link
                  href="/register"
                  className="font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  {t("createOne")}
                </Link>
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


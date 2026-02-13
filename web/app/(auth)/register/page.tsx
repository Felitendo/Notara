"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, Loader2, AlertCircle, User, LogIn } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, getRegistrationMode, getOidcConfig } from "@/features/auth";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const to = useTranslations("auth.oidc");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { register, isRegisterPending } = useAuth();

  const { data: registrationMode, isLoading: modeLoading } = useQuery({
    queryKey: ["registration-mode"],
    queryFn: getRegistrationMode,
  });

  const { data: oidcConfig } = useQuery({
    queryKey: ["oidc-config"],
    queryFn: getOidcConfig,
  });

  const showOidc = oidcConfig?.oidcEnabled;
  const passwordDisabled = oidcConfig?.passwordAuthDisabled;

  const handleOidcLogin = () => {
    window.location.href = "/api/auth/oidc/authorize";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("errorPasswordMatch"));
      return;
    }

    if (password.length < 8) {
      setError(t("errorPasswordLength"));
      return;
    }

    if (!name.trim()) {
      setError(t("errorNameRequired"));
      return;
    }

    register({ email, password, name: name.trim() });
  };

  // Show loading state while checking registration mode
  if (modeLoading) {
    return (
      <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show disabled message if registration is disabled or password auth is off
  if (registrationMode?.mode === "disabled" || passwordDisabled) {
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
            <CardTitle className="text-3xl font-serif">{t("disabledTitle")}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t("disabledSubtitle")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50">
            <AlertCircle className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="flex-1 text-sm">
              <p className="text-muted-foreground">
                {passwordDisabled ? to("passwordDisabledHint") : t("disabledMessage")}
              </p>
            </div>
          </div>
          {showOidc && (
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 font-medium"
                onClick={handleOidcLogin}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {to("loginWith", { provider: oidcConfig.providerName })}
              </Button>
            </div>
          )}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("hasAccount")}{" "}
              <Link
                href="/login"
                className="font-medium text-accent hover:text-accent/80 transition-colors"
              >
                {t("signIn")}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            {registrationMode?.mode === "review"
              ? t("subtitleReview")
              : t("subtitle")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder={t("namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 h-12 bg-background/50"
                required
                maxLength={100}
              />
            </div>
          </div>
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
                minLength={8}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-12 bg-background/50"
                required
                minLength={8}
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            disabled={isRegisterPending}
          >
            {isRegisterPending ? (
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
            {t("hasAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-accent hover:text-accent/80 transition-colors"
            >
              {t("signIn")}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


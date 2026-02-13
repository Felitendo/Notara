"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminGuard } from "@/features/admin";
import {
  getAdminStats,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  getRegistrationSettings,
  updateRegistrationMode,
  getPendingUsers,
  approveUser,
  rejectUser,
  getOidcSettings,
  updateOidcSettings,
  testOidcConnection,
  type AdminUser,
  type CreateUserDto,
  type UpdateUserDto,
  type RegistrationMode,
} from "@/features/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Plus,
  Users,
  FileText,
  Tag,
  AlertTriangle,
  Loader2,
  Settings,
  Lock,
  CheckCircle,
  XCircle,
  Info,
  Copy,
  ShieldCheck,
  Plug,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useTranslations, useFormatter } from "next-intl";
import { MobileNav } from "@/components/layout";

export default function AdminPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const formatter = useFormatter();
  const queryClient = useQueryClient();
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [rejectUserDialogOpen, setRejectUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CreateUserDto>({
    email: "",
    password: "",
    name: "",
  });
  const [resetPasswordResult, setResetPasswordResult] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: getAdminStats,
  });

  const { data: registrationSettings, isLoading: registrationSettingsLoading } = useQuery({
    queryKey: ["admin", "settings", "registration"],
    queryFn: getRegistrationSettings,
  });

  const { data: pendingUsers = [], isLoading: pendingUsersLoading } = useQuery({
    queryKey: ["admin", "users", "pending"],
    queryFn: getPendingUsers,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => getUsers(),
  });

  const { data: oidcSettings, isLoading: oidcSettingsLoading } = useQuery({
    queryKey: ["admin", "settings", "oidc"],
    queryFn: getOidcSettings,
  });

  const updateRegistrationModeMutation = useMutation({
    mutationFn: updateRegistrationMode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "pending"] });
      toast.success(t("registration.modeUpdated"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("registration.modeFailed"));
    },
  });

  const updateOidcSettingsMutation = useMutation({
    mutationFn: updateOidcSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings", "oidc"] });
      toast.success(t("oidc.settingsUpdated"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("oidc.settingsFailed"));
    },
  });

  const testOidcConnectionMutation = useMutation({
    mutationFn: testOidcConnection,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(t("oidc.testSuccess"));
      } else {
        toast.error(data.error || t("oidc.testFailed"));
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || t("oidc.testFailed"));
    },
  });

  const approveUserMutation = useMutation({
    mutationFn: approveUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success(t("pending.approved"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("pending.approveFailed"));
    },
  });

  const rejectUserMutation = useMutation({
    mutationFn: rejectUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setRejectUserDialogOpen(false);
      setSelectedUser(null);
      toast.success(t("pending.rejected"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("pending.rejectFailed"));
    },
  });


  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setUserDialogOpen(false);
      setFormData({ email: "", password: "", name: "" });
      setIsEditing(false);
      toast.success(t("userDialog.createSuccess"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("userDialog.createFailed"));
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setUserDialogOpen(false);
      setSelectedUser(null);
      setFormData({ email: "", password: "", name: "" });
      setIsEditing(false);
      toast.success(t("userDialog.updateSuccess"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("userDialog.updateFailed"));
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setDeleteUserDialogOpen(false);
      setSelectedUser(null);
      toast.success(t("deleteDialog.success"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("deleteDialog.failed"));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => resetPassword(id),
    onSuccess: (data) => {
      setResetPasswordResult(data.newPassword || null);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(t("resetDialog.success"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("resetDialog.failed"));
    },
  });

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setFormData({ email: "", password: "", name: "" });
    setUserDialogOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setIsEditing(true);
    setFormData({ email: user.email, password: "", name: user.name || "" });
    setUserDialogOpen(true);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setSelectedUser(user);
    setDeleteUserDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const handleRejectUser = (user: AdminUser) => {
    setSelectedUser(user);
    setRejectUserDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (selectedUser) {
      rejectUserMutation.mutate(selectedUser.id);
    }
  };

  const handleResetPassword = (user: AdminUser) => {
    setSelectedUser(user);
    setResetPasswordResult(null);
    setResetPasswordDialogOpen(true);
  };

  const handleSubmitUser = () => {
    if (isEditing && selectedUser) {
      updateUserMutation.mutate({
        id: selectedUser.id,
        data: { email: formData.email, name: formData.name },
      });
    } else {
      if (!formData.password) {
        toast.error(t("userDialog.passwordRequired"));
        return;
      }
      createUserMutation.mutate(formData);
    }
  };

  const handleResetPasswordSubmit = () => {
    if (selectedUser) {
      resetPasswordMutation.mutate(selectedUser.id);
    }
  };

  const copyPassword = () => {
    if (resetPasswordResult) {
      navigator.clipboard.writeText(resetPasswordResult);
      toast.success(t("resetDialog.copied"));
    }
  };

  return (
    <AdminGuard>
      <MobileNav />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">{t("title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("stats.totalUsers")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.totalUsers || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("stats.totalNotes")}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.totalNotes || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("stats.totalTags")}</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.totalTags || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registration Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>{t("registration.title")}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {registrationSettingsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : registrationSettings ? (
              <>
                {registrationSettings.isLocked && (
                  <div className="flex items-start gap-2 p-3 border rounded-lg bg-muted/50">
                    <Lock className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {t("registration.envHint", { code: t("registration.envCode") })}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <Label className="whitespace-nowrap">{t("registration.mode")}</Label>
                    <ToggleGroup
                      type="single"
                      value={registrationSettings.mode}
                      onValueChange={(value) => {
                        if (value && !registrationSettings.isLocked) {
                          updateRegistrationModeMutation.mutate({ mode: value as RegistrationMode });
                        }
                      }}
                      disabled={registrationSettings.isLocked || updateRegistrationModeMutation.isPending}
                      className="justify-start border rounded-md"
                    >
                      <ToggleGroupItem value="enabled" aria-label={t("registration.enabled")}>
                        {t("registration.enabled")}
                      </ToggleGroupItem>
                      <ToggleGroupItem value="review" aria-label={t("registration.review")}>
                        {t("registration.review")}
                      </ToggleGroupItem>
                      <ToggleGroupItem value="disabled" aria-label={t("registration.disabled")}>
                        {t("registration.disabled")}
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {registrationSettings.mode === "disabled" && t("registration.disabledDescription")}
                    {registrationSettings.mode === "enabled" && t("registration.enabledDescription")}
                    {registrationSettings.mode === "review" && t("registration.reviewDescription")}
                  </p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* OIDC Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <CardTitle>{t("oidc.title")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {oidcSettingsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : oidcSettings ? (
              <>
                {/* OIDC Enabled */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">{t("oidc.enabled")}</Label>
                      {oidcSettings.oidcEnabled.isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{t("oidc.enabledHint")}</p>
                  </div>
                  <Switch
                    checked={oidcSettings.oidcEnabled.value === "true"}
                    disabled={oidcSettings.oidcEnabled.isLocked || updateOidcSettingsMutation.isPending}
                    onCheckedChange={(checked) =>
                      updateOidcSettingsMutation.mutate({ oidcEnabled: checked })
                    }
                  />
                </div>

                {/* Callback URL */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("oidc.callbackUrl")}</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={typeof window !== "undefined" ? `${window.location.origin}/api/auth/oidc/callback` : ""}
                      className="bg-muted/50 text-sm font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/api/auth/oidc/callback`);
                        toast.success(t("oidc.callbackCopied"));
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("oidc.callbackHint")}</p>
                </div>

                {/* Provider Name */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">{t("oidc.providerName")}</Label>
                    {oidcSettings.providerName.isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <Input
                    key={`provider-${oidcSettings.providerName.value}`}
                    defaultValue={oidcSettings.providerName.value}
                    disabled={oidcSettings.providerName.isLocked}
                    placeholder="OIDC"
                    onBlur={(e) => {
                      if (e.target.value !== oidcSettings.providerName.value) {
                        updateOidcSettingsMutation.mutate({ providerName: e.target.value });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">{t("oidc.providerNameHint")}</p>
                </div>

                {/* Issuer URL */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">{t("oidc.issuerUrl")}</Label>
                    {oidcSettings.issuerUrl.isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <Input
                    defaultValue={oidcSettings.issuerUrl.value}
                    disabled={oidcSettings.issuerUrl.isLocked}
                    placeholder="https://auth.example.com"
                    onBlur={(e) => {
                      if (e.target.value !== oidcSettings.issuerUrl.value) {
                        updateOidcSettingsMutation.mutate({ issuerUrl: e.target.value });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="bg-background/50 font-mono text-sm"
                  />
                </div>

                {/* Client ID */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">{t("oidc.clientId")}</Label>
                    {oidcSettings.clientId.isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <Input
                    defaultValue={oidcSettings.clientId.value}
                    disabled={oidcSettings.clientId.isLocked}
                    placeholder="notara"
                    onBlur={(e) => {
                      if (e.target.value !== oidcSettings.clientId.value) {
                        updateOidcSettingsMutation.mutate({ clientId: e.target.value });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="bg-background/50 font-mono text-sm"
                  />
                </div>

                {/* Client Secret */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">{t("oidc.clientSecret")}</Label>
                    {oidcSettings.clientSecret.isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <Input
                    type="password"
                    defaultValue=""
                    disabled={oidcSettings.clientSecret.isLocked}
                    placeholder={oidcSettings.clientSecret.value ? t("oidc.secretSet") : t("oidc.secretNotSet")}
                    onBlur={(e) => {
                      if (e.target.value) {
                        updateOidcSettingsMutation.mutate({ clientSecret: e.target.value });
                        e.target.value = "";
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">{t("oidc.clientSecretHint")}</p>
                </div>

                {/* Account Linking */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">{t("oidc.accountLinking")}</Label>
                      {oidcSettings.accountLinking.isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{t("oidc.accountLinkingHint")}</p>
                  </div>
                  <Switch
                    checked={oidcSettings.accountLinking.value === "true"}
                    disabled={oidcSettings.accountLinking.isLocked || updateOidcSettingsMutation.isPending}
                    onCheckedChange={(checked) =>
                      updateOidcSettingsMutation.mutate({ accountLinking: checked })
                    }
                  />
                </div>

                {/* Admin Group */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">{t("oidc.adminGroup")}</Label>
                    {oidcSettings.adminGroup?.isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <Input
                    key={`admin-group-${oidcSettings.adminGroup?.value ?? ""}`}
                    defaultValue={oidcSettings.adminGroup?.value ?? ""}
                    disabled={oidcSettings.adminGroup?.isLocked}
                    placeholder="notara-admins"
                    onBlur={(e) => {
                      if (e.target.value !== (oidcSettings.adminGroup?.value ?? "")) {
                        updateOidcSettingsMutation.mutate({ adminGroup: e.target.value });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">{t("oidc.adminGroupHint")}</p>
                </div>

                {/* Disable Password Auth */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">{t("oidc.disablePasswordAuth")}</Label>
                      {oidcSettings.disablePasswordAuth.isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{t("oidc.disablePasswordAuthHint")}</p>
                  </div>
                  <Switch
                    checked={oidcSettings.disablePasswordAuth.value === "true"}
                    disabled={oidcSettings.disablePasswordAuth.isLocked || updateOidcSettingsMutation.isPending}
                    onCheckedChange={(checked) =>
                      updateOidcSettingsMutation.mutate({ disablePasswordAuth: checked })
                    }
                  />
                </div>

                {/* Auto Redirect */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">{t("oidc.autoRedirect")}</Label>
                      {oidcSettings.autoRedirect.isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{t("oidc.autoRedirectHint")}</p>
                  </div>
                  <Switch
                    checked={oidcSettings.autoRedirect.value === "true"}
                    disabled={oidcSettings.autoRedirect.isLocked || updateOidcSettingsMutation.isPending}
                    onCheckedChange={(checked) =>
                      updateOidcSettingsMutation.mutate({ autoRedirect: checked })
                    }
                  />
                </div>

                {oidcSettings.autoRedirect.value === "true" && (
                  <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{t("oidc.manualBypassTitle")}</p>
                        <p className="text-xs text-muted-foreground">{t("oidc.manualBypassHint")}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("oidc.manualLoginUrl")}</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={typeof window !== "undefined" ? `${window.location.origin}/login?manual=1` : ""}
                          className="bg-background text-sm font-mono"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/login?manual=1`);
                            toast.success(t("oidc.manualBypassCopied"));
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("oidc.manualRegisterUrl")}</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={typeof window !== "undefined" ? `${window.location.origin}/register?manual=1` : ""}
                          className="bg-background text-sm font-mono"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/register?manual=1`);
                            toast.success(t("oidc.manualBypassCopied"));
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Test Connection */}
                <Button
                  variant="outline"
                  onClick={() => testOidcConnectionMutation.mutate()}
                  disabled={testOidcConnectionMutation.isPending}
                  className="w-full"
                >
                  {testOidcConnectionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("oidc.testing")}
                    </>
                  ) : (
                    <>
                      <Plug className="mr-2 h-4 w-4" />
                      {t("oidc.testConnection")}
                    </>
                  )}
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Pending Users */}
        {pendingUsers.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("pending.title")}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("pending.description")}
                  </p>
                </div>
                <Badge variant="outline" className="text-sm">
                  {pendingUsersLoading ? "..." : t("pending.count", { count: pendingUsers.length })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pendingUsersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("users.name")}</TableHead>
                      <TableHead>{t("users.email")}</TableHead>
                      <TableHead>{t("users.created")}</TableHead>
                      <TableHead className="text-right">{t("users.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          {formatter.dateTime(new Date(user.createdAt), { month: "short", day: "numeric", year: "numeric" })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => approveUserMutation.mutate(user.id)}
                              disabled={approveUserMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t("pending.approve")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectUser(user)}
                              disabled={rejectUserMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {t("pending.reject")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("users.title")}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("users.description")}
                </p>
              </div>
              <Button onClick={handleCreateUser}>
                <Plus className="h-4 w-4" />
                {t("users.createUser")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("users.name")}</TableHead>
                    <TableHead>{t("users.email")}</TableHead>
                    <TableHead>{t("users.role")}</TableHead>
                    <TableHead>{t("users.status")}</TableHead>
                    <TableHead>{t("users.notes")}</TableHead>
                    <TableHead>{t("users.tags")}</TableHead>
                    <TableHead>{t("users.created")}</TableHead>
                    <TableHead className="text-right">{t("users.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || "-"}</TableCell>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Badge variant="default">{t("users.admin")}</Badge>
                        ) : (
                          <Badge variant="outline">{t("users.user")}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.status === "pending" ? (
                          <Badge variant="secondary">{t("users.pending")}</Badge>
                        ) : (
                          <Badge variant="outline">{t("users.active")}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{user._count?.notes || 0}</TableCell>
                      <TableCell>{user._count?.tags || 0}</TableCell>
                      <TableCell>
                        {formatter.dateTime(new Date(user.createdAt), { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditUser(user)}
                            >
                              {t("users.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleResetPassword(user)}
                            >
                              {t("users.resetPassword")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user)}
                              className="text-destructive"
                            >
                              {t("users.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit User Dialog */}
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? t("userDialog.editTitle") : t("userDialog.createTitle")}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? t("userDialog.editDescription")
                  : t("userDialog.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("userDialog.name")}</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={t("userDialog.namePlaceholder")}
                  maxLength={100}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("userDialog.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder={t("userDialog.emailPlaceholder")}
                />
              </div>
              {!isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t("userDialog.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={t("userDialog.passwordPlaceholder")}
                    minLength={8}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setUserDialogOpen(false);
                  setFormData({ email: "", password: "", name: "" });
                  setIsEditing(false);
                  setSelectedUser(null);
                }}
              >
                {tc("cancel")}
              </Button>
              <Button
                onClick={handleSubmitUser}
                disabled={
                  createUserMutation.isPending ||
                  updateUserMutation.isPending ||
                  !formData.name ||
                  !formData.email ||
                  (!isEditing && !formData.password)
                }
              >
                {isEditing ? t("userDialog.update") : t("userDialog.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog
          open={resetPasswordDialogOpen}
          onOpenChange={setResetPasswordDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("resetDialog.title")}</DialogTitle>
              <DialogDescription>
                {t("resetDialog.description", { email: selectedUser?.email ?? "" })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {resetPasswordResult ? (
                <div className="space-y-2">
                  <Label>{t("resetDialog.newPassword")}</Label>
                  <div className="flex gap-2">
                    <Input value={resetPasswordResult} readOnly />
                    <Button onClick={copyPassword} variant="outline">
                      {t("resetDialog.copy")}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("resetDialog.hint")}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("resetDialog.generateHint")}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordDialogOpen(false);
                  setResetPasswordResult(null);
                  setSelectedUser(null);
                }}
              >
                {resetPasswordResult ? tc("close") : tc("cancel")}
              </Button>
              {!resetPasswordResult && (
                <Button
                  onClick={handleResetPasswordSubmit}
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending
                    ? t("resetDialog.resetting")
                    : t("resetDialog.submit")}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation Dialog */}
        <Dialog
          open={deleteUserDialogOpen}
          onOpenChange={setDeleteUserDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                {t("deleteDialog.title")}
              </DialogTitle>
              <DialogDescription className="pt-2">
                {t("deleteDialog.description", { email: selectedUser?.email ?? "" })}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="py-4 space-y-2">
                <div className="text-sm text-muted-foreground">
                  {t("deleteDialog.willDelete")}
                </div>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li>{t("deleteDialog.account")}</li>
                  <li>
                    {t("deleteDialog.noteCount", { count: selectedUser._count?.notes || 0 })}
                  </li>
                  <li>
                    {t("deleteDialog.tagCount", { count: selectedUser._count?.tags || 0 })}
                  </li>
                </ul>
                {selectedUser.isAdmin && (
                  <div className="pt-2 text-sm text-amber-600 dark:text-amber-500 font-medium">
                    {t("deleteDialog.adminWarning")}
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteUserDialogOpen(false);
                  setSelectedUser(null);
                }}
                disabled={deleteUserMutation.isPending}
              >
                {tc("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("deleteDialog.deleting")}
                  </>
                ) : (
                  t("deleteDialog.confirm")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject User Confirmation Dialog */}
        <Dialog
          open={rejectUserDialogOpen}
          onOpenChange={setRejectUserDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                {t("rejectDialog.title")}
              </DialogTitle>
              <DialogDescription className="pt-2">
                {t("rejectDialog.description", { email: selectedUser?.email ?? "" })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectUserDialogOpen(false);
                  setSelectedUser(null);
                }}
                disabled={rejectUserMutation.isPending}
              >
                {tc("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectConfirm}
                disabled={rejectUserMutation.isPending}
              >
                {rejectUserMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("rejectDialog.rejecting")}
                  </>
                ) : (
                  t("rejectDialog.confirm")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminGuard>
  );
}

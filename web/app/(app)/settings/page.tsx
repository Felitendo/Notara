"use client";

import { useState, useRef, useEffect } from "react";
import { Lock, Loader2, Eye, EyeOff, User, Upload, X, ListChecks, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changePassword, updateProfile, uploadProfileImage, removeProfileImage, getMe } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";
import { usePreferencesStore } from "@/features/preferences";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import packageJson from "../../../package.json";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { MobileNav } from "@/components/layout";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const { user, setUser } = useAuthStore();
  const { editor: editorPrefs, setEditorPreference } = usePreferencesStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [name, setName] = useState(user?.name ?? "");
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    user?.profileImage || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);

  // Sync profile image preview when local state changes
  useEffect(() => {
    if (user?.profileImage && !selectedFile && !shouldRemoveImage) {
      setProfileImagePreview(user.profileImage);
    }
  }, [user?.profileImage, selectedFile, shouldRemoveImage]);

  // Sync name only when user object changes
  useEffect(() => {
    if (user?.name !== undefined && user.name !== name) {
      setName(user.name);
    }
  }, [user?.name]);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string | null }) => {
      return updateProfile(data);
    },
    onSuccess: async (updatedUser) => {
      setUser(updatedUser);
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success(t("profile.success"));
    },
    onError: (error: Error) => {
      const errorMessage =
        error.message || t("profile.failed");
      toast.error(errorMessage);
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      return uploadProfileImage(file);
    },
    onSuccess: async (updatedUser) => {
      setUser(updatedUser);
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      if (updatedUser.profileImage) {
        setProfileImagePreview(updatedUser.profileImage);
      }
      setSelectedFile(null);
      setShouldRemoveImage(false);
    },
    onError: (error: Error) => {
      const errorMessage =
        error.message || t("profile.imageFailed");
      toast.error(errorMessage);
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: async () => {
      return removeProfileImage();
    },
    onSuccess: async (updatedUser) => {
      setUser(updatedUser);
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      setProfileImagePreview(null);
      setSelectedFile(null);
      setShouldRemoveImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: Error) => {
      const errorMessage =
        error.message || t("profile.removeImageFailed");
      toast.error(errorMessage);
    },
  });

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(t("profile.invalidFileType"));
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("profile.fileTooLarge"));
        return;
      }
      setSelectedFile(file);
      setShouldRemoveImage(false);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setShouldRemoveImage(true);
    setSelectedFile(null);
    setProfileImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const promises: Promise<any>[] = [];

    // Update name only if it changed and is not empty
    const trimmedName = name.trim();
    if (trimmedName !== (user?.name || "")) {
      promises.push(updateProfileMutation.mutateAsync({ name: trimmedName || null }));
    }

    // Upload image if selected (takes precedence over removal)
    if (selectedFile) {
      promises.push(uploadImageMutation.mutateAsync(selectedFile));
    } else if (shouldRemoveImage && user?.profileImage) {
      // Remove image if flag is set and no new file is selected
      promises.push(removeImageMutation.mutateAsync());
    }

    // Only make API calls if there are changes
    if (promises.length > 0) {
      await Promise.all(promises);
      toast.success(t("profile.success"));
      // Reset flags after successful save
      setShouldRemoveImage(false);
      setSelectedFile(null);
    }
  };

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success(t("password.success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPasswordError("");
      setNewPasswordError("");
      setConfirmPasswordError("");
    },
    onError: (error: Error) => {
      const errorMessage = error.message || t("password.failed");

      // Map API errors to appropriate fields
      if (errorMessage.toLowerCase().includes("current password") ||
        errorMessage.toLowerCase().includes("incorrect")) {
        setCurrentPasswordError(errorMessage);
        setNewPasswordError("");
        setConfirmPasswordError("");
      } else {
        // Generic error - could be validation or other issues
        setNewPasswordError(errorMessage);
        setCurrentPasswordError("");
        setConfirmPasswordError("");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setCurrentPasswordError("");
    setNewPasswordError("");
    setConfirmPasswordError("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t("password.errorMatch"));
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      setNewPasswordError(t("password.errorLength"));
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleCurrentPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPassword(e.target.value);
    if (currentPasswordError) {
      setCurrentPasswordError("");
    }
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    if (newPasswordError) {
      setNewPasswordError("");
    }
    if (confirmPasswordError && e.target.value === confirmPassword) {
      setConfirmPasswordError("");
    }
  };

  const handleNewPasswordBlur = () => {
    if (newPassword && newPassword.length < 8) {
      setNewPasswordError(t("password.errorLength"));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (confirmPasswordError) {
      setConfirmPasswordError("");
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword && confirmPassword.length < 8) {
      setConfirmPasswordError(t("password.errorLength"));
    } else if (confirmPassword && newPassword && confirmPassword !== newPassword) {
      setConfirmPasswordError(t("password.errorMatch"));
    }
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() ?? "U";
  };

  return (
    <>
      <MobileNav />
      <div className="container max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Profile Section */}
      <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm mb-6">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl">{t("profile.title")}</CardTitle>
          <CardDescription>
            {t("profile.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Profile Image */}
            <div className="space-y-2">
              <Label>{t("profile.image")}</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileImagePreview || undefined} alt={user?.name ?? user?.email ?? ""} />
                  <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProfileImageChange}
                    className="hidden"
                    id="profile-image-input"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {selectedFile ? t("profile.changeImage") : t("profile.uploadImage")}
                    </Button>
                    {(profileImagePreview || shouldRemoveImage) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemoveImage}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        {t("profile.remove")}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("profile.imageHint")}
                  </p>
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("profile.name")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder={t("profile.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 bg-background/50"
                  maxLength={100}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              disabled={updateProfileMutation.isPending || uploadImageMutation.isPending || removeImageMutation.isPending}
            >
              {updateProfileMutation.isPending || uploadImageMutation.isPending || removeImageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("profile.saving")}
                </>
              ) : (
                t("profile.save")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Editor Settings Section */}
      <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm mb-6">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl">{t("editor.title")}</CardTitle>
          <CardDescription>
            {t("editor.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sort checklist items */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="move-checked" className="text-base font-medium">
                {t("editor.sortChecklist")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("editor.sortChecklistDescription")}
              </p>
            </div>
            <Switch
              id="move-checked"
              checked={editorPrefs.sortChecklistItems}
              onCheckedChange={(checked) =>
                setEditorPreference("sortChecklistItems", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Change Password Section */}
      {user?.hasPassword !== false && (
      <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm mb-6">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl">{t("password.title")}</CardTitle>
          <CardDescription>
            {t("password.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t("password.current")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type={isCurrentPasswordVisible ? "text" : "password"}
                  placeholder={t("password.currentPlaceholder")}
                  value={currentPassword}
                  onChange={handleCurrentPasswordChange}
                  className={cn(
                    "pl-10 pr-10 h-12 bg-background/50",
                    currentPasswordError && "border-destructive focus:border-destructive focus:ring-destructive/20"
                  )}
                  aria-invalid={!!currentPasswordError}
                  required
                />
                {currentPassword && (
                  <button
                    type="button"
                    onClick={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isCurrentPasswordVisible ? (
                      <EyeOff className="h-4 w-4 opacity-40" />
                    ) : (
                      <Eye className="h-4 w-4 opacity-40" />
                    )}
                  </button>
                )}
              </div>
              {currentPasswordError && (
                <p className="text-xs text-destructive px-1">
                  {currentPasswordError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("password.new")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={isNewPasswordVisible ? "text" : "password"}
                  placeholder={t("password.newPlaceholder")}
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  onBlur={handleNewPasswordBlur}
                  className={cn(
                    "pl-10 pr-10 h-12 bg-background/50",
                    newPasswordError && "border-destructive focus:border-destructive focus:ring-destructive/20"
                  )}
                  aria-invalid={!!newPasswordError}
                  required
                />
                {newPassword && (
                  <button
                    type="button"
                    onClick={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isNewPasswordVisible ? (
                      <EyeOff className="h-4 w-4 opacity-40" />
                    ) : (
                      <Eye className="h-4 w-4 opacity-40" />
                    )}
                  </button>
                )}
              </div>
              {newPasswordError ? (
                <p className="text-xs text-destructive px-1">
                  {newPasswordError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("password.hint")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("password.confirm")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={isConfirmPasswordVisible ? "text" : "password"}
                  placeholder={t("password.confirmPlaceholder")}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  onBlur={handleConfirmPasswordBlur}
                  className={cn(
                    "pl-10 pr-10 h-12 bg-background/50",
                    confirmPasswordError && "border-destructive focus:border-destructive focus:ring-destructive/20"
                  )}
                  aria-invalid={!!confirmPasswordError}
                  required
                />
                {confirmPassword && (
                  <button
                    type="button"
                    onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isConfirmPasswordVisible ? (
                      <EyeOff className="h-4 w-4 opacity-40" />
                    ) : (
                      <Eye className="h-4 w-4 opacity-40" />
                    )}
                  </button>
                )}
              </div>
              {confirmPasswordError && (
                <p className="text-xs text-destructive px-1">
                  {confirmPasswordError}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("password.submitting")}
                </>
              ) : (
                t("password.submit")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Language Section */}
      <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm mb-6">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl">{t("language.title")}</CardTitle>
          <CardDescription>
            {t("language.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher variant="full" />
        </CardContent>
      </Card>

      {/* About Section */}
      <div>
        <div className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5" />
            <span>{tc("version", { version: packageJson.version })}</span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

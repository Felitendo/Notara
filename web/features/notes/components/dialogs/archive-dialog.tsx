"use client";

import { useTranslations } from "next-intl";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isArchived: boolean;
  onConfirm: () => void;
  isPending?: boolean;
}

export function ArchiveDialog({
  open,
  onOpenChange,
  isArchived,
  onConfirm,
  isPending = false,
}: ArchiveDialogProps) {
  const t = useTranslations("notes");
  const tc = useTranslations("common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {isArchived ? (
                <ArchiveRestore className="h-5 w-5 text-primary" />
              ) : (
                <Archive className="h-5 w-5 text-primary" />
              )}
            </div>
            {isArchived ? t("dialog.archive.unarchiveTitle") : t("dialog.archive.title")}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {isArchived
              ? t("dialog.archive.unarchiveDescription")
              : t("dialog.archive.description")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isArchived ? (
              t("dialog.archive.unarchiveConfirm")
            ) : (
              t("dialog.archive.confirm")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


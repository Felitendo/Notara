"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  count: number;
  isPending?: boolean;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  count,
  isPending = false,
}: BulkDeleteDialogProps) {
  const t = useTranslations("notes");
  const tc = useTranslations("common");

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          {t("dialog.bulkDelete.title")}
        </div>
      }
      description={t("dialog.bulkDelete.description", { count })}
      confirmLabel={tc("delete")}
      variant="destructive"
      isPending={isPending}
    />
  );
}


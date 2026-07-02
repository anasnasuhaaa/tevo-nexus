"use client";

import { Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { deleteProgressAction } from "./delete-action";

type DeleteProgressButtonProps = {
  progressId: string;
  programId: string;
  progressTitle: string;
  disabled?: boolean;
};

export function DeleteProgressButton({
  progressId,
  programId,
  progressTitle,
  disabled = false,
}: DeleteProgressButtonProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  function closeModal() {
    if (isDeleting) {
      return;
    }

    setIsOpen(false);
    setConfirmationText("");
  }

  async function handleDelete() {
    setIsDeleting(true);
    const response = await deleteProgressAction(progressId, confirmationText);
    setIsDeleting(false);

    if (!response.success) {
      toast.error("Gagal menghapus progress", {
        description: response.message,
        duration: 2000,
      });
      return;
    }

    toast.success("Progress dihapus", {
      description: response.message,
      duration: 2000,
    });

    closeModal();
    router.push(`/dashboard/programs/${programId}`);
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="border-status-inactive/30 text-status-inactive hover:bg-status-inactive-soft hover:text-status-inactive"
      >
        <Trash2 className="size-4" />
        Delete Progress
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-3xl border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black tracking-tight">
                  Hapus progress update?
                </h2>

                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Tindakan ini tidak dapat dibatalkan. Setelah progress dihapus,
                  capaian program terkait akan dihitung ulang dari progress
                  update terbaru yang masih tersimpan.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isDeleting}
                className="rounded-xl border p-2 text-muted-foreground transition hover:text-foreground"
                aria-label="Tutup modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Progress
              </p>
              <p className="mt-2 font-bold">{progressTitle}</p>
            </div>

            <div className="mt-5 space-y-2">
              <label
                htmlFor="deleteProgressConfirmation"
                className="text-sm font-semibold"
              >
                Ketik HAPUS untuk melanjutkan
              </label>

              <input
                id="deleteProgressConfirmation"
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                placeholder="HAPUS"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />

              <p className="text-xs leading-6 text-status-inactive">
                Progress dari program yang sudah ARCHIVED tidak bisa dihapus.
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={isDeleting}
              >
                Batal
              </Button>

              <Button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || confirmationText !== "HAPUS"}
                className="bg-status-inactive text-status-inactive-foreground hover:bg-status-inactive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Hapus Progress
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
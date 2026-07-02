"use client";

import { FormEvent, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { updateProgressAction } from "./actions";

type ProgressEditData = {
  id: string;
  title: string;
  note: string;
  obstacle: string | null;
  nextStep: string | null;
  progressPercent: number;
  status: string;
  reportedAt: string;
  programTitle: string;
  birdepCode: string;
  birdepName: string;
};

type ProgressEditFormProps = {
  progress: ProgressEditData;
};

export function ProgressEditForm({ progress }: ProgressEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setIsSubmitting(true);
    const response = await updateProgressAction(progress.id, formData);
    setIsSubmitting(false);

    if (!response.success) {
      toast.error("Gagal memperbarui progress", {
        description: response.message,
        duration: 2000,
      });
      return;
    }

    toast.success("Progress berhasil diperbarui", {
      description: response.message,
      duration: 2000,
    });

    router.push(`/dashboard/progress/${progress.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="font-black tracking-tight">Program Terkait</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Progress update ini terhubung dengan program berikut.
          </p>
        </div>

        <div className="rounded-2xl border bg-card px-4 py-3">
          <p className="text-sm font-bold">{progress.programTitle}</p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            {progress.birdepCode} · {progress.birdepName}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="font-black tracking-tight">Informasi Progress</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Perbarui judul, tanggal laporan, status, dan capaian progress.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-semibold">
              Judul Progress
            </label>

            <input
              id="title"
              name="title"
              required
              defaultValue={progress.title}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="reportedAt" className="text-sm font-semibold">
              Tanggal Laporan
            </label>

            <input
              id="reportedAt"
              name="reportedAt"
              type="date"
              required
              defaultValue={progress.reportedAt}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="progressPercent" className="text-sm font-semibold">
              Progress
            </label>

            <input
              id="progressPercent"
              name="progressPercent"
              type="number"
              min={0}
              max={100}
              required
              defaultValue={progress.progressPercent}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-semibold">
              Status Progress
            </label>

            <select
              id="status"
              name="status"
              defaultValue={progress.status}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ON_TRACK">Sesuai Rencana</option>
              <option value="AT_RISK">Berisiko</option>
              <option value="BLOCKED">Terhambat</option>
              <option value="DONE">Selesai</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="font-black tracking-tight">Catatan Laporan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Perbarui catatan, kendala, dan langkah berikutnya.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="note" className="text-sm font-semibold">
              Catatan Progress
            </label>

            <textarea
              id="note"
              name="note"
              required
              rows={5}
              defaultValue={progress.note}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="obstacle" className="text-sm font-semibold">
              Kendala
            </label>

            <textarea
              id="obstacle"
              name="obstacle"
              rows={4}
              defaultValue={progress.obstacle ?? ""}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="nextStep" className="text-sm font-semibold">
              Langkah Berikutnya
            </label>

            <textarea
              id="nextStep"
              name="nextStep"
              rows={4}
              defaultValue={progress.nextStep ?? ""}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-3xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-black tracking-tight">Simpan Perubahan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Program terkait akan disinkronkan ulang setelah perubahan disimpan.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Simpan Perubahan
            </>
          )}
        </Button>
      </section>
    </form>
  );
}
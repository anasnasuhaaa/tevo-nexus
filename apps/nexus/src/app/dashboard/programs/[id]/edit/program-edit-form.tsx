"use client";

import { FormEvent, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { updateProgramAction } from "./actions";

type BirdepOption = {
  id: string;
  name: string;
  code: string;
};

type ProgramEditData = {
  id: string;
  title: string;
  slug: string;
  birdepId: string;
  description: string;
  objective: string | null;
  startDate: string;
  endDate: string;
  status: string;
  progressPercent: number;
  pressReleaseUrl: string | null;
  isPublishedToTevo: boolean;
};

type ProgramEditFormProps = {
  program: ProgramEditData;
  birdeps: BirdepOption[];
};

export function ProgramEditForm({ program, birdeps }: ProgramEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setIsSubmitting(true);
    const response = await updateProgramAction(program.id, formData);
    setIsSubmitting(false);

    if (!response.success) {
      toast.error("Gagal memperbarui program", {
        description: response.message,
        duration: 2000,
      });
      return;
    }

    toast.success("Program berhasil diperbarui", {
      description: response.message,
      duration: 2000,
    });

    router.push(`/dashboard/programs/${program.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="font-black tracking-tight">Informasi Utama</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Perbarui identitas dasar program kerja.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-semibold">
              Nama Program Kerja
            </label>
            <input
              id="title"
              name="title"
              required
              defaultValue={program.title}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="text-sm font-semibold">
              Slug
            </label>
            <input
              id="slug"
              name="slug"
              defaultValue={program.slug}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Slug harus unik pada Birdep yang sama.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="birdepId" className="text-sm font-semibold">
              Birdep Pemilik
            </label>
            <select
              id="birdepId"
              name="birdepId"
              required
              defaultValue={program.birdepId}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Pilih Birdep</option>
              {birdeps.map((birdep) => (
                <option key={birdep.id} value={birdep.id}>
                  {birdep.code} — {birdep.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-semibold">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={program.status}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="PLANNED">Direncanakan</option>
              <option value="ONGOING">Berjalan</option>
              <option value="COMPLETED">Selesai</option>
              <option value="CANCELLED">Dibatalkan</option>
              <option value="ARCHIVED">Diarsipkan</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="font-black tracking-tight">Deskripsi Program</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Perbarui konteks dan tujuan program kerja.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-semibold">
              Deskripsi
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              defaultValue={program.description}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="objective" className="text-sm font-semibold">
              Tujuan
            </label>
            <textarea
              id="objective"
              name="objective"
              rows={4}
              defaultValue={program.objective ?? ""}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="font-black tracking-tight">Pelaksanaan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Perbarui tanggal, progress, dan publikasi program.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="startDate" className="text-sm font-semibold">
              Tanggal Mulai
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              defaultValue={program.startDate}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="endDate" className="text-sm font-semibold">
              Tanggal Selesai
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={program.endDate}
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
              defaultValue={program.progressPercent}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="pressReleaseUrl" className="text-sm font-semibold">
              Press Release URL
            </label>
            <input
              id="pressReleaseUrl"
              name="pressReleaseUrl"
              type="url"
              defaultValue={program.pressReleaseUrl ?? ""}
              placeholder="https://..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <label className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-sm font-semibold lg:col-span-2">
            <input
              name="isPublishedToTevo"
              type="checkbox"
              defaultChecked={program.isPublishedToTevo}
              className="size-4 accent-primary"
            />
            Publikasikan ke Tevo
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-3xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-black tracking-tight">Simpan Perubahan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pastikan data sudah benar sebelum diperbarui.
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
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@orma/database";
import { Activity, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ProgressEditForm } from "./progress-edit-form";

type EditProgressPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDateInput(date: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

async function getProgress(id: string) {
  return prisma.programProgressUpdate.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      title: true,
      note: true,
      obstacle: true,
      nextStep: true,
      progressPercent: true,
      status: true,
      reportedAt: true,
      program: {
        select: {
          title: true,
          status: true,
          birdep: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export default async function EditProgressPage({
  params,
}: EditProgressPageProps) {
  const { id } = await params;
  const progress = await getProgress(id);

  if (!progress) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Progress Update
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Edit Progress Update
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Perbarui laporan progress program kerja. Setelah disimpan,
              capaian program terkait akan disinkronkan ulang.
            </p>
          </div>

          <Link href={`/dashboard/progress/${progress.id}`}>
            <Button variant="outline">
              <ArrowLeft className="size-4" />
              Kembali
            </Button>
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Activity className="size-5" />
          </div>

          <div>
            <h2 className="font-black tracking-tight">Panduan Singkat</h2>
            <p className="mt-1 text-sm leading-7 text-muted-foreground">
              Progress dari program berstatus ARCHIVED tidak dapat diedit.
              Unarchive program terlebih dahulu jika benar-benar perlu revisi.
            </p>
          </div>
        </div>
      </section>

      <ProgressEditForm
        progress={{
          id: progress.id,
          title: progress.title,
          note: progress.note,
          obstacle: progress.obstacle,
          nextStep: progress.nextStep,
          progressPercent: progress.progressPercent,
          status: progress.status,
          reportedAt: formatDateInput(progress.reportedAt),
          programTitle: progress.program.title,
          birdepCode: progress.program.birdep.code,
          birdepName: progress.program.birdep.name,
        }}
      />
    </div>
  );
}
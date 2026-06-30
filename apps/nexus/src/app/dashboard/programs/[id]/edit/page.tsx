import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@orma/database";
import { ArrowLeft, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ProgramEditForm } from "./program-edit-form";

type EditProgramPageProps = {
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

async function getProgram(id: string) {
  return prisma.program.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      birdepId: true,
      description: true,
      objective: true,
      startDate: true,
      endDate: true,
      status: true,
      progressPercent: true,
      pressReleaseUrl: true,
      isPublishedToTevo: true,
    },
  });
}

async function getBirdeps() {
  return prisma.birdep.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      {
        unitType: "asc",
      },
      {
        name: "asc",
      },
    ],
    select: {
      id: true,
      name: true,
      code: true,
    },
  });
}

export default async function EditProgramPage({
  params,
}: EditProgramPageProps) {
  const { id } = await params;

  const [program, birdeps] = await Promise.all([getProgram(id), getBirdeps()]);

  if (!program) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Program Kerja
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Edit Program Kerja
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Perbarui informasi program kerja yang sudah tersimpan di Nexus.
              Perubahan ini akan memengaruhi data yang tampil di dashboard.
            </p>
          </div>

          <Link href={`/dashboard/programs/${program.id}`}>
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
            <FileText className="size-5" />
          </div>

          <div>
            <h2 className="font-black tracking-tight">Panduan Singkat</h2>
            <p className="mt-1 text-sm leading-7 text-muted-foreground">
              Slug program harus tetap unik untuk setiap Birdep. Jika slug
              diganti, pastikan tidak sama dengan program lain pada Birdep yang
              sama.
            </p>
          </div>
        </div>
      </section>

      <ProgramEditForm
        birdeps={birdeps}
        program={{
          id: program.id,
          title: program.title,
          slug: program.slug,
          birdepId: program.birdepId,
          description: program.description,
          objective: program.objective,
          startDate: formatDateInput(program.startDate),
          endDate: formatDateInput(program.endDate),
          status: program.status,
          progressPercent: program.progressPercent,
          pressReleaseUrl: program.pressReleaseUrl,
          isPublishedToTevo: program.isPublishedToTevo,
        }}
      />
    </div>
  );
}
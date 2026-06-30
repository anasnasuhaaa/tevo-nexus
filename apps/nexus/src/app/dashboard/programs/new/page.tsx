import Link from "next/link";
import { prisma } from "@orma/database";
import { ArrowLeft, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ProgramForm } from "./program-form";

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

export default async function NewProgramPage() {
  const birdeps = await getBirdeps();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Program Kerja
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Tambah Program Kerja
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Tambahkan program kerja secara manual ke dalam Nexus. Data ini
              akan terhubung dengan Birdep, progress update, dan publikasi Tevo.
            </p>
          </div>

          <Link href="/dashboard/programs">
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
              Slug program harus unik untuk setiap Birdep. Jika slug
              dikosongkan, sistem akan membuat slug otomatis dari nama program.
            </p>
          </div>
        </div>
      </section>

      <ProgramForm birdeps={birdeps} />
    </div>
  );
}
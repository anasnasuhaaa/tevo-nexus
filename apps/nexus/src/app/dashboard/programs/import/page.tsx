import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Flag,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { ProgramImportForm } from "./import-form";

const birdepCodes = [
  "BPH",
  "INTERNAL",
  "MEDBRAND",
  "RISTEK",
  "KOMIT",
  "ADKESMAH",
  "AKPRES",
  "KASTRAT",
  "PERAGA",
  "PSDM",
  "SENBUD",
  "SLH",
  "EKRAF",
];

const programStatuses = [
  {
    value: "PLANNED",
    label: "Direncanakan",
  },
  {
    value: "ONGOING",
    label: "Berjalan",
  },
  {
    value: "COMPLETED",
    label: "Selesai",
  },
  {
    value: "CANCELLED",
    label: "Dibatalkan",
  },
  {
    value: "ARCHIVED",
    label: "Diarsipkan",
  },
];

export default function ProgramImportPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Import Program Kerja
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Validasi File XLSX Program
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Upload file program kerja dalam format .xlsx untuk memeriksa kode
              Birdep, status program, tanggal pelaksanaan, progress, dan
              duplikasi slug sebelum data disimpan ke database.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/api/programs/import-template">
              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="size-4" />
                Download Template
              </Button>
            </Link>

            <Link href="/dashboard/programs">
              <Button variant="outline" className="w-full sm:w-auto">
                <ArrowLeft className="size-4" />
                Kembali
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Info className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="max-w-3xl">
              <h2 className="font-black tracking-tight">
                Panduan Pilihan Isian
              </h2>

              <p className="mt-1 text-sm leading-7 text-muted-foreground">
                Beberapa kolom program kerja memiliki pilihan nilai yang harus
                ditulis sesuai format berikut.
              </p>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileSpreadsheet className="size-5" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-foreground">
                      birdep_code
                    </p>

                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      Gunakan salah satu kode Birdep berikut.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {birdepCodes.map((code) => (
                    <code
                      key={code}
                      className="rounded-lg border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground"
                    >
                      {code}
                    </code>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Flag className="size-5" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-foreground">
                      status
                    </p>

                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      Gunakan salah satu status program berikut.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-xs">
                  {programStatuses.map((status) => (
                    <div
                      key={status.value}
                      className="grid gap-1 rounded-xl border bg-card px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <code className="font-semibold text-primary">
                        {status.value}
                      </code>

                      <span className="text-muted-foreground">
                        {status.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CalendarDays className="size-5" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-foreground">
                      start_date & end_date
                    </p>

                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      Gunakan format tanggal <code>YYYY-MM-DD</code>. Contoh:
                      <code> 2026-07-01</code>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-4">
                <p className="text-sm font-bold text-foreground">
                  is_published_to_tevo
                </p>

                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  Gunakan nilai TRUE/FALSE, YA/TIDAK, atau 1/0. Jika TRUE,
                  program akan disiapkan untuk kebutuhan publikasi ke Tevo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProgramImportForm />
    </div>
  );
}
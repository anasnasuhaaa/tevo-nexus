import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  Flag,
  Info,
  ListChecks,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { ProgressImportForm } from "./import-form";

const progressStatuses = [
  {
    value: "ON_TRACK",
    label: "Sesuai Rencana",
  },
  {
    value: "AT_RISK",
    label: "Berisiko",
  },
  {
    value: "BLOCKED",
    label: "Terhambat",
  },
  {
    value: "DONE",
    label: "Selesai",
  },
];

export default function ProgressImportPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Import Progress Update
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Validasi File XLSX Progress
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Upload file progress update dalam format .xlsx untuk memeriksa
              program terkait, kode Birdep, status progress, tanggal laporan,
              dan capaian sebelum data disimpan ke database.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/api/progress/import-template">
              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="size-4" />
                Download Template
              </Button>
            </Link>

            <Link href="/dashboard/progress">
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
                Gunakan referensi program dari template untuk memastikan
                kombinasi program_slug dan birdep_code sesuai dengan database.
              </p>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ListChecks className="size-5" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-foreground">
                      program_slug & birdep_code
                    </p>

                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      Kedua kolom ini harus cocok dengan program kerja yang
                      sudah tersedia di database Nexus.
                    </p>
                  </div>
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
                      Gunakan salah satu status progress berikut.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-xs">
                  {progressStatuses.map((status) => (
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
                      reported_at
                    </p>

                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      Gunakan format tanggal <code>YYYY-MM-DD</code>. Contoh:
                      <code> 2026-07-07</code>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-4">
                <p className="text-sm font-bold text-foreground">
                  progress_percent
                </p>

                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  Isi dengan angka 0 sampai 100. Nilai ini akan menjadi capaian
                  terbaru pada progress update yang diimport.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProgressImportForm />
    </div>
  );
}
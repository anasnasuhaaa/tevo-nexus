import { prisma } from "@orma/database";
import * as XLSX from "xlsx";

const headers = [
  "program_slug",
  "birdep_code",
  "title",
  "note",
  "obstacle",
  "next_step",
  "progress_percent",
  "status",
  "reported_at",
];

const statusReferences = [
  {
    status: "ON_TRACK",
    label: "Sesuai Rencana",
  },
  {
    status: "AT_RISK",
    label: "Berisiko",
  },
  {
    status: "BLOCKED",
    label: "Terhambat",
  },
  {
    status: "DONE",
    label: "Selesai",
  },
];

export async function GET() {
  const programs = await prisma.program.findMany({
    orderBy: [
      {
        birdep: {
          code: "asc",
        },
      },
      {
        title: "asc",
      },
    ],
    select: {
      title: true,
      slug: true,
      status: true,
      birdep: {
        select: {
          code: true,
          name: true,
        },
      },
    },
  });

  const exampleRows = [
    {
      program_slug: programs[0]?.slug ?? "angkasa-kost",
      birdep_code: programs[0]?.birdep.code ?? "RISTEK",
      title: "Progress Minggu 1",
      note: "Pendataan awal dan koordinasi tim sudah dilakukan.",
      obstacle: "",
      next_step: "Melanjutkan pengumpulan data dan validasi lapangan.",
      progress_percent: 30,
      status: "ON_TRACK",
      reported_at: "2026-07-07",
    },
  ];

  const guideRows = [
    {
      kolom: "program_slug",
      keterangan:
        "Slug program kerja yang sudah ada di Nexus. Ambil dari sheet Referensi Program.",
      contoh: "angkasa-kost",
    },
    {
      kolom: "birdep_code",
      keterangan:
        "Kode Birdep pemilik program. Harus sesuai dengan program_slug.",
      contoh: "RISTEK",
    },
    {
      kolom: "title",
      keterangan: "Judul laporan progress. Wajib diisi.",
      contoh: "Progress Minggu 1",
    },
    {
      kolom: "note",
      keterangan: "Catatan perkembangan program. Wajib diisi.",
      contoh: "Pendataan awal sudah dilakukan.",
    },
    {
      kolom: "obstacle",
      keterangan: "Kendala yang sedang dihadapi. Opsional.",
      contoh: "Belum semua data terkumpul.",
    },
    {
      kolom: "next_step",
      keterangan: "Tindak lanjut berikutnya. Opsional.",
      contoh: "Melanjutkan validasi data.",
    },
    {
      kolom: "progress_percent",
      keterangan: "Progress terbaru program. Angka 0 sampai 100.",
      contoh: "30",
    },
    {
      kolom: "status",
      keterangan:
        "Status progress. Ambil dari sheet Referensi Status Progress.",
      contoh: "ON_TRACK",
    },
    {
      kolom: "reported_at",
      keterangan: "Tanggal laporan. Format: YYYY-MM-DD.",
      contoh: "2026-07-07",
    },
  ];

  const workbook = XLSX.utils.book_new();

  const templateSheet = XLSX.utils.json_to_sheet(exampleRows, {
    header: headers,
  });

  const guideSheet = XLSX.utils.json_to_sheet(guideRows);

  const programSheet = XLSX.utils.json_to_sheet(
    programs.map((program) => ({
      program_slug: program.slug,
      program_title: program.title,
      birdep_code: program.birdep.code,
      birdep_name: program.birdep.name,
      program_status: program.status,
    })),
  );

  const statusSheet = XLSX.utils.json_to_sheet(statusReferences);

  templateSheet["!cols"] = headers.map(() => ({
    wch: 28,
  }));

  guideSheet["!cols"] = [
    { wch: 24 },
    { wch: 80 },
    { wch: 32 },
  ];

  programSheet["!cols"] = [
    { wch: 28 },
    { wch: 45 },
    { wch: 18 },
    { wch: 45 },
    { wch: 18 },
  ];

  statusSheet["!cols"] = [
    { wch: 18 },
    { wch: 28 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    templateSheet,
    "Template Import Progress",
  );
  XLSX.utils.book_append_sheet(workbook, guideSheet, "Panduan");
  XLSX.utils.book_append_sheet(workbook, programSheet, "Referensi Program");
  XLSX.utils.book_append_sheet(workbook, statusSheet, "Referensi Status");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="template-import-progress-update-nexus.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
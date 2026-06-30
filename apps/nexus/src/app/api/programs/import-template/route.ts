import { prisma } from "@orma/database";
import * as XLSX from "xlsx";

const headers = [
  "title",
  "slug",
  "birdep_code",
  "description",
  "objective",
  "start_date",
  "end_date",
  "status",
  "progress_percent",
  "press_release_url",
  "is_published_to_tevo",
];

const statusReferences = [
  {
    status: "PLANNED",
    label: "Direncanakan",
  },
  {
    status: "ONGOING",
    label: "Berjalan",
  },
  {
    status: "COMPLETED",
    label: "Selesai",
  },
  {
    status: "CANCELLED",
    label: "Dibatalkan",
  },
  {
    status: "ARCHIVED",
    label: "Diarsipkan",
  },
];

export async function GET() {
  const activeCabinet = await prisma.cabinetPeriod.findFirst({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  const birdeps = activeCabinet
    ? await prisma.birdep.findMany({
        where: {
          cabinetPeriodId: activeCabinet.id,
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
          code: true,
          name: true,
          unitType: true,
        },
      })
    : [];

  const exampleRows = [
    {
      title: "AngkasaKost",
      slug: "angkasa-kost",
      birdep_code: "RISTEK",
      description:
        "Program kerja untuk membantu mahasiswa baru mengenal pilihan kost sekitar IPB Dramaga.",
      objective:
        "Mempermudah mahasiswa baru dalam mencari informasi hunian yang relevan.",
      start_date: "2026-07-01",
      end_date: "2026-08-31",
      status: "ONGOING",
      progress_percent: 25,
      press_release_url: "",
      is_published_to_tevo: "FALSE",
    },
  ];

  const guideRows = [
    {
      kolom: "title",
      keterangan: "Nama program kerja. Wajib diisi.",
      contoh: "AngkasaKost",
    },
    {
      kolom: "slug",
      keterangan:
        "Identifier unik per Birdep. Gunakan huruf kecil dan tanda hubung. Jika kosong, sistem akan membuat dari title.",
      contoh: "angkasa-kost",
    },
    {
      kolom: "birdep_code",
      keterangan:
        "Kode Birdep pemilik program. Ambil dari sheet Referensi Kode Birdep.",
      contoh: "RISTEK",
    },
    {
      kolom: "description",
      keterangan: "Deskripsi program kerja. Wajib diisi.",
      contoh: "Program kerja untuk ...",
    },
    {
      kolom: "objective",
      keterangan: "Tujuan program kerja. Opsional.",
      contoh: "Mempermudah mahasiswa ...",
    },
    {
      kolom: "start_date",
      keterangan: "Tanggal mulai. Format: YYYY-MM-DD. Wajib diisi.",
      contoh: "2026-07-01",
    },
    {
      kolom: "end_date",
      keterangan:
        "Tanggal selesai. Opsional. Jika diisi, format: YYYY-MM-DD dan tidak boleh sebelum start_date.",
      contoh: "2026-08-31",
    },
    {
      kolom: "status",
      keterangan:
        "Status program kerja. Ambil dari sheet Referensi Status Program.",
      contoh: "ONGOING",
    },
    {
      kolom: "progress_percent",
      keterangan: "Progress angka 0 sampai 100.",
      contoh: "25",
    },
    {
      kolom: "press_release_url",
      keterangan: "Link press release. Opsional.",
      contoh: "https://...",
    },
    {
      kolom: "is_published_to_tevo",
      keterangan: "Status publikasi ke Tevo. Gunakan TRUE/FALSE.",
      contoh: "FALSE",
    },
  ];

  const workbook = XLSX.utils.book_new();

  const templateSheet = XLSX.utils.json_to_sheet(exampleRows, {
    header: headers,
  });

  const guideSheet = XLSX.utils.json_to_sheet(guideRows);

  const birdepSheet = XLSX.utils.json_to_sheet(
    birdeps.map((birdep) => ({
      code: birdep.code,
      name: birdep.name,
      unit_type: birdep.unitType,
      cabinet: activeCabinet?.name ?? "-",
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

  birdepSheet["!cols"] = [
    { wch: 18 },
    { wch: 55 },
    { wch: 18 },
    { wch: 32 },
  ];

  statusSheet["!cols"] = [
    { wch: 18 },
    { wch: 28 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    templateSheet,
    "Template Import Program",
  );
  XLSX.utils.book_append_sheet(workbook, guideSheet, "Panduan");
  XLSX.utils.book_append_sheet(workbook, birdepSheet, "Referensi Kode Birdep");
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
        'attachment; filename="template-import-program-kerja-nexus.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
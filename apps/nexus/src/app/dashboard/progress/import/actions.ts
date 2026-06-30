"use server";

import { prisma } from "@orma/database";
import * as XLSX from "xlsx";

const REQUIRED_HEADERS = [
  "program_slug",
  "birdep_code",
  "title",
  "note",
  "obstacle",
  "next_step",
  "progress_percent",
  "status",
  "reported_at",
] as const;

const VALID_PROGRESS_STATUSES = new Set([
  "ON_TRACK",
  "AT_RISK",
  "BLOCKED",
  "DONE",
]);

export type ProgressImportPreviewRow = {
  rowNumber: number;
  programSlug: string;
  birdepCode: string;
  title: string;
  note: string;
  obstacle: string;
  nextStep: string;
  progressPercent: number;
  status: string;
  reportedAt: string;
  validationStatus: "VALID" | "INVALID";
  errors: string[];
};

export type ProgressImportPreviewResult = {
  success: boolean;
  message: string;
  rows: ProgressImportPreviewRow[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
};

function emptyResult(message: string): ProgressImportPreviewResult {
  return {
    success: false,
    message,
    rows: [],
    summary: {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
    },
  };
}

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeCell(value: unknown) {
  return String(value ?? "").trim();
}

function parseProgressPercent(value: unknown) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return Number.NaN;
  }

  const numberValue = Number(normalized);

  if (!Number.isFinite(numberValue)) {
    return Number.NaN;
  }

  return numberValue;
}

function isValidDateString(value: string) {
  if (!value) {
    return false;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime());
}

function getProgramKey(birdepCode: string, programSlug: string) {
  return `${birdepCode}::${programSlug}`;
}

export async function parseProgressImportFile(
  formData: FormData,
): Promise<ProgressImportPreviewResult> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return emptyResult("File tidak ditemukan.");
  }

  if (!file.name.endsWith(".xlsx")) {
    return emptyResult("Format file tidak valid. Gunakan file .xlsx.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, {
    type: "buffer",
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return emptyResult("File tidak memiliki sheet.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
  });

  if (rawRows.length === 0) {
    return emptyResult("Sheet pertama kosong.");
  }

  const actualHeaders = Object.keys(rawRows[0] ?? {}).map(normalizeHeader);
  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !actualHeaders.includes(header),
  );

  if (missingHeaders.length > 0) {
    return emptyResult(
      `Header tidak lengkap. Kolom yang belum ada: ${missingHeaders.join(
        ", ",
      )}.`,
    );
  }

  const programs = await prisma.program.findMany({
    select: {
      id: true,
      slug: true,
      progressPercent: true,
      birdep: {
        select: {
          code: true,
        },
      },
    },
  });

  const validProgramKeys = new Set(
    programs.map((program) =>
      getProgramKey(program.birdep.code, program.slug),
    ),
  );

  const rows: ProgressImportPreviewRow[] = rawRows.map((rawRow, index) => {
    const normalizedRow = Object.fromEntries(
      Object.entries(rawRow).map(([key, value]) => [
        normalizeHeader(key),
        value,
      ]),
    );

    const programSlug = normalizeCell(normalizedRow.program_slug);
    const birdepCode = normalizeCell(normalizedRow.birdep_code).toUpperCase();
    const title = normalizeCell(normalizedRow.title);
    const note = normalizeCell(normalizedRow.note);
    const obstacle = normalizeCell(normalizedRow.obstacle);
    const nextStep = normalizeCell(normalizedRow.next_step);
    const progressPercent = parseProgressPercent(
      normalizedRow.progress_percent,
    );
    const status =
      normalizeCell(normalizedRow.status).toUpperCase() || "ON_TRACK";
    const reportedAt = normalizeCell(normalizedRow.reported_at);

    const errors: string[] = [];

    if (!programSlug) {
      errors.push("Program slug wajib diisi.");
    }

    if (!birdepCode) {
      errors.push("Kode Birdep wajib diisi.");
    }

    if (programSlug && birdepCode) {
      const programKey = getProgramKey(birdepCode, programSlug);

      if (!validProgramKeys.has(programKey)) {
        errors.push(
          "Kombinasi program_slug dan birdep_code tidak ditemukan di database.",
        );
      }
    }

    if (!title) {
      errors.push("Judul progress wajib diisi.");
    }

    if (!note) {
      errors.push("Catatan progress wajib diisi.");
    }

    if (
      Number.isNaN(progressPercent) ||
      progressPercent < 0 ||
      progressPercent > 100
    ) {
      errors.push("Progress harus berupa angka 0 sampai 100.");
    }

    if (!VALID_PROGRESS_STATUSES.has(status)) {
      errors.push("Status progress tidak valid.");
    }

    if (!isValidDateString(reportedAt)) {
      errors.push("Tanggal laporan wajib diisi dengan format YYYY-MM-DD.");
    }

    return {
      rowNumber: index + 2,
      programSlug,
      birdepCode,
      title,
      note,
      obstacle,
      nextStep,
      progressPercent: Number.isNaN(progressPercent) ? 0 : progressPercent,
      status,
      reportedAt,
      validationStatus: errors.length === 0 ? "VALID" : "INVALID",
      errors,
    };
  });

  const validRows = rows.filter((row) => row.validationStatus === "VALID").length;
  const invalidRows = rows.length - validRows;

  return {
    success: true,
    message:
      invalidRows === 0
        ? "File berhasil divalidasi. Semua baris valid."
        : "File berhasil dibaca, tetapi masih ada baris yang perlu diperbaiki.",
    rows,
    summary: {
      totalRows: rows.length,
      validRows,
      invalidRows,
    },
  };
}
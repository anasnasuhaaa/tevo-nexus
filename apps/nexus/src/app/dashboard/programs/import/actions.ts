"use server";

import { prisma } from "@orma/database";
import * as XLSX from "xlsx";

const REQUIRED_HEADERS = [
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
] as const;

const VALID_PROGRAM_STATUSES = new Set([
  "PLANNED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
]);

export type ProgramImportPreviewRow = {
  rowNumber: number;
  title: string;
  slug: string;
  birdepCode: string;
  description: string;
  objective: string;
  startDate: string;
  endDate: string;
  status: string;
  progressPercent: number;
  pressReleaseUrl: string;
  isPublishedToTevo: boolean;
  validationStatus: "VALID" | "INVALID";
  errors: string[];
};

export type ProgramImportPreviewResult = {
  success: boolean;
  message: string;
  rows: ProgramImportPreviewRow[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
};

function emptyResult(message: string): ProgramImportPreviewResult {
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

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseBoolean(value: unknown) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  return ["true", "1", "ya", "yes", "aktif", "published"].includes(normalized);
}

function parseProgressPercent(value: unknown) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return 0;
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

function isValidOptionalUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getCompositeSlugKey(birdepCode: string, slug: string) {
  return `${birdepCode}::${slug}`;
}

export async function parseProgramImportFile(
  formData: FormData,
): Promise<ProgramImportPreviewResult> {
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

  const activeCabinet = await prisma.cabinetPeriod.findFirst({
    where: {
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!activeCabinet) {
    return emptyResult("Periode kabinet aktif belum tersedia.");
  }

  const birdeps = await prisma.birdep.findMany({
    where: {
      cabinetPeriodId: activeCabinet.id,
      isActive: true,
    },
    select: {
      id: true,
      code: true,
    },
  });

  const validBirdepCodes = new Set(birdeps.map((birdep) => birdep.code));
  const birdepIdByCode = new Map(
    birdeps.map((birdep) => [birdep.code, birdep.id]),
  );

  const existingPrograms = await prisma.program.findMany({
    select: {
      slug: true,
      birdepId: true,
      birdep: {
        select: {
          code: true,
        },
      },
    },
  });

  const existingProgramKeys = new Set(
    existingPrograms.map((program) =>
      getCompositeSlugKey(program.birdep.code, program.slug),
    ),
  );

  const seenProgramKeys = new Set<string>();

  const rows: ProgramImportPreviewRow[] = rawRows.map((rawRow, index) => {
    const normalizedRow = Object.fromEntries(
      Object.entries(rawRow).map(([key, value]) => [
        normalizeHeader(key),
        value,
      ]),
    );

    const title = normalizeCell(normalizedRow.title);
    const rawSlug = normalizeCell(normalizedRow.slug);
    const slug = rawSlug ? createSlug(rawSlug) : createSlug(title);
    const birdepCode = normalizeCell(normalizedRow.birdep_code).toUpperCase();
    const description = normalizeCell(normalizedRow.description);
    const objective = normalizeCell(normalizedRow.objective);
    const startDate = normalizeCell(normalizedRow.start_date);
    const endDate = normalizeCell(normalizedRow.end_date);
    const status =
      normalizeCell(normalizedRow.status).toUpperCase() || "PLANNED";
    const progressPercent = parseProgressPercent(
      normalizedRow.progress_percent,
    );
    const pressReleaseUrl = normalizeCell(normalizedRow.press_release_url);
    const isPublishedToTevo = parseBoolean(
      normalizedRow.is_published_to_tevo,
    );

    const errors: string[] = [];

    if (!title) {
      errors.push("Nama program kerja wajib diisi.");
    }

    if (!slug) {
      errors.push("Slug wajib diisi atau title harus bisa dijadikan slug.");
    }

    if (!birdepCode) {
      errors.push("Kode Birdep wajib diisi.");
    } else if (!validBirdepCodes.has(birdepCode)) {
      errors.push("Kode Birdep tidak ditemukan.");
    }

    if (!description) {
      errors.push("Deskripsi program kerja wajib diisi.");
    }

    if (!VALID_PROGRAM_STATUSES.has(status)) {
      errors.push("Status program tidak valid.");
    }

    if (!isValidDateString(startDate)) {
      errors.push("Tanggal mulai wajib diisi dengan format YYYY-MM-DD.");
    }

    if (endDate && !isValidDateString(endDate)) {
      errors.push("Tanggal selesai harus menggunakan format YYYY-MM-DD.");
    }

    if (
      startDate &&
      endDate &&
      isValidDateString(startDate) &&
      isValidDateString(endDate)
    ) {
      const parsedStartDate = new Date(`${startDate}T00:00:00.000Z`);
      const parsedEndDate = new Date(`${endDate}T00:00:00.000Z`);

      if (parsedEndDate < parsedStartDate) {
        errors.push("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
      }
    }

    if (
      Number.isNaN(progressPercent) ||
      progressPercent < 0 ||
      progressPercent > 100
    ) {
      errors.push("Progress harus berupa angka 0 sampai 100.");
    }

    if (!isValidOptionalUrl(pressReleaseUrl)) {
      errors.push("Press release URL harus berupa URL http/https yang valid.");
    }

    const programKey = getCompositeSlugKey(birdepCode, slug);

    if (birdepCode && slug && seenProgramKeys.has(programKey)) {
      errors.push("Slug program duplikat di file untuk Birdep yang sama.");
    }

    if (birdepCode && slug && existingProgramKeys.has(programKey)) {
      errors.push("Slug program sudah ada di database untuk Birdep yang sama.");
    }

    if (birdepCode && slug) {
      seenProgramKeys.add(programKey);
    }

    if (birdepCode && !birdepIdByCode.has(birdepCode)) {
      errors.push("Relasi Birdep tidak valid.");
    }

    return {
      rowNumber: index + 2,
      title,
      slug,
      birdepCode,
      description,
      objective,
      startDate,
      endDate,
      status,
      progressPercent: Number.isNaN(progressPercent) ? 0 : progressPercent,
      pressReleaseUrl,
      isPublishedToTevo,
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
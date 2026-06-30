"use server";

import { OrganizationalPosition, prisma } from "@orma/database";
import { auth } from "@/lib/auth";
import * as XLSX from "xlsx";

const REQUIRED_HEADERS = [
  "full_name",
  "email",
  "nim",
  "primary_birdep_code",
  "organizational_position",
  "internal_title",
  "subdivision",
  "instagram",
  "additional_roles",
  "temporary_password",
  "is_active",
] as const;

const VALID_POSITIONS = new Set([
  "KETUA_ORGANISASI",
  "WAKIL_KETUA_ORGANISASI",
  "SEKRETARIS_INTERNAL",
  "SEKRETARIS_EKSTERNAL",
  "BENDAHARA_INTERNAL",
  "BENDAHARA_EKSTERNAL",
  "KETUA_BIRDEP",
  "SEKRETARIS_BIRDEP",
  "BENDAHARA_BIRDEP",
  "ANGGOTA_BIRDEP",
]);

export type ImportPreviewRow = {
  rowNumber: number;
  fullName: string;
  email: string;
  nim: string;
  primaryBirdepCode: string;
  organizationalPosition: string;
  internalTitle: string;
  subdivision: string;
  instagram: string;
  additionalRoles: string;
  temporaryPassword: string;
  isActive: boolean;
  status: "VALID" | "INVALID";
  errors: string[];
};

export type ImportPreviewResult = {
  success: boolean;
  message: string;
  rows: ImportPreviewRow[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
};

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeCell(value: unknown) {
  return String(value ?? "").trim();
}

function parseBoolean(value: unknown) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  return ["true", "1", "ya", "yes", "aktif"].includes(normalized);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function parseMemberImportFile(
  formData: FormData,
): Promise<ImportPreviewResult> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {
      success: false,
      message: "File tidak ditemukan.",
      rows: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
      },
    };
  }

  if (!file.name.endsWith(".xlsx")) {
    return {
      success: false,
      message: "Format file tidak valid. Gunakan file .xlsx.",
      rows: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
      },
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, {
    type: "buffer",
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return {
      success: false,
      message: "File tidak memiliki sheet.",
      rows: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
      },
    };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
  });

  if (rawRows.length === 0) {
    return {
      success: false,
      message: "Sheet pertama kosong.",
      rows: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
      },
    };
  }

  const actualHeaders = Object.keys(rawRows[0] ?? {}).map(normalizeHeader);
  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !actualHeaders.includes(header),
  );

  if (missingHeaders.length > 0) {
    return {
      success: false,
      message: `Header tidak lengkap. Kolom yang belum ada: ${missingHeaders.join(
        ", ",
      )}.`,
      rows: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
      },
    };
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
    return {
      success: false,
      message: "Periode kabinet aktif belum tersedia.",
      rows: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
      },
    };
  }

  const birdeps = await prisma.birdep.findMany({
    where: {
      cabinetPeriodId: activeCabinet.id,
      isActive: true,
    },
    select: {
      code: true,
    },
  });

  const validBirdepCodes = new Set(birdeps.map((birdep) => birdep.code));

  const existingMembers = await prisma.member.findMany({
    select: {
      nim: true,
    },
  });

  const existingUsers = await prisma.user.findMany({
    select: {
      email: true,
    },
  });

  const existingNims = new Set(existingMembers.map((member) => member.nim));
  const existingEmails = new Set(existingUsers.map((user) => user.email));

  const seenNims = new Set<string>();
  const seenEmails = new Set<string>();

  const rows: ImportPreviewRow[] = rawRows.map((rawRow, index) => {
    const normalizedRow = Object.fromEntries(
      Object.entries(rawRow).map(([key, value]) => [
        normalizeHeader(key),
        value,
      ]),
    );

    const fullName = normalizeCell(normalizedRow.full_name);
    const email = normalizeCell(normalizedRow.email).toLowerCase();
    const nim = normalizeCell(normalizedRow.nim);
    const primaryBirdepCode = normalizeCell(
      normalizedRow.primary_birdep_code,
    ).toUpperCase();
    const organizationalPosition = normalizeCell(
      normalizedRow.organizational_position,
    ).toUpperCase();
    const internalTitle = normalizeCell(normalizedRow.internal_title);
    const subdivision = normalizeCell(normalizedRow.subdivision);
    const instagram = normalizeCell(normalizedRow.instagram).replace(/^@/, "");
    const additionalRoles = normalizeCell(normalizedRow.additional_roles);
    const temporaryPassword = normalizeCell(normalizedRow.temporary_password);
    const isActive = parseBoolean(normalizedRow.is_active);

    const errors: string[] = [];

    if (!fullName) {
      errors.push("Nama lengkap wajib diisi.");
    }

    if (!email) {
      errors.push("Email wajib diisi.");
    } else if (!isValidEmail(email)) {
      errors.push("Format email tidak valid.");
    } else if (existingEmails.has(email)) {
      errors.push("Email sudah terdaftar di database.");
    } else if (seenEmails.has(email)) {
      errors.push("Email duplikat di file.");
    }

    if (!nim) {
      errors.push("NIM wajib diisi.");
    } else if (existingNims.has(nim)) {
      errors.push("NIM sudah terdaftar di database.");
    } else if (seenNims.has(nim)) {
      errors.push("NIM duplikat di file.");
    }

    if (!primaryBirdepCode) {
      errors.push("Kode Birdep wajib diisi.");
    } else if (!validBirdepCodes.has(primaryBirdepCode)) {
      errors.push("Kode Birdep tidak ditemukan.");
    }

    if (!organizationalPosition) {
      errors.push("Jabatan organisasi wajib diisi.");
    } else if (!VALID_POSITIONS.has(organizationalPosition)) {
      errors.push("Jabatan organisasi tidak valid.");
    }

    if (!temporaryPassword) {
      errors.push("Temporary password wajib diisi.");
    }

    if (nim) {
      seenNims.add(nim);
    }

    if (email) {
      seenEmails.add(email);
    }

    return {
      rowNumber: index + 2,
      fullName,
      email,
      nim,
      primaryBirdepCode,
      organizationalPosition,
      internalTitle,
      subdivision,
      instagram,
      additionalRoles,
      temporaryPassword,
      isActive,
      status: errors.length === 0 ? "VALID" : "INVALID",
      errors,
    };
  });

  const validRows = rows.filter((row) => row.status === "VALID").length;
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

export type ConfirmImportResult = {
  success: boolean;
  message: string;
  summary: {
    importedRows: number;
    skippedRows: number;
  };
};

function getDefaultRoleFromPosition(position: string) {
  const roleMap: Record<string, string> = {
    KETUA_ORGANISASI: "BPH",
    WAKIL_KETUA_ORGANISASI: "BPH",
    SEKRETARIS_INTERNAL: "BPH",
    SEKRETARIS_EKSTERNAL: "BPH",
    BENDAHARA_INTERNAL: "BPH",
    BENDAHARA_EKSTERNAL: "BPH",
    KETUA_BIRDEP: "KETUA_BIRDEP",
    SEKRETARIS_BIRDEP: "SEKRETARIS_BIRDEP",
    BENDAHARA_BIRDEP: "BENDAHARA_BIRDEP",
    ANGGOTA_BIRDEP: "ANGGOTA_BIRDEP",
  };

  return roleMap[position] ?? "ANGGOTA_BIRDEP";
}

function parseAdditionalRoles(value: string) {
  return value
    .split(",")
    .map((role) => role.trim().toUpperCase())
    .filter(Boolean);
}

export async function confirmMemberImportFile(
  formData: FormData,
): Promise<ConfirmImportResult> {
  const preview = await parseMemberImportFile(formData);

  if (!preview.success) {
    return {
      success: false,
      message: preview.message,
      summary: {
        importedRows: 0,
        skippedRows: 0,
      },
    };
  }

  if (preview.summary.invalidRows > 0) {
    return {
      success: false,
      message:
        "Import dibatalkan. Masih ada baris invalid, silakan perbaiki file terlebih dahulu.",
      summary: {
        importedRows: 0,
        skippedRows: preview.summary.invalidRows,
      },
    };
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
    return {
      success: false,
      message: "Periode kabinet aktif belum tersedia.",
      summary: {
        importedRows: 0,
        skippedRows: 0,
      },
    };
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

  const birdepByCode = new Map(birdeps.map((birdep) => [birdep.code, birdep]));

  const roles = await prisma.role.findMany({
    select: {
      id: true,
      code: true,
    },
  });

  const roleByCode = new Map(roles.map((role) => [role.code, role]));

  const validRoleCodes = new Set(roles.map((role) => role.code));

  for (const row of preview.rows) {
    const defaultRole = getDefaultRoleFromPosition(row.organizationalPosition);
    const additionalRoles = parseAdditionalRoles(row.additionalRoles);

    const allRoleCodes = Array.from(new Set([defaultRole, ...additionalRoles]));

    for (const roleCode of allRoleCodes) {
      if (!validRoleCodes.has(roleCode)) {
        return {
          success: false,
          message: `Role ${roleCode} pada baris ${row.rowNumber} tidak ditemukan di database.`,
          summary: {
            importedRows: 0,
            skippedRows: preview.rows.length,
          },
        };
      }
    }
  }

  let importedRows = 0;

  for (const row of preview.rows) {
    const birdep = birdepByCode.get(row.primaryBirdepCode);

    if (!birdep) {
      return {
        success: false,
        message: `Kode Birdep ${row.primaryBirdepCode} tidak ditemukan.`,
        summary: {
          importedRows,
          skippedRows: preview.rows.length - importedRows,
        },
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: row.email,
      },
    });

    const existingMember = await prisma.member.findUnique({
      where: {
        nim: row.nim,
      },
    });

    if (existingUser || existingMember) {
      return {
        success: false,
        message: `Import dibatalkan. Data pada baris ${row.rowNumber} sudah ada di database.`,
        summary: {
          importedRows,
          skippedRows: preview.rows.length - importedRows,
        },
      };
    }

    await auth.api.createUser({
      body: {
        name: row.fullName,
        email: row.email,
        password: row.temporaryPassword,
        role: "user",
      },
    });

    const createdUser = await prisma.user.findUniqueOrThrow({
      where: {
        email: row.email,
      },
    });

    const createdMember = await prisma.member.create({
      data: {
        fullName: row.fullName,
        nim: row.nim,
        instagram: row.instagram || null,
        isActive: row.isActive,
      },
    });

    await prisma.membership.create({
      data: {
        memberId: createdMember.id,
        cabinetPeriodId: activeCabinet.id,
        primaryBirdepId: birdep.id,
        organizationalPosition:
          row.organizationalPosition as OrganizationalPosition,
        internalTitle: row.internalTitle || null,
        subdivision: row.subdivision || null,
        programRoles: null,
      },
    });

    await prisma.user.update({
      where: {
        id: createdUser.id,
      },
      data: {
        name: row.fullName,
        emailVerified: true,
        image: null,
        role: getDefaultRoleFromPosition(row.organizationalPosition),
        mustChangePassword: true,
        memberId: createdMember.id,
        updatedAt: new Date(),
      },
    });

    const defaultRole = getDefaultRoleFromPosition(row.organizationalPosition);
    const additionalRoles = parseAdditionalRoles(row.additionalRoles);
    const allRoleCodes = Array.from(new Set([defaultRole, ...additionalRoles]));

    for (const roleCode of allRoleCodes) {
      const role = roleByCode.get(roleCode);

      if (!role) {
        continue;
      }

      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: createdUser.id,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          userId: createdUser.id,
          roleId: role.id,
        },
      });
    }

    importedRows++;
  }

  return {
    success: true,
    message: `${importedRows} anggota berhasil diimport ke database.`,
    summary: {
      importedRows,
      skippedRows: 0,
    },
  };
}

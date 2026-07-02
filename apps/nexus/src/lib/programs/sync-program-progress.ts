import { prisma, ProgramStatus } from "@orma/database";

function getProgramStatusFromProgress(status: string): ProgramStatus | null {
  if (status === "DONE") {
    return "COMPLETED";
  }

  return null;
}

export async function syncProgramProgress(programId: string, userId?: string) {
  const latestProgress = await prisma.programProgressUpdate.findFirst({
    where: {
      programId,
    },
    orderBy: [
      {
        reportedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      progressPercent: true,
      status: true,
    },
  });

  if (!latestProgress) {
    await prisma.program.update({
      where: {
        id: programId,
      },
      data: {
        progressPercent: 0,
        ...(userId
          ? {
              updatedByUserId: userId,
            }
          : {}),
      },
    });

    return;
  }

  const nextStatus = getProgramStatusFromProgress(latestProgress.status);

  await prisma.program.update({
    where: {
      id: programId,
    },
    data: {
      progressPercent: latestProgress.progressPercent,
      ...(nextStatus
        ? {
            status: nextStatus,
          }
        : {}),
      ...(userId
        ? {
            updatedByUserId: userId,
          }
        : {}),
    },
  });
}
import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";

describe("clean database installation", () => {
  it("applies all migrations on an empty database", async () => {
    const migs = await prisma.$queryRaw<{ migration_name: string; finished_at: Date | null }[]>`
      SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY migration_name`;
    expect(migs.map((m) => m.migration_name)).toEqual([
      "20261007000000_init",
      "20261007000100_integrity",
    ]);
    expect(migs.every((m) => m.finished_at !== null)).toBe(true);
  });

  it("starts empty (no leaked coaching-centre data)", async () => {
    expect(await prisma.account.count()).toBe(0);
    expect(await prisma.student.count()).toBe(0);
  });

  it("enforces one active incharge per class at the database level", async () => {
    const year = await prisma.academicYear.create({
      data: { name: "T-1", startDate: new Date("2026-04-01"), endDate: new Date("2027-03-31") },
    });
    const cls = await prisma.schoolClass.create({
      data: { academicYearId: year.id, name: "Class 1", level: 1 },
    });
    const mk = (n: number) =>
      prisma.account.create({
        data: { authEmail: `t${n}@x.test`, kind: "STAFF", displayName: `T${n}` },
      });
    const [a, b] = [await mk(1), await mk(2)];
    await prisma.positionAssignment.create({
      data: { accountId: a.id, position: "TEACHER_INCHARGE", classId: cls.id },
    });
    await expect(
      prisma.positionAssignment.create({
        data: { accountId: b.id, position: "TEACHER_INCHARGE", classId: cls.id },
      }),
    ).rejects.toThrow();
    // history is preserved: ending the first frees the slot
    await prisma.positionAssignment.updateMany({
      where: { accountId: a.id },
      data: { endedAt: new Date() },
    });
    await prisma.positionAssignment.create({
      data: { accountId: b.id, position: "TEACHER_INCHARGE", classId: cls.id },
    });
  });
});

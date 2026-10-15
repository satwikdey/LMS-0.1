import { prisma, transact, type Db, type Tx } from "@/lib/db";
import { audit } from "@/lib/audit";
import { badRequest, conflict, notFound } from "@/lib/errors";
import { SubjectType, YearStatus } from "@prisma/client";

export interface CreateAcademicYearInput {
  name: string;
  startDate: Date;
  endDate: Date;
  status?: YearStatus;
}

export async function createAcademicYear(db: Db, input: CreateAcademicYearInput, actorId?: string) {
  if (input.endDate <= input.startDate) {
    throw badRequest("End date must be after start date");
  }

  return await transact(async (tx) => {
    if (input.status === "ACTIVE") {
      const existingActive = await tx.academicYear.findFirst({
        where: { status: "ACTIVE" },
      });
      if (existingActive) {
        throw conflict("Another academic year is already active. Close or mark it planned before activating this one.");
      }
    }

    const year = await tx.academicYear.create({
      data: {
        name: input.name.trim(),
        startDate: input.startDate,
        endDate: input.endDate,
        status: input.status || "PLANNED",
      },
    });

    await audit(tx, {
      actorId,
      action: "ACADEMIC_YEAR_CREATED",
      entityType: "AcademicYear",
      entityId: year.id,
      summary: `Created academic year ${year.name}`,
    });

    return year;
  });
}

export async function setAcademicYearStatus(db: Db, yearId: string, status: YearStatus, actorId?: string) {
  return await transact(async (tx) => {
    const year = await tx.academicYear.findUnique({ where: { id: yearId } });
    if (!year) throw notFound("Academic year");

    if (status === "ACTIVE") {
      const activeOther = await tx.academicYear.findFirst({
        where: { status: "ACTIVE", id: { not: yearId } },
      });
      if (activeOther) {
        throw conflict(`Academic year "${activeOther.name}" is currently active. Deactivate it first.`);
      }
    }

    const updated = await tx.academicYear.update({
      where: { id: yearId },
      data: { status },
    });

    await audit(tx, {
      actorId,
      action: "ACADEMIC_YEAR_STATUS_CHANGED",
      entityType: "AcademicYear",
      entityId: yearId,
      summary: `Academic year ${year.name} status changed to ${status}`,
    });

    return updated;
  });
}

export interface CreateClassInput {
  academicYearId: string;
  name: string;
  level: number;
  hasStreams?: boolean;
}

export async function createClass(db: Db, input: CreateClassInput, actorId?: string) {
  return await transact(async (tx) => {
    const year = await tx.academicYear.findUnique({ where: { id: input.academicYearId } });
    if (!year) throw notFound("Academic year");

    const existingName = await tx.schoolClass.findFirst({
      where: { academicYearId: input.academicYearId, name: input.name.trim() },
    });
    if (existingName) throw conflict(`Class "${input.name}" already exists in this academic year`);

    const existingLevel = await tx.schoolClass.findFirst({
      where: { academicYearId: input.academicYearId, level: input.level },
    });
    if (existingLevel) throw conflict(`A class with level ${input.level} already exists in this academic year`);

    const cls = await tx.schoolClass.create({
      data: {
        academicYearId: input.academicYearId,
        name: input.name.trim(),
        level: input.level,
        hasStreams: input.hasStreams || false,
      },
    });

    await audit(tx, {
      actorId,
      action: "CLASS_CREATED",
      entityType: "SchoolClass",
      entityId: cls.id,
      summary: `Created class ${cls.name} (level ${cls.level}) in ${year.name}`,
    });

    return cls;
  });
}

export interface CreateSectionInput {
  classId: string;
  name: string;
  capacity?: number;
  room?: string | null;
}

export async function createSection(db: Db, input: CreateSectionInput, actorId?: string) {
  return await transact(async (tx) => {
    const cls = await tx.schoolClass.findUnique({
      where: { id: input.classId },
      include: { classSubjects: true },
    });
    if (!cls) throw notFound("Class");

    const existing = await tx.section.findUnique({
      where: { classId_name: { classId: input.classId, name: input.name.trim() } },
    });
    if (existing) throw conflict(`Section "${input.name}" already exists for this class`);

    const section = await tx.section.create({
      data: {
        classId: input.classId,
        name: input.name.trim(),
        capacity: input.capacity && input.capacity > 0 ? input.capacity : 40,
        room: input.room?.trim() || null,
      },
    });

    // Auto-create SectionSubject offerings for existing class subjects
    for (const cs of cls.classSubjects) {
      await tx.sectionSubject.create({
        data: {
          sectionId: section.id,
          classSubjectId: cs.id,
        },
      });
    }

    await audit(tx, {
      actorId,
      action: "SECTION_CREATED",
      entityType: "Section",
      entityId: section.id,
      summary: `Created section ${section.name} in class ${cls.name}`,
    });

    return section;
  });
}

export interface CreateSubjectInput {
  code: string;
  name: string;
  description?: string | null;
}

export async function createSubject(db: Db, input: CreateSubjectInput, actorId?: string) {
  const code = input.code.trim().toUpperCase();
  const existing = await db.subject.findUnique({ where: { code } });
  if (existing) throw conflict(`Subject with code "${code}" already exists`);

  const subject = await db.subject.create({
    data: {
      code,
      name: input.name.trim(),
      description: input.description?.trim() || null,
    },
  });

  await audit(db, {
    actorId,
    action: "SUBJECT_CREATED",
    entityType: "Subject",
    entityId: subject.id,
    summary: `Created subject ${subject.name} (${subject.code})`,
  });

  return subject;
}

export interface AddClassSubjectInput {
  classId: string;
  subjectId: string;
  type: SubjectType;
  streamId?: string | null;
  electiveGroupId?: string | null;
  periodsPerWeek?: number;
}

export async function addClassSubject(db: Db, input: AddClassSubjectInput, actorId?: string) {
  return await transact(async (tx) => {
    const cls = await tx.schoolClass.findUnique({
      where: { id: input.classId },
      include: { sections: true },
    });
    if (!cls) throw notFound("Class");

    const subject = await tx.subject.findUnique({ where: { id: input.subjectId } });
    if (!subject) throw notFound("Subject");

    if (input.type === "CORE" && (input.streamId || input.electiveGroupId)) {
      throw badRequest("Core subject cannot have stream or elective group");
    }
    if (input.type === "STREAM" && (!input.streamId || input.electiveGroupId)) {
      throw badRequest("Stream subject requires a streamId and cannot have an elective group");
    }
    if (input.type === "ELECTIVE" && !input.electiveGroupId) {
      throw badRequest("Elective subject requires an electiveGroupId");
    }

    const classSubject = await tx.classSubject.create({
      data: {
        classId: input.classId,
        subjectId: input.subjectId,
        type: input.type,
        streamId: input.streamId || null,
        electiveGroupId: input.electiveGroupId || null,
        periodsPerWeek: input.periodsPerWeek || 0,
      },
    });

    // Create SectionSubject offering for all existing sections
    for (const sec of cls.sections) {
      await tx.sectionSubject.upsert({
        where: {
          sectionId_classSubjectId: {
            sectionId: sec.id,
            classSubjectId: classSubject.id,
          },
        },
        create: {
          sectionId: sec.id,
          classSubjectId: classSubject.id,
        },
        update: {},
      });
    }

    await audit(tx, {
      actorId,
      action: "CLASS_SUBJECT_ADDED",
      entityType: "ClassSubject",
      entityId: classSubject.id,
      summary: `Added ${subject.name} (${input.type}) to class ${cls.name}`,
    });

    return classSubject;
  });
}

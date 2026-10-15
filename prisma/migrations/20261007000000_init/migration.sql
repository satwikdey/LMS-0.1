-- CreateEnum
CREATE TYPE "AccountKind" AS ENUM ('STAFF', 'STUDENT');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProvisioningStatus" AS ENUM ('PENDING', 'PROVISIONED', 'FAILED');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('STAKEHOLDER', 'PRINCIPAL', 'TEACHER_INCHARGE', 'SECTION_HEAD', 'SUBJECT_TEACHER', 'ACCOUNTS', 'ADMISSIONS');

-- CreateEnum
CREATE TYPE "YearStatus" AS ENUM ('PLANNED', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('CORE', 'STREAM', 'ELECTIVE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('PENDING_ACCOUNT', 'ACTIVE', 'WITHDRAWN', 'GRADUATED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING_ACCOUNT', 'ACTIVE', 'PROMOTED', 'RETAINED', 'GRADUATED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'FOLLOW_UP', 'APPLIED', 'ENROLLED', 'LOST');

-- CreateEnum
CREATE TYPE "EnquirySource" AS ENUM ('WEBSITE', 'WALK_IN', 'PHONE', 'REFERRAL', 'SOCIAL_MEDIA', 'ADVERTISEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "LostReason" AS ENUM ('FEES', 'DISTANCE', 'ADMITTED_ELSEWHERE', 'NO_RESPONSE', 'CURRICULUM', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'CLEARED', 'ENROLLING', 'ENROLLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('MONTHLY', 'TERM', 'ANNUAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'CARD', 'CHEQUE', 'BANK_TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('ACTIVE', 'VOIDED');

-- CreateEnum
CREATE TYPE "ConcessionType" AS ENUM ('SCHOLARSHIP', 'DISCOUNT');

-- CreateEnum
CREATE TYPE "ConcessionMode" AS ENUM ('FIXED', 'PERCENT');

-- CreateEnum
CREATE TYPE "ConcessionStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'REVERSED');

-- CreateEnum
CREATE TYPE "LineType" AS ENUM ('EARNING', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'FINALIZED', 'PAID');

-- CreateEnum
CREATE TYPE "CourseworkKind" AS ENUM ('HOMEWORK', 'ASSIGNMENT');

-- CreateEnum
CREATE TYPE "CourseworkStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED', 'LATE', 'MISSING', 'EXCUSED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('HOLIDAY', 'EXAM', 'EVENT', 'WORKING_DAY');

-- CreateEnum
CREATE TYPE "ExamScope" AS ENUM ('CLASS_WIDE', 'SUBJECT_TEST');

-- CreateEnum
CREATE TYPE "ExamCategory" AS ENUM ('HALF_YEARLY', 'ANNUAL', 'UNIT_TEST', 'OTHER');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'MARKS_OPEN', 'PUBLISHED', 'REOPENED');

-- CreateEnum
CREATE TYPE "MarkStatus" AS ENUM ('ENTERED', 'ABSENT', 'EXEMPT');

-- CreateEnum
CREATE TYPE "PromotionDecisionType" AS ENUM ('PROMOTE', 'RETAIN', 'GRADUATE');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CONFIRMED', 'RETURNED');

-- CreateEnum
CREATE TYPE "NoticeScope" AS ENUM ('PUBLIC', 'SCHOOL', 'CLASS', 'SECTION', 'SUBJECT');

-- CreateEnum
CREATE TYPE "NoticePriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('ACADEMIC_EXAM', 'ACADEMIC_ASSIGNMENT', 'FEE_DUE', 'NOTICE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationState" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL DEFAULT 'school',
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "tagline" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "affiliation" TEXT,
    "admissionPrefix" TEXT NOT NULL DEFAULT 'ADM',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "workingDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6]::INTEGER[],
    "classRangeFrom" INTEGER,
    "classRangeTo" INTEGER,
    "showPublicStats" BOOLEAN NOT NULL DEFAULT false,
    "siteContent" JSONB NOT NULL DEFAULT '{}',
    "themePrimary" TEXT,
    "themeAccent" TEXT,
    "setupCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT,
    "authEmail" TEXT NOT NULL,
    "registeredEmail" TEXT,
    "kind" "AccountKind" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "provisioning" "ProvisioningStatus" NOT NULL DEFAULT 'PENDING',
    "provisioningAttempts" INTEGER NOT NULL DEFAULT 0,
    "provisioningError" TEXT,
    "lastProvisionAttemptAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalCredential" (
    "authUserId" TEXT NOT NULL,
    "authEmail" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalCredential_pkey" PRIMARY KEY ("authUserId")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "accountId" TEXT NOT NULL,
    "employeeCode" TEXT,
    "designation" TEXT,
    "joinedOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "PositionAssignment" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "academicYearId" TEXT,
    "classId" TEXT,
    "sectionId" TEXT,
    "offeringId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "endReason" TEXT,
    "assignedBy" TEXT,
    "endedBy" TEXT,

    CONSTRAINT "PositionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "YearStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolClass" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "hasStreams" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "room" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stream" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Stream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectiveGroup" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "streamId" TEXT,
    "minSelect" INTEGER NOT NULL DEFAULT 1,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ElectiveGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSubject" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "type" "SubjectType" NOT NULL DEFAULT 'CORE',
    "streamId" TEXT,
    "electiveGroupId" TEXT,
    "periodsPerWeek" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ClassSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectCombination" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "streamId" TEXT,

    CONSTRAINT "SubjectCombination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectCombinationItem" (
    "combinationId" TEXT NOT NULL,
    "classSubjectId" TEXT NOT NULL,

    CONSTRAINT "SubjectCombinationItem_pkey" PRIMARY KEY ("combinationId","classSubjectId")
);

-- CreateTable
CREATE TABLE "SectionSubject" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "classSubjectId" TEXT NOT NULL,

    CONSTRAINT "SectionSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "admissionNumber" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATE,
    "gender" "Gender",
    "bloodGroup" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "previousSchool" TEXT,
    "previousClass" TEXT,
    "transferCertificateNo" TEXT,
    "joinedOn" DATE,
    "status" "StudentStatus" NOT NULL DEFAULT 'PENDING_ACCOUNT',
    "applicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "applicationId" TEXT,
    "name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "occupation" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "rollNumber" INTEGER,
    "streamId" TEXT,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING_ACCOUNT',
    "startedOn" DATE NOT NULL,
    "endedOn" DATE,
    "subjectsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentSubject" (
    "enrollmentId" TEXT NOT NULL,
    "classSubjectId" TEXT NOT NULL,

    CONSTRAINT "EnrollmentSubject_pkey" PRIMARY KEY ("enrollmentId","classSubjectId")
);

-- CreateTable
CREATE TABLE "SectionPlacement" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "rollNumber" INTEGER,
    "fromDate" DATE NOT NULL,
    "toDate" DATE,
    "reason" TEXT,

    CONSTRAINT "SectionPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "academicYearId" TEXT,
    "classId" TEXT,
    "source" "EnquirySource" NOT NULL DEFAULT 'WEBSITE',
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "message" TEXT,
    "lostReason" "LostReason",
    "lostNote" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "dueOn" DATE NOT NULL,
    "note" TEXT NOT NULL,
    "outcome" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "enquiryId" TEXT,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "streamId" TEXT,
    "studentFirstName" TEXT NOT NULL,
    "studentLastName" TEXT NOT NULL,
    "dateOfBirth" DATE,
    "gender" "Gender",
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "previousSchool" TEXT,
    "previousClass" TEXT,
    "transferCertificateNo" TEXT,
    "source" "EnquirySource" NOT NULL DEFAULT 'WALK_IN',
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "feePlanId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "clearedAt" TIMESTAMP(3),
    "clearedBy" TEXT,
    "enrolledAt" TIMESTAMP(3),
    "enrollmentError" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationSubject" (
    "applicationId" TEXT NOT NULL,
    "classSubjectId" TEXT NOT NULL,

    CONSTRAINT "ApplicationSubject_pkey" PRIMARY KEY ("applicationId","classSubjectId")
);

-- CreateTable
CREATE TABLE "FeeHead" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FeeHead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePlan" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePlanItem" (
    "id" TEXT NOT NULL,
    "feePlanId" TEXT NOT NULL,
    "feeHeadId" TEXT NOT NULL,
    "scheduleType" "ScheduleType" NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "FeePlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePlanInstallment" (
    "id" TEXT NOT NULL,
    "feePlanItemId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "dueDate" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "mandatoryForAdmission" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FeePlanInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeAccount" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "applicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeCharge" (
    "id" TEXT NOT NULL,
    "feeAccountId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "feePlanInstallmentId" TEXT,
    "feeHeadId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "dueDate" DATE NOT NULL,
    "mandatoryForAdmission" BOOLEAN NOT NULL DEFAULT false,
    "status" "ChargeStatus" NOT NULL DEFAULT 'ACTIVE',
    "voidReason" TEXT,
    "voidedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concession" (
    "id" TEXT NOT NULL,
    "feeAccountId" TEXT NOT NULL,
    "type" "ConcessionType" NOT NULL,
    "mode" "ConcessionMode" NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "scopeFeeHeadId" TEXT,
    "scopeChargeId" TEXT,
    "amount" DECIMAL(14,2),
    "reason" TEXT NOT NULL,
    "status" "ConcessionStatus" NOT NULL DEFAULT 'PROPOSED',
    "proposedBy" TEXT NOT NULL,
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,

    CONSTRAINT "Concession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConcessionAllocation" (
    "id" TEXT NOT NULL,
    "concessionId" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "ConcessionAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "feeAccountId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "receivedOn" DATE NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "payerName" TEXT,
    "notes" TEXT,
    "status" "EntryStatus" NOT NULL DEFAULT 'POSTED',
    "recordedBy" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedAt" TIMESTAMP(3),
    "reversedBy" TEXT,
    "reversalReason" TEXT,
    "replacesPaymentId" TEXT,
    "idempotencyKey" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "refundNumber" TEXT NOT NULL,
    "feeAccountId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "fromCredit" DECIMAL(14,2) NOT NULL,
    "refundedOn" DATE NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "reason" TEXT NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'POSTED',
    "recordedBy" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedAt" TIMESTAMP(3),
    "reversedBy" TEXT,
    "reversalReason" TEXT,
    "idempotencyKey" TEXT,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundAllocation" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "RefundAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "spentOn" DATE NOT NULL,
    "paidTo" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "status" "EntryStatus" NOT NULL DEFAULT 'POSTED',
    "recordedBy" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedAt" TIMESTAMP(3),
    "reversedBy" TEXT,
    "reversalReason" TEXT,
    "replacesExpenseId" TEXT,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryComponent" (
    "id" TEXT NOT NULL,
    "staffAccountId" TEXT NOT NULL,
    "type" "LineType" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "isStatutory" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRecord" (
    "id" TEXT NOT NULL,
    "staffAccountId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "gross" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "net" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "finalizedAt" TIMESTAMP(3),
    "finalizedBy" TEXT,
    "paidOn" DATE,
    "paymentMethod" "PaymentMethod",
    "paymentReference" TEXT,
    "paidBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollLine" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "type" "LineType" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "isStatutory" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'COMPONENT',

    CONSTRAINT "PayrollLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coursework" (
    "id" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "kind" "CourseworkKind" NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "assignedOn" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "maxMarks" DECIMAL(7,2),
    "status" "CourseworkStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coursework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseworkSubmission" (
    "id" TEXT NOT NULL,
    "courseworkId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL,
    "marks" DECIMAL(7,2),
    "feedback" TEXT,
    "recordedBy" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseworkSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "scope" "NoticeScope" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" "NoticePriority" NOT NULL DEFAULT 'NORMAL',
    "classId" TEXT,
    "sectionId" TEXT,
    "offeringId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "state" "NotificationState" NOT NULL DEFAULT 'OPEN',
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "payload" JSONB,
    "readAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetablePeriod" (
    "id" TEXT NOT NULL,
    "periodNo" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isBreak" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TimetablePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableSlot" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "offeringId" TEXT NOT NULL,

    CONSTRAINT "TimetableSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "type" "CalendarEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "description" TEXT,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSheet" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceCorrection" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "oldStatus" "AttendanceStatus" NOT NULL,
    "newStatus" "AttendanceStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "correctedBy" TEXT NOT NULL,
    "correctedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "scope" "ExamScope" NOT NULL,
    "category" "ExamCategory" NOT NULL DEFAULT 'OTHER',
    "name" TEXT NOT NULL,
    "sectionId" TEXT,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" DATE,
    "endDate" DATE,
    "currentVersion" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamPaper" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "classSubjectId" TEXT NOT NULL,
    "maxMarks" DECIMAL(7,2) NOT NULL,
    "passMarks" DECIMAL(7,2) NOT NULL,
    "examDate" DATE,

    CONSTRAINT "ExamPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamMark" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "status" "MarkStatus" NOT NULL,
    "marks" DECIMAL(7,2),
    "enteredBy" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportCard" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "totalMarks" DECIMAL(9,2) NOT NULL,
    "maxMarks" DECIMAL(9,2) NOT NULL,
    "percentage" DECIMAL(6,2) NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedBy" TEXT NOT NULL,

    CONSTRAINT "ReportCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportCardLine" (
    "id" TEXT NOT NULL,
    "reportCardId" TEXT NOT NULL,
    "classSubjectId" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "status" "MarkStatus" NOT NULL,
    "marks" DECIMAL(7,2),
    "maxMarks" DECIMAL(7,2) NOT NULL,
    "passMarks" DECIMAL(7,2) NOT NULL,
    "passed" BOOLEAN NOT NULL,

    CONSTRAINT "ReportCardLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamPublicationLog" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "reason" TEXT,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamPublicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionDecision" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "decision" "PromotionDecisionType" NOT NULL,
    "toClassId" TEXT,
    "toSectionId" TEXT,
    "remarks" TEXT,
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "preparedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "returnNote" TEXT,
    "resultingEnrollmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertSettings" (
    "id" TEXT NOT NULL DEFAULT 'alerts',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "examAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "assignmentCompletionTarget" DECIMAL(5,2) NOT NULL DEFAULT 70,
    "reviewPeriodDays" INTEGER NOT NULL DEFAULT 30,
    "minEligibleRecords" INTEGER NOT NULL DEFAULT 3,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "data" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sequence" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_authUserId_key" ON "Account"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_authEmail_key" ON "Account"("authEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Account_registeredEmail_key" ON "Account"("registeredEmail");

-- CreateIndex
CREATE UNIQUE INDEX "LocalCredential_authEmail_key" ON "LocalCredential"("authEmail");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_employeeCode_key" ON "StaffProfile"("employeeCode");

-- CreateIndex
CREATE INDEX "PositionAssignment_accountId_endedAt_idx" ON "PositionAssignment"("accountId", "endedAt");

-- CreateIndex
CREATE INDEX "PositionAssignment_classId_position_idx" ON "PositionAssignment"("classId", "position");

-- CreateIndex
CREATE INDEX "PositionAssignment_sectionId_position_idx" ON "PositionAssignment"("sectionId", "position");

-- CreateIndex
CREATE INDEX "PositionAssignment_offeringId_position_idx" ON "PositionAssignment"("offeringId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_name_key" ON "AcademicYear"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolClass_academicYearId_name_key" ON "SchoolClass"("academicYearId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolClass_academicYearId_level_key" ON "SchoolClass"("academicYearId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "Section_classId_name_key" ON "Section"("classId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Stream_code_key" ON "Stream"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Stream_name_key" ON "Stream"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ElectiveGroup_classId_name_key" ON "ElectiveGroup"("classId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSubject_classId_subjectId_key" ON "ClassSubject"("classId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectCombination_classId_name_key" ON "SubjectCombination"("classId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SectionSubject_sectionId_classSubjectId_key" ON "SectionSubject"("sectionId", "classSubjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_admissionNumber_key" ON "Student"("admissionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Student_accountId_key" ON "Student"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_applicationId_key" ON "Student"("applicationId");

-- CreateIndex
CREATE INDEX "Guardian_studentId_idx" ON "Guardian"("studentId");

-- CreateIndex
CREATE INDEX "Guardian_applicationId_idx" ON "Guardian"("applicationId");

-- CreateIndex
CREATE INDEX "Enrollment_classId_status_idx" ON "Enrollment"("classId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_academicYearId_key" ON "Enrollment"("studentId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_sectionId_rollNumber_key" ON "Enrollment"("sectionId", "rollNumber");

-- CreateIndex
CREATE INDEX "SectionPlacement_enrollmentId_idx" ON "SectionPlacement"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Enquiry_number_key" ON "Enquiry"("number");

-- CreateIndex
CREATE INDEX "Enquiry_createdAt_idx" ON "Enquiry"("createdAt");

-- CreateIndex
CREATE INDEX "Enquiry_status_idx" ON "Enquiry"("status");

-- CreateIndex
CREATE INDEX "FollowUp_enquiryId_idx" ON "FollowUp"("enquiryId");

-- CreateIndex
CREATE INDEX "FollowUp_dueOn_completedAt_idx" ON "FollowUp"("dueOn", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Application_number_key" ON "Application"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Application_enquiryId_key" ON "Application"("enquiryId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FeeHead_code_key" ON "FeeHead"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FeeHead_name_key" ON "FeeHead"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FeePlan_classId_name_key" ON "FeePlan"("classId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FeePlanItem_feePlanId_feeHeadId_key" ON "FeePlanItem"("feePlanId", "feeHeadId");

-- CreateIndex
CREATE UNIQUE INDEX "FeePlanInstallment_feePlanItemId_sequence_key" ON "FeePlanInstallment"("feePlanItemId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "FeeAccount_studentId_key" ON "FeeAccount"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeAccount_applicationId_key" ON "FeeAccount"("applicationId");

-- CreateIndex
CREATE INDEX "FeeCharge_feeAccountId_status_idx" ON "FeeCharge"("feeAccountId", "status");

-- CreateIndex
CREATE INDEX "FeeCharge_dueDate_status_idx" ON "FeeCharge"("dueDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FeeCharge_feeAccountId_feePlanInstallmentId_key" ON "FeeCharge"("feeAccountId", "feePlanInstallmentId");

-- CreateIndex
CREATE INDEX "Concession_status_idx" ON "Concession"("status");

-- CreateIndex
CREATE INDEX "ConcessionAllocation_chargeId_idx" ON "ConcessionAllocation"("chargeId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON "Payment"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_feeAccountId_status_idx" ON "Payment"("feeAccountId", "status");

-- CreateIndex
CREATE INDEX "Payment_receivedOn_idx" ON "Payment"("receivedOn");

-- CreateIndex
CREATE INDEX "PaymentAllocation_paymentId_idx" ON "PaymentAllocation"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_chargeId_idx" ON "PaymentAllocation"("chargeId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_refundNumber_key" ON "Refund"("refundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_idempotencyKey_key" ON "Refund"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Refund_feeAccountId_status_idx" ON "Refund"("feeAccountId", "status");

-- CreateIndex
CREATE INDEX "RefundAllocation_chargeId_idx" ON "RefundAllocation"("chargeId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- CreateIndex
CREATE INDEX "Expense_spentOn_status_idx" ON "Expense"("spentOn", "status");

-- CreateIndex
CREATE INDEX "SalaryComponent_staffAccountId_effectiveFrom_idx" ON "SalaryComponent"("staffAccountId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "PayrollRecord_year_month_idx" ON "PayrollRecord"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRecord_staffAccountId_year_month_key" ON "PayrollRecord"("staffAccountId", "year", "month");

-- CreateIndex
CREATE INDEX "PayrollLine_recordId_idx" ON "PayrollLine"("recordId");

-- CreateIndex
CREATE INDEX "Coursework_offeringId_kind_dueDate_idx" ON "Coursework"("offeringId", "kind", "dueDate");

-- CreateIndex
CREATE INDEX "CourseworkSubmission_enrollmentId_idx" ON "CourseworkSubmission"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseworkSubmission_courseworkId_enrollmentId_key" ON "CourseworkSubmission"("courseworkId", "enrollmentId");

-- CreateIndex
CREATE INDEX "Notice_scope_publishedAt_idx" ON "Notice"("scope", "publishedAt");

-- CreateIndex
CREATE INDEX "Notification_recipientId_state_readAt_idx" ON "Notification"("recipientId", "state", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_recipientId_dedupeKey_key" ON "Notification"("recipientId", "dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "TimetablePeriod_periodNo_key" ON "TimetablePeriod"("periodNo");

-- CreateIndex
CREATE INDEX "TimetableSlot_offeringId_idx" ON "TimetableSlot"("offeringId");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableSlot_sectionId_weekday_periodId_offeringId_key" ON "TimetableSlot"("sectionId", "weekday", "periodId", "offeringId");

-- CreateIndex
CREATE INDEX "CalendarEvent_academicYearId_startDate_idx" ON "CalendarEvent"("academicYearId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSheet_sectionId_date_key" ON "AttendanceSheet"("sectionId", "date");

-- CreateIndex
CREATE INDEX "AttendanceRecord_enrollmentId_date_idx" ON "AttendanceRecord"("enrollmentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_sheetId_enrollmentId_key" ON "AttendanceRecord"("sheetId", "enrollmentId");

-- CreateIndex
CREATE INDEX "Exam_classId_category_publishedAt_idx" ON "Exam"("classId", "category", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExamPaper_examId_classSubjectId_key" ON "ExamPaper"("examId", "classSubjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamMark_paperId_enrollmentId_key" ON "ExamMark"("paperId", "enrollmentId");

-- CreateIndex
CREATE INDEX "ReportCard_examId_isCurrent_idx" ON "ReportCard"("examId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCard_examId_enrollmentId_version_key" ON "ReportCard"("examId", "enrollmentId", "version");

-- CreateIndex
CREATE INDEX "ReportCardLine_reportCardId_idx" ON "ReportCardLine"("reportCardId");

-- CreateIndex
CREATE INDEX "ExamPublicationLog_examId_idx" ON "ExamPublicationLog"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionDecision_enrollmentId_key" ON "PromotionDecision"("enrollmentId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_at_idx" ON "AuditLog"("at");

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionAssignment" ADD CONSTRAINT "PositionAssignment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionAssignment" ADD CONSTRAINT "PositionAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionAssignment" ADD CONSTRAINT "PositionAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionAssignment" ADD CONSTRAINT "PositionAssignment_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "SectionSubject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectiveGroup" ADD CONSTRAINT "ElectiveGroup_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectiveGroup" ADD CONSTRAINT "ElectiveGroup_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_electiveGroupId_fkey" FOREIGN KEY ("electiveGroupId") REFERENCES "ElectiveGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCombination" ADD CONSTRAINT "SubjectCombination_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCombination" ADD CONSTRAINT "SubjectCombination_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCombinationItem" ADD CONSTRAINT "SubjectCombinationItem_combinationId_fkey" FOREIGN KEY ("combinationId") REFERENCES "SubjectCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCombinationItem" ADD CONSTRAINT "SubjectCombinationItem_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionSubject" ADD CONSTRAINT "SectionSubject_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionSubject" ADD CONSTRAINT "SectionSubject_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentSubject" ADD CONSTRAINT "EnrollmentSubject_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentSubject" ADD CONSTRAINT "EnrollmentSubject_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionPlacement" ADD CONSTRAINT "SectionPlacement_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionPlacement" ADD CONSTRAINT "SectionPlacement_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_feePlanId_fkey" FOREIGN KEY ("feePlanId") REFERENCES "FeePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationSubject" ADD CONSTRAINT "ApplicationSubject_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationSubject" ADD CONSTRAINT "ApplicationSubject_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePlan" ADD CONSTRAINT "FeePlan_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePlan" ADD CONSTRAINT "FeePlan_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePlanItem" ADD CONSTRAINT "FeePlanItem_feePlanId_fkey" FOREIGN KEY ("feePlanId") REFERENCES "FeePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePlanItem" ADD CONSTRAINT "FeePlanItem_feeHeadId_fkey" FOREIGN KEY ("feeHeadId") REFERENCES "FeeHead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePlanInstallment" ADD CONSTRAINT "FeePlanInstallment_feePlanItemId_fkey" FOREIGN KEY ("feePlanItemId") REFERENCES "FeePlanItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAccount" ADD CONSTRAINT "FeeAccount_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAccount" ADD CONSTRAINT "FeeAccount_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeCharge" ADD CONSTRAINT "FeeCharge_feeAccountId_fkey" FOREIGN KEY ("feeAccountId") REFERENCES "FeeAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeCharge" ADD CONSTRAINT "FeeCharge_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeCharge" ADD CONSTRAINT "FeeCharge_feePlanInstallmentId_fkey" FOREIGN KEY ("feePlanInstallmentId") REFERENCES "FeePlanInstallment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeCharge" ADD CONSTRAINT "FeeCharge_feeHeadId_fkey" FOREIGN KEY ("feeHeadId") REFERENCES "FeeHead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Concession" ADD CONSTRAINT "Concession_feeAccountId_fkey" FOREIGN KEY ("feeAccountId") REFERENCES "FeeAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConcessionAllocation" ADD CONSTRAINT "ConcessionAllocation_concessionId_fkey" FOREIGN KEY ("concessionId") REFERENCES "Concession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConcessionAllocation" ADD CONSTRAINT "ConcessionAllocation_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "FeeCharge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_feeAccountId_fkey" FOREIGN KEY ("feeAccountId") REFERENCES "FeeAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "FeeCharge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_feeAccountId_fkey" FOREIGN KEY ("feeAccountId") REFERENCES "FeeAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundAllocation" ADD CONSTRAINT "RefundAllocation_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundAllocation" ADD CONSTRAINT "RefundAllocation_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "FeeCharge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryComponent" ADD CONSTRAINT "SalaryComponent_staffAccountId_fkey" FOREIGN KEY ("staffAccountId") REFERENCES "StaffProfile"("accountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRecord" ADD CONSTRAINT "PayrollRecord_staffAccountId_fkey" FOREIGN KEY ("staffAccountId") REFERENCES "StaffProfile"("accountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollLine" ADD CONSTRAINT "PayrollLine_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "PayrollRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coursework" ADD CONSTRAINT "Coursework_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "SectionSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseworkSubmission" ADD CONSTRAINT "CourseworkSubmission_courseworkId_fkey" FOREIGN KEY ("courseworkId") REFERENCES "Coursework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseworkSubmission" ADD CONSTRAINT "CourseworkSubmission_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "SectionSubject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "TimetablePeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "SectionSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSheet" ADD CONSTRAINT "AttendanceSheet_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "AttendanceSheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceCorrection" ADD CONSTRAINT "AttendanceCorrection_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "AttendanceRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamPaper" ADD CONSTRAINT "ExamPaper_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamPaper" ADD CONSTRAINT "ExamPaper_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamMark" ADD CONSTRAINT "ExamMark_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "ExamPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamMark" ADD CONSTRAINT "ExamMark_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCardLine" ADD CONSTRAINT "ReportCardLine_reportCardId_fkey" FOREIGN KEY ("reportCardId") REFERENCES "ReportCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCardLine" ADD CONSTRAINT "ReportCardLine_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionDecision" ADD CONSTRAINT "PromotionDecision_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Integrity layer: constraints Prisma cannot express (partial unique indexes, CHECKs, triggers).
-- Principle: the database refuses states the business rules forbid, even if application code is buggy.

-- ------------- Single-responsibility rules (active assignments only) -------------
CREATE UNIQUE INDEX "uq_active_incharge_per_class"
  ON "PositionAssignment" ("classId")
  WHERE "position" = 'TEACHER_INCHARGE' AND "endedAt" IS NULL;

CREATE UNIQUE INDEX "uq_active_head_per_section"
  ON "PositionAssignment" ("sectionId")
  WHERE "position" = 'SECTION_HEAD' AND "endedAt" IS NULL;

CREATE UNIQUE INDEX "uq_active_teacher_per_offering"
  ON "PositionAssignment" ("offeringId")
  WHERE "position" = 'SUBJECT_TEACHER' AND "endedAt" IS NULL;

CREATE UNIQUE INDEX "uq_active_schoolwide_position"
  ON "PositionAssignment" ("accountId", "position")
  WHERE "position" IN ('STAKEHOLDER', 'PRINCIPAL', 'ACCOUNTS', 'ADMISSIONS') AND "endedAt" IS NULL;

ALTER TABLE "PositionAssignment" ADD CONSTRAINT "ck_position_scope" CHECK (
     ("position" IN ('STAKEHOLDER', 'PRINCIPAL', 'ACCOUNTS', 'ADMISSIONS')
        AND "classId" IS NULL AND "sectionId" IS NULL AND "offeringId" IS NULL)
  OR ("position" = 'TEACHER_INCHARGE' AND "classId" IS NOT NULL AND "sectionId" IS NULL AND "offeringId" IS NULL)
  OR ("position" = 'SECTION_HEAD' AND "sectionId" IS NOT NULL AND "offeringId" IS NULL)
  OR ("position" = 'SUBJECT_TEACHER' AND "offeringId" IS NOT NULL)
);

CREATE FUNCTION fn_position_staff_only() RETURNS trigger AS $$
BEGIN
  IF (SELECT "kind" FROM "Account" WHERE "id" = NEW."accountId") <> 'STAFF' THEN
    RAISE EXCEPTION 'Only staff accounts can hold positions' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_position_staff_only BEFORE INSERT ON "PositionAssignment"
  FOR EACH ROW EXECUTE FUNCTION fn_position_staff_only();

-- ------------- Identity -------------
CREATE UNIQUE INDEX "uq_account_registered_email_lower"
  ON "Account" (lower("registeredEmail")) WHERE "registeredEmail" IS NOT NULL;
CREATE UNIQUE INDEX "uq_account_auth_email_lower" ON "Account" (lower("authEmail"));
ALTER TABLE "Student" ADD CONSTRAINT "ck_admission_number_upper" CHECK ("admissionNumber" = upper("admissionNumber"));

-- ------------- Academic structure -------------
CREATE UNIQUE INDEX "uq_one_active_academic_year" ON "AcademicYear" ((1)) WHERE "status" = 'ACTIVE';
ALTER TABLE "AcademicYear" ADD CONSTRAINT "ck_year_dates" CHECK ("endDate" > "startDate");
ALTER TABLE "Section" ADD CONSTRAINT "ck_section_capacity" CHECK ("capacity" > 0);
ALTER TABLE "Enrollment" ADD CONSTRAINT "ck_roll_positive" CHECK ("rollNumber" IS NULL OR "rollNumber" > 0);
ALTER TABLE "ElectiveGroup" ADD CONSTRAINT "ck_elective_bounds" CHECK ("minSelect" >= 0 AND "maxSelect" >= "minSelect");
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ck_class_subject_kind" CHECK (
     ("type" = 'CORE' AND "streamId" IS NULL AND "electiveGroupId" IS NULL)
  OR ("type" = 'STREAM' AND "streamId" IS NOT NULL AND "electiveGroupId" IS NULL)
  OR ("type" = 'ELECTIVE' AND "electiveGroupId" IS NOT NULL)
);
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "ck_weekday" CHECK ("weekday" BETWEEN 1 AND 7);
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "ck_event_dates" CHECK ("endDate" >= "startDate");
ALTER TABLE "AlertSettings" ADD CONSTRAINT "ck_alert_target" CHECK ("assignmentCompletionTarget" BETWEEN 0 AND 100 AND "reviewPeriodDays" > 0);

-- ------------- Money -------------
ALTER TABLE "FeeCharge" ADD CONSTRAINT "ck_charge_amount" CHECK ("amount" >= 0);
ALTER TABLE "FeePlanInstallment" ADD CONSTRAINT "ck_installment_amount" CHECK ("amount" >= 0);
ALTER TABLE "Payment" ADD CONSTRAINT "ck_payment_amount" CHECK ("amount" > 0);
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "ck_payment_alloc_amount" CHECK ("amount" > 0);
ALTER TABLE "Refund" ADD CONSTRAINT "ck_refund_amount" CHECK ("amount" > 0 AND "fromCredit" >= 0 AND "fromCredit" <= "amount");
ALTER TABLE "RefundAllocation" ADD CONSTRAINT "ck_refund_alloc_amount" CHECK ("amount" > 0);
ALTER TABLE "Concession" ADD CONSTRAINT "ck_concession_value" CHECK ("value" > 0 AND ("mode" <> 'PERCENT' OR "value" <= 100));
ALTER TABLE "ConcessionAllocation" ADD CONSTRAINT "ck_concession_alloc_amount" CHECK ("amount" > 0);
ALTER TABLE "Expense" ADD CONSTRAINT "ck_expense_amount" CHECK ("amount" > 0);
ALTER TABLE "SalaryComponent" ADD CONSTRAINT "ck_component_amount" CHECK ("amount" >= 0);
ALTER TABLE "PayrollRecord" ADD CONSTRAINT "ck_payroll_month" CHECK ("month" BETWEEN 1 AND 12);
ALTER TABLE "PayrollLine" ADD CONSTRAINT "ck_payroll_line_amount" CHECK ("amount" >= 0);

-- ------------- Marks -------------
ALTER TABLE "ExamPaper" ADD CONSTRAINT "ck_paper_marks" CHECK ("maxMarks" > 0 AND "passMarks" >= 0 AND "passMarks" <= "maxMarks");
ALTER TABLE "ExamMark" ADD CONSTRAINT "ck_mark_status_value" CHECK (
     ("status" = 'ENTERED' AND "marks" IS NOT NULL AND "marks" >= 0)
  OR ("status" IN ('ABSENT', 'EXEMPT') AND "marks" IS NULL)
);
ALTER TABLE "Exam" ADD CONSTRAINT "ck_exam_scope" CHECK (
     ("scope" = 'SUBJECT_TEST' AND "sectionId" IS NOT NULL)
  OR ("scope" = 'CLASS_WIDE' AND "sectionId" IS NULL)
);
ALTER TABLE "CourseworkSubmission" ADD CONSTRAINT "ck_submission_marks" CHECK ("marks" IS NULL OR "marks" >= 0);

-- ------------- Append-only ledger protection -------------
CREATE FUNCTION fn_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Rows in "%" are append-only; post a reversal or replacement instead', TG_TABLE_NAME
    USING ERRCODE = '23000';
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_delete_payment BEFORE DELETE ON "Payment" FOR EACH ROW EXECUTE FUNCTION fn_append_only();
CREATE TRIGGER trg_no_delete_payment_alloc BEFORE DELETE ON "PaymentAllocation" FOR EACH ROW EXECUTE FUNCTION fn_append_only();
CREATE TRIGGER trg_no_delete_refund BEFORE DELETE ON "Refund" FOR EACH ROW EXECUTE FUNCTION fn_append_only();
CREATE TRIGGER trg_no_delete_refund_alloc BEFORE DELETE ON "RefundAllocation" FOR EACH ROW EXECUTE FUNCTION fn_append_only();
CREATE TRIGGER trg_no_delete_concession BEFORE DELETE ON "Concession" FOR EACH ROW EXECUTE FUNCTION fn_append_only();
CREATE TRIGGER trg_no_delete_concession_alloc BEFORE DELETE ON "ConcessionAllocation" FOR EACH ROW EXECUTE FUNCTION fn_append_only();
CREATE TRIGGER trg_no_delete_charge BEFORE DELETE ON "FeeCharge" FOR EACH ROW EXECUTE FUNCTION fn_append_only();
CREATE TRIGGER trg_no_delete_expense BEFORE DELETE ON "Expense" FOR EACH ROW EXECUTE FUNCTION fn_append_only();
CREATE TRIGGER trg_no_delete_audit BEFORE DELETE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION fn_append_only();
CREATE TRIGGER trg_no_update_audit BEFORE UPDATE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION fn_append_only();
CREATE TRIGGER trg_no_update_payment_alloc BEFORE UPDATE ON "PaymentAllocation" FOR EACH ROW EXECUTE FUNCTION fn_append_only();
CREATE TRIGGER trg_no_update_refund_alloc BEFORE UPDATE ON "RefundAllocation" FOR EACH ROW EXECUTE FUNCTION fn_append_only();
CREATE TRIGGER trg_no_update_concession_alloc BEFORE UPDATE ON "ConcessionAllocation" FOR EACH ROW EXECUTE FUNCTION fn_append_only();
CREATE TRIGGER trg_no_delete_correction BEFORE DELETE ON "AttendanceCorrection" FOR EACH ROW EXECUTE FUNCTION fn_append_only();

-- Posted financial facts cannot be edited in place; only lifecycle fields may change.
CREATE FUNCTION fn_payment_immutable() RETURNS trigger AS $$
BEGIN
  IF NEW."amount" <> OLD."amount" OR NEW."feeAccountId" <> OLD."feeAccountId"
     OR NEW."receivedOn" <> OLD."receivedOn" OR NEW."receiptNumber" <> OLD."receiptNumber"
     OR NEW."method" <> OLD."method" THEN
    RAISE EXCEPTION 'Posted payment fields are immutable; reverse and replace instead' USING ERRCODE = '23000';
  END IF;
  IF OLD."status" = 'REVERSED' AND NEW."status" <> 'REVERSED' THEN
    RAISE EXCEPTION 'A reversed payment cannot be reinstated' USING ERRCODE = '23000';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_payment_immutable BEFORE UPDATE ON "Payment" FOR EACH ROW EXECUTE FUNCTION fn_payment_immutable();

CREATE FUNCTION fn_refund_immutable() RETURNS trigger AS $$
BEGIN
  IF NEW."amount" <> OLD."amount" OR NEW."feeAccountId" <> OLD."feeAccountId"
     OR NEW."paymentId" <> OLD."paymentId" OR NEW."fromCredit" <> OLD."fromCredit" THEN
    RAISE EXCEPTION 'Posted refund fields are immutable' USING ERRCODE = '23000';
  END IF;
  IF OLD."status" = 'REVERSED' AND NEW."status" <> 'REVERSED' THEN
    RAISE EXCEPTION 'A reversed refund cannot be reinstated' USING ERRCODE = '23000';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_refund_immutable BEFORE UPDATE ON "Refund" FOR EACH ROW EXECUTE FUNCTION fn_refund_immutable();

CREATE FUNCTION fn_expense_immutable() RETURNS trigger AS $$
BEGIN
  IF NEW."amount" <> OLD."amount" OR NEW."spentOn" <> OLD."spentOn" OR NEW."categoryId" <> OLD."categoryId"
     OR NEW."paidTo" <> OLD."paidTo" THEN
    RAISE EXCEPTION 'Posted expense fields are immutable; reverse and replace instead' USING ERRCODE = '23000';
  END IF;
  IF OLD."status" = 'REVERSED' AND NEW."status" <> 'REVERSED' THEN
    RAISE EXCEPTION 'A reversed expense cannot be reinstated' USING ERRCODE = '23000';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_expense_immutable BEFORE UPDATE ON "Expense" FOR EACH ROW EXECUTE FUNCTION fn_expense_immutable();

CREATE FUNCTION fn_charge_immutable() RETURNS trigger AS $$
BEGIN
  IF NEW."amount" <> OLD."amount" OR NEW."feeAccountId" <> OLD."feeAccountId" OR NEW."dueDate" <> OLD."dueDate" THEN
    RAISE EXCEPTION 'Posted charge amount/due date are immutable; void and re-issue instead' USING ERRCODE = '23000';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_charge_immutable BEFORE UPDATE ON "FeeCharge" FOR EACH ROW EXECUTE FUNCTION fn_charge_immutable();

-- Backstop against over-allocation, even under concurrent writers.
CREATE FUNCTION fn_check_payment_allocation() RETURNS trigger AS $$
DECLARE
  pay numeric; alloc_on_payment numeric; cap numeric; net_alloc numeric; refunded numeric; conc numeric;
BEGIN
  SELECT "amount" INTO pay FROM "Payment" WHERE "id" = NEW."paymentId";
  SELECT COALESCE(SUM("amount"), 0) INTO alloc_on_payment
    FROM "PaymentAllocation" WHERE "paymentId" = NEW."paymentId" AND "id" <> NEW."id";
  IF alloc_on_payment + NEW."amount" > pay THEN
    RAISE EXCEPTION 'Allocations exceed the payment amount' USING ERRCODE = '23514';
  END IF;

  SELECT "amount" INTO cap FROM "FeeCharge" WHERE "id" = NEW."chargeId";
  SELECT COALESCE(SUM(a."amount"), 0) INTO net_alloc
    FROM "PaymentAllocation" a JOIN "Payment" p ON p."id" = a."paymentId"
    WHERE a."chargeId" = NEW."chargeId" AND p."status" = 'POSTED' AND a."id" <> NEW."id";
  SELECT COALESCE(SUM(ra."amount"), 0) INTO refunded
    FROM "RefundAllocation" ra JOIN "Refund" r ON r."id" = ra."refundId"
    WHERE ra."chargeId" = NEW."chargeId" AND r."status" = 'POSTED';
  SELECT COALESCE(SUM(ca."amount"), 0) INTO conc
    FROM "ConcessionAllocation" ca JOIN "Concession" c ON c."id" = ca."concessionId"
    WHERE ca."chargeId" = NEW."chargeId" AND c."status" = 'APPROVED';
  IF (net_alloc - refunded) + NEW."amount" > cap - conc THEN
    RAISE EXCEPTION 'Payment allocation exceeds the charge balance' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_check_payment_allocation BEFORE INSERT ON "PaymentAllocation"
  FOR EACH ROW EXECUTE FUNCTION fn_check_payment_allocation();

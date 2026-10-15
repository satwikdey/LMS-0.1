import { prisma, transact, nextSequence, type Db, type Tx } from "@/lib/db";
import { audit } from "@/lib/audit";
import { badRequest, conflict, notFound, unprocessable } from "@/lib/errors";
import { D, round2, sum, splitAmount, ZERO, type Dec } from "@/lib/money";
import {
  ConcessionMode,
  ConcessionStatus,
  ConcessionType,
  EntryStatus,
  PaymentMethod,
  PayrollStatus,
  ScheduleType,
} from "@prisma/client";

// ───────────────────────── Balance & Ledger calculation ─────────────────────────

export interface LedgerSummary {
  feeAccountId: string;
  totalCharges: Dec;
  totalConcessions: Dec;
  totalPaid: Dec;
  totalRefunded: Dec;
  netPaid: Dec;
  outstandingBalance: Dec;
  advanceCredit: Dec;
  mandatoryChargesTotal: Dec;
  mandatoryChargesPaidOrCovered: Dec;
  isClearedForAdmission: boolean;
}

export async function calculateAccountLedger(db: Db, feeAccountId: string): Promise<LedgerSummary> {
  const feeAccount = await db.feeAccount.findUnique({
    where: { id: feeAccountId },
    include: {
      charges: {
        where: { status: "ACTIVE" },
        include: {
          concessionAllocations: {
            include: { concession: true },
          },
          paymentAllocations: {
            include: { payment: true },
          },
          refundAllocations: {
            include: { refund: true },
          },
        },
      },
      payments: {
        where: { status: "POSTED" },
        include: {
          allocations: true,
          refunds: { where: { status: "POSTED" } },
        },
      },
      refunds: {
        where: { status: "POSTED" },
      },
    },
  });

  if (!feeAccount) throw notFound("Fee Account");

  let totalCharges = ZERO;
  let totalConcessions = ZERO;
  let totalAllocatedPayment = ZERO;
  let totalAllocatedRefund = ZERO;
  let mandatoryTotal = ZERO;
  let mandatoryCovered = ZERO;

  for (const ch of feeAccount.charges) {
    const chargeAmt = D(ch.amount);
    totalCharges = totalCharges.plus(chargeAmt);

    // Sum active concessions
    const chargeConc = sum(
      ch.concessionAllocations
        .filter((ca) => ca.concession.status === "APPROVED")
        .map((ca) => ca.amount),
    );
    totalConcessions = totalConcessions.plus(chargeConc);

    // Sum active payments allocated to this charge
    const chargePaid = sum(
      ch.paymentAllocations
        .filter((pa) => pa.payment.status === "POSTED")
        .map((pa) => pa.amount),
    );
    totalAllocatedPayment = totalAllocatedPayment.plus(chargePaid);

    // Sum refunds allocated against this charge
    const chargeRef = sum(
      ch.refundAllocations
        .filter((ra) => ra.refund.status === "POSTED")
        .map((ra) => ra.amount),
    );
    totalAllocatedRefund = totalAllocatedRefund.plus(chargeRef);

    const netChargePaid = chargePaid.minus(chargeRef);

    if (ch.mandatoryForAdmission) {
      mandatoryTotal = mandatoryTotal.plus(chargeAmt);
      mandatoryCovered = mandatoryCovered.plus(chargeConc.plus(netChargePaid));
    }
  }

  // Total unallocated payments = payment amount minus allocations
  const totalPaid = sum(feeAccount.payments.map((p) => p.amount));
  const totalRefunded = sum(feeAccount.refunds.map((r) => r.amount));
  const netPaid = totalPaid.minus(totalRefunded);

  // Advance credit = Net Paid minus Net Allocated to charges
  const netAllocatedToCharges = totalAllocatedPayment.minus(totalAllocatedRefund);
  let advanceCredit = netPaid.minus(netAllocatedToCharges);
  if (advanceCredit.isNegative()) advanceCredit = ZERO;

  // Outstanding Balance = Total Charges - Total Approved Concessions - Net Allocated Payments
  // Note: If student has unallocated credit, net balance owing = Total Charges - Total Concessions - Net Paid
  const outstandingBalance = round2(
    totalCharges.minus(totalConcessions).minus(netAllocatedToCharges),
  );

  const isClearedForAdmission =
    mandatoryTotal.isZero() || mandatoryCovered.greaterThanOrEqualTo(mandatoryTotal);

  return {
    feeAccountId,
    totalCharges: round2(totalCharges),
    totalConcessions: round2(totalConcessions),
    totalPaid: round2(totalPaid),
    totalRefunded: round2(totalRefunded),
    netPaid: round2(netPaid),
    outstandingBalance: outstandingBalance.isNegative() ? ZERO : outstandingBalance,
    advanceCredit: round2(advanceCredit),
    mandatoryChargesTotal: round2(mandatoryTotal),
    mandatoryChargesPaidOrCovered: round2(mandatoryCovered),
    isClearedForAdmission,
  };
}

// ───────────────────────── Payment Recording ─────────────────────────

export interface RecordPaymentInput {
  feeAccountId: string;
  amount: Dec;
  receivedOn: Date;
  method: PaymentMethod;
  reference?: string | null;
  payerName?: string | null;
  notes?: string | null;
  idempotencyKey?: string | null;
  chargeAllocations?: { chargeId: string; amount: Dec }[];
}

export async function recordPayment(db: Db, input: RecordPaymentInput, actorId: string) {
  if (input.amount.lessThanOrEqualTo(ZERO)) throw badRequest("Payment amount must be greater than zero");

  return await transact(async (tx) => {
    if (input.idempotencyKey) {
      const existing = await tx.payment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { allocations: true },
      });
      if (existing) return existing;
    }

    const feeAccount = await tx.feeAccount.findUnique({
      where: { id: input.feeAccountId },
      include: {
        charges: {
          where: { status: "ACTIVE" },
          include: {
            concessionAllocations: { include: { concession: true } },
            paymentAllocations: { include: { payment: true } },
            refundAllocations: { include: { refund: true } },
          },
          orderBy: { dueDate: "asc" },
        },
      },
    });
    if (!feeAccount) throw notFound("Fee Account");

    const receiptSeq = await nextSequence(tx, "RECEIPT_NO");
    const receiptNumber = `REC-${new Date().getFullYear()}-${String(receiptSeq).padStart(6, "0")}`;

    // Compute allocations: either custom or auto-waterfall against active charges
    let remainingToAllocate = round2(input.amount);
    const allocationsToCreate: { chargeId: string; amount: Dec }[] = [];

    if (input.chargeAllocations && input.chargeAllocations.length > 0) {
      let customSum = ZERO;
      for (const ca of input.chargeAllocations) {
        customSum = customSum.plus(ca.amount);
        allocationsToCreate.push({ chargeId: ca.chargeId, amount: round2(ca.amount) });
      }
      if (customSum.greaterThan(input.amount)) {
        throw badRequest("Sum of allocations cannot exceed payment amount");
      }
    } else {
      // Auto-waterfall: allocate to earliest due charges first
      for (const ch of feeAccount.charges) {
        if (remainingToAllocate.isZero()) break;

        const chargeAmount = D(ch.amount);
        const approvedConc = sum(
          ch.concessionAllocations
            .filter((a) => a.concession.status === "APPROVED")
            .map((a) => a.amount),
        );
        const netPaidOnCharge = sum(
          ch.paymentAllocations
            .filter((a) => a.payment.status === "POSTED")
            .map((a) => a.amount),
        ).minus(
          sum(
            ch.refundAllocations
              .filter((a) => a.refund.status === "POSTED")
              .map((a) => a.amount),
          ),
        );

        const chargeDue = round2(chargeAmount.minus(approvedConc).minus(netPaidOnCharge));
        if (chargeDue.greaterThan(ZERO)) {
          const allocateAmount = remainingToAllocate.lessThan(chargeDue)
            ? remainingToAllocate
            : chargeDue;
          allocationsToCreate.push({ chargeId: ch.id, amount: allocateAmount });
          remainingToAllocate = remainingToAllocate.minus(allocateAmount);
        }
      }
    }

    const payment = await tx.payment.create({
      data: {
        receiptNumber,
        feeAccountId: input.feeAccountId,
        amount: round2(input.amount),
        receivedOn: input.receivedOn,
        method: input.method,
        reference: input.reference?.trim() || null,
        payerName: input.payerName?.trim() || null,
        notes: input.notes?.trim() || null,
        status: "POSTED",
        recordedBy: actorId,
        idempotencyKey: input.idempotencyKey || null,
        allocations: {
          create: allocationsToCreate.map((a) => ({
            chargeId: a.chargeId,
            amount: a.amount,
          })),
        },
      },
      include: { allocations: true },
    });

    await audit(tx, {
      actorId,
      action: "PAYMENT_RECORDED",
      entityType: "Payment",
      entityId: payment.id,
      summary: `Recorded payment of ₹${payment.amount} (${payment.method}) receipt ${payment.receiptNumber}`,
      data: { feeAccountId: input.feeAccountId, amount: payment.amount.toString() },
    });

    return payment;
  });
}

// ───────────────────────── Payment Reversal ─────────────────────────

export async function reversePayment(
  db: Db,
  paymentId: string,
  reason: string,
  actorId: string,
) {
  if (!reason.trim()) throw badRequest("Reversal reason is required");

  return await transact(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { refunds: { where: { status: "POSTED" } } },
    });
    if (!payment) throw notFound("Payment");
    if (payment.status === "REVERSED") throw badRequest("Payment is already reversed");
    if (payment.refunds.length > 0) {
      throw unprocessable("Cannot reverse a payment that has posted refunds. Reverse refunds first.");
    }

    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "REVERSED",
        reversedAt: new Date(),
        reversedBy: actorId,
        reversalReason: reason.trim(),
      },
    });

    await audit(tx, {
      actorId,
      action: "PAYMENT_REVERSED",
      entityType: "Payment",
      entityId: paymentId,
      summary: `Reversed payment receipt ${payment.receiptNumber} (₹${payment.amount}). Reason: ${reason}`,
    });

    return updated;
  });
}

// ───────────────────────── Concessions (Scholarships & Discounts) ─────────────────────────

export interface ProposeConcessionInput {
  feeAccountId: string;
  type: ConcessionType;
  mode: ConcessionMode;
  value: Dec;
  reason: string;
  scopeFeeHeadId?: string | null;
  scopeChargeId?: string | null;
}

export async function proposeConcession(db: Db, input: ProposeConcessionInput, actorId: string) {
  if (input.value.lessThanOrEqualTo(ZERO)) throw badRequest("Concession value must be greater than zero");
  if (input.mode === "PERCENT" && input.value.greaterThan(D(100))) {
    throw badRequest("Percentage concession cannot exceed 100%");
  }
  if (!input.reason.trim()) throw badRequest("Reason for concession proposal is required");

  return await transact(async (tx) => {
    const feeAccount = await tx.feeAccount.findUnique({
      where: { id: input.feeAccountId },
      include: {
        charges: {
          where: { status: "ACTIVE" },
        },
      },
    });
    if (!feeAccount) throw notFound("Fee Account");

    const concession = await tx.concession.create({
      data: {
        feeAccountId: input.feeAccountId,
        type: input.type,
        mode: input.mode,
        value: round2(input.value),
        reason: input.reason.trim(),
        scopeFeeHeadId: input.scopeFeeHeadId || null,
        scopeChargeId: input.scopeChargeId || null,
        status: "PROPOSED",
        proposedBy: actorId,
      },
    });

    await audit(tx, {
      actorId,
      action: "CONCESSION_PROPOSED",
      entityType: "Concession",
      entityId: concession.id,
      summary: `Proposed ${input.type} (${input.mode === "PERCENT" ? `${input.value}%` : `₹${input.value}`}) for account ${input.feeAccountId}`,
      data: input as any,
    });

    return concession;
  });
}

export async function decideConcession(
  db: Db,
  concessionId: string,
  decision: "APPROVED" | "REJECTED",
  note: string | undefined,
  actorId: string,
) {
  return await transact(async (tx) => {
    const concession = await tx.concession.findUnique({
      where: { id: concessionId },
      include: {
        feeAccount: {
          include: {
            charges: {
              where: { status: "ACTIVE" },
              include: {
                concessionAllocations: { include: { concession: true } },
              },
            },
          },
        },
      },
    });
    if (!concession) throw notFound("Concession");
    if (concession.status !== "PROPOSED") {
      throw badRequest(`Concession is already ${concession.status}`);
    }

    if (decision === "REJECTED") {
      const updated = await tx.concession.update({
        where: { id: concessionId },
        data: {
          status: "REJECTED",
          decidedBy: actorId,
          decidedAt: new Date(),
          decisionNote: note?.trim() || null,
        },
      });

      await audit(tx, {
        actorId,
        action: "CONCESSION_REJECTED",
        entityType: "Concession",
        entityId: concessionId,
        summary: `Rejected ${concession.type} concession proposal`,
        data: { note },
      });

      return updated;
    }

    // APPROVED: calculate actual rupee amount and create allocations to charges
    let totalApprovedAmount = ZERO;
    const allocationsToCreate: { chargeId: string; amount: Dec }[] = [];

    const applicableCharges = concession.feeAccount.charges.filter((ch) => {
      if (concession.scopeChargeId && ch.id !== concession.scopeChargeId) return false;
      if (concession.scopeFeeHeadId && ch.feeHeadId !== concession.scopeFeeHeadId) return false;
      return true;
    });

    if (applicableCharges.length === 0) {
      throw unprocessable("No applicable charges found for this concession");
    }

    // Prioritize mandatory admission charges, then earlier due dates
    applicableCharges.sort((a, b) => {
      if (a.mandatoryForAdmission !== b.mandatoryForAdmission) {
        return a.mandatoryForAdmission ? -1 : 1;
      }
      return a.dueDate.getTime() - b.dueDate.getTime();
    });

    if (concession.mode === "FIXED") {
      let remaining = round2(concession.value);
      for (const ch of applicableCharges) {
        if (remaining.isZero()) break;
        const currentConc = sum(
          ch.concessionAllocations
            .filter((ca) => ca.concession.status === "APPROVED")
            .map((ca) => ca.amount),
        );
        const maxEligible = round2(D(ch.amount).minus(currentConc));
        if (maxEligible.greaterThan(ZERO)) {
          const allocate = remaining.lessThan(maxEligible) ? remaining : maxEligible;
          allocationsToCreate.push({ chargeId: ch.id, amount: allocate });
          totalApprovedAmount = totalApprovedAmount.plus(allocate);
          remaining = remaining.minus(allocate);
        }
      }
    } else {
      // PERCENT: apply % to each applicable charge
      const rate = D(concession.value).dividedBy(100);
      for (const ch of applicableCharges) {
        const concAmount = round2(D(ch.amount).times(rate));
        if (concAmount.greaterThan(ZERO)) {
          allocationsToCreate.push({ chargeId: ch.id, amount: concAmount });
          totalApprovedAmount = totalApprovedAmount.plus(concAmount);
        }
      }
    }

    const updated = await tx.concession.update({
      where: { id: concessionId },
      data: {
        status: "APPROVED",
        amount: totalApprovedAmount,
        decidedBy: actorId,
        decidedAt: new Date(),
        decisionNote: note?.trim() || null,
        allocations: {
          create: allocationsToCreate.map((a) => ({
            chargeId: a.chargeId,
            amount: a.amount,
          })),
        },
      },
      include: { allocations: true },
    });

    await audit(tx, {
      actorId,
      action: "CONCESSION_APPROVED",
      entityType: "Concession",
      entityId: concessionId,
      summary: `Approved ${concession.type} for ₹${totalApprovedAmount}`,
      data: { note, amount: totalApprovedAmount.toString() },
    });

    return updated;
  });
}

// ───────────────────────── Expenses ─────────────────────────

export interface RecordExpenseInput {
  categoryId: string;
  amount: Dec;
  spentOn: Date;
  paidTo: string;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
}

export async function recordExpense(db: Db, input: RecordExpenseInput, actorId: string) {
  if (input.amount.lessThanOrEqualTo(ZERO)) throw badRequest("Expense amount must be greater than zero");

  return await transact(async (tx) => {
    const category = await tx.expenseCategory.findUnique({ where: { id: input.categoryId } });
    if (!category) throw notFound("Expense category");

    const expense = await tx.expense.create({
      data: {
        categoryId: input.categoryId,
        amount: round2(input.amount),
        spentOn: input.spentOn,
        paidTo: input.paidTo.trim(),
        method: input.method,
        reference: input.reference?.trim() || null,
        notes: input.notes?.trim() || null,
        status: "POSTED",
        recordedBy: actorId,
      },
      include: { category: true },
    });

    await audit(tx, {
      actorId,
      action: "EXPENSE_RECORDED",
      entityType: "Expense",
      entityId: expense.id,
      summary: `Recorded expense ₹${expense.amount} to ${expense.paidTo} under ${category.name}`,
    });

    return expense;
  });
}

export async function reverseExpense(db: Db, expenseId: string, reason: string, actorId: string) {
  if (!reason.trim()) throw badRequest("Reversal reason is required");

  return await transact(async (tx) => {
    const expense = await tx.expense.findUnique({ where: { id: expenseId } });
    if (!expense) throw notFound("Expense");
    if (expense.status === "REVERSED") throw badRequest("Expense is already reversed");

    const updated = await tx.expense.update({
      where: { id: expenseId },
      data: {
        status: "REVERSED",
        reversedAt: new Date(),
        reversedBy: actorId,
        reversalReason: reason.trim(),
      },
    });

    await audit(tx, {
      actorId,
      action: "EXPENSE_REVERSED",
      entityType: "Expense",
      entityId: expenseId,
      summary: `Reversed expense of ₹${expense.amount}. Reason: ${reason}`,
    });

    return updated;
  });
}

// ───────────────────────── Payroll ─────────────────────────

export async function calculateMonthlyPayroll(
  db: Db,
  year: number,
  month: number,
  actorId: string,
) {
  if (month < 1 || month > 12) throw badRequest("Month must be between 1 and 12");

  return await transact(async (tx) => {
    // Find all active staff profiles with their active salary components
    const periodDate = new Date(Date.UTC(year, month - 1, 1));

    const staffProfiles = await tx.staffProfile.findMany({
      include: {
        account: true,
        salaryComponents: {
          where: {
            effectiveFrom: { lte: periodDate },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: periodDate } }],
          },
        },
      },
    });

    const results = [];

    for (const profile of staffProfiles) {
      if (profile.account.status !== "ACTIVE") continue;

      let gross = ZERO;
      let deductions = ZERO;
      const lines = [];

      for (const comp of profile.salaryComponents) {
        const amt = round2(comp.amount);
        if (comp.type === "EARNING") {
          gross = gross.plus(amt);
        } else {
          deductions = deductions.plus(amt);
        }
        lines.push({
          type: comp.type,
          name: comp.name,
          amount: amt,
          isStatutory: comp.isStatutory,
          source: "COMPONENT",
        });
      }

      const net = round2(gross.minus(deductions));

      const record = await tx.payrollRecord.upsert({
        where: {
          staffAccountId_year_month: {
            staffAccountId: profile.accountId,
            year,
            month,
          },
        },
        create: {
          staffAccountId: profile.accountId,
          year,
          month,
          status: "DRAFT",
          gross: round2(gross),
          totalDeductions: round2(deductions),
          net: net.isNegative() ? ZERO : net,
          lines: {
            create: lines,
          },
        },
        update: {
          // Only update if still draft
          gross: round2(gross),
          totalDeductions: round2(deductions),
          net: net.isNegative() ? ZERO : net,
        },
        include: { lines: true },
      });

      results.push(record);
    }

    await audit(tx, {
      actorId,
      action: "PAYROLL_CALCULATED",
      entityType: "PayrollRecord",
      summary: `Calculated monthly payroll for ${year}-${month} (${results.length} staff records)`,
    });

    return results;
  });
}

export async function finalizePayroll(
  db: Db,
  recordId: string,
  actorId: string,
) {
  return await transact(async (tx) => {
    const record = await tx.payrollRecord.findUnique({ where: { id: recordId } });
    if (!record) throw notFound("Payroll record");
    if (record.status !== "DRAFT") throw badRequest(`Cannot finalize payroll in status ${record.status}`);

    const updated = await tx.payrollRecord.update({
      where: { id: recordId },
      data: {
        status: "FINALIZED",
        finalizedAt: new Date(),
        finalizedBy: actorId,
      },
    });

    await audit(tx, {
      actorId,
      action: "PAYROLL_FINALIZED",
      entityType: "PayrollRecord",
      entityId: recordId,
      summary: `Finalized payroll for staff ${record.staffAccountId} (${record.year}-${record.month}) Net: ₹${record.net}`,
    });

    return updated;
  });
}

export async function recordPayrollPayment(
  db: Db,
  recordId: string,
  paymentDetails: {
    paidOn: Date;
    method: PaymentMethod;
    reference?: string | null;
    notes?: string | null;
  },
  actorId: string,
) {
  return await transact(async (tx) => {
    const record = await tx.payrollRecord.findUnique({ where: { id: recordId } });
    if (!record) throw notFound("Payroll record");
    if (record.status === "PAID") throw badRequest("Payroll is already marked paid");
    if (record.status === "DRAFT") throw badRequest("Payroll must be finalized before recording payment");

    const updated = await tx.payrollRecord.update({
      where: { id: recordId },
      data: {
        status: "PAID",
        paidOn: paymentDetails.paidOn,
        paymentMethod: paymentDetails.method,
        paymentReference: paymentDetails.reference?.trim() || null,
        notes: paymentDetails.notes?.trim() || null,
        paidBy: actorId,
      },
    });

    await audit(tx, {
      actorId,
      action: "PAYROLL_PAID",
      entityType: "PayrollRecord",
      entityId: recordId,
      summary: `Paid salary of ₹${record.net} for ${record.year}-${record.month} (${paymentDetails.method})`,
    });

    return updated;
  });
}

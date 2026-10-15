import { z } from "zod";
import { parseDate } from "@/lib/dates";
import { D, round2, type Dec } from "@/lib/money";

export const uuid = z.string().uuid();
export const trimmed = (max = 200) => z.string().trim().min(1, "Required").max(max);
export const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254);

export const optionalEmail = z
  .union([email, z.literal("").transform(() => null), z.null(), z.undefined()])
  .transform((v) => v ?? null);

export const phone = z
  .string()
  .trim()
  .regex(/^[+]?[0-9][0-9\s-]{6,17}$/, "Enter a valid phone number");

/** ISO calendar date string → Date at 00:00Z. */
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .transform((s, ctx) => {
    try {
      return parseDate(s);
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid calendar date" });
      return z.NEVER;
    }
  });

export const optionalIsoDate = z
  .union([isoDate, z.literal("").transform(() => null), z.null(), z.undefined()])
  .transform((v) => v ?? null);

/** Positive/zero money. Accepts numbers or numeric strings, max 2 decimal places. */
function moneyBase(allowZero: boolean) {
  return z
    .union([z.string(), z.number()])
    .transform((v, ctx): Dec => {
      const s = String(v).trim();
      if (!/^\d+(\.\d{1,2})?$/.test(s)) {
        ctx.addIssue({ code: "custom", message: "Enter an amount with at most 2 decimal places" });
        return z.NEVER;
      }
      const d = round2(D(s));
      if (allowZero ? d.isNegative() : d.lessThanOrEqualTo(0)) {
        ctx.addIssue({ code: "custom", message: allowZero ? "Amount cannot be negative" : "Amount must be greater than zero" });
        return z.NEVER;
      }
      if (d.greaterThan("99999999999.99")) {
        ctx.addIssue({ code: "custom", message: "Amount too large" });
        return z.NEVER;
      }
      return d;
    });
}
export const moneyPositive = moneyBase(false);
export const moneyNonNegative = moneyBase(true);

/** Marks may have up to 2 decimals and are >= 0. */
export const marksValue = moneyBase(true);

export const idParam = z.object({ id: uuid });

export const paymentMethod = z.enum(["CASH", "UPI", "CARD", "CHEQUE", "BANK_TRANSFER", "OTHER"]);
export const gender = z.enum(["MALE", "FEMALE", "OTHER"]);

import { AccountAuditAction, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { getPasswordResetRedirect } from "@/lib/app-url";
import { recordAccountAudit } from "@/lib/account-audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    const actorRole = user?.user_metadata?.role as Role | undefined;
    if (error || !user || (actorRole !== Role.ADMIN && actorRole !== Role.RECEPTIONIST)) return new NextResponse("Unauthorized", { status: 401 });
    const body = await req.json().catch(() => ({}));
    const mode = body.mode === "temporary_password" ? "temporary_password" : "reset_link";
    const target = await db.user.findUnique({ where: { id: params.id }, select: { id: true, email: true, role: true, is_active: true } });
    if (!target) return new NextResponse("User not found", { status: 404 });

    if (mode === "temporary_password") {
      const password = typeof body.password === "string" ? body.password : "";
      if (password.length < 6) return new NextResponse("Temporary password must be at least 6 characters", { status: 400 });

      const { error: updateError } = await supabase.auth.admin.updateUserById(target.id, {
        password,
        email_confirm: true,
        ...(target.is_active ? { ban_duration: "none" } : {}),
      });
      if (updateError) return new NextResponse(updateError.message, { status: 502 });

      await recordAccountAudit({
        action: AccountAuditAction.PASSWORD_RESET_REQUESTED,
        userId: target.id,
        actorId: user.id,
        email: target.email,
        request: req,
        metadata: { role: target.role, mode },
      });
      return NextResponse.json({ success: true, mode });
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(target.email, { redirectTo: getPasswordResetRedirect(req) });
    if (resetError) return new NextResponse(resetError.message, { status: 502 });
    await recordAccountAudit({ action: AccountAuditAction.PASSWORD_RESET_REQUESTED, userId: target.id, actorId: user.id, email: target.email, request: req, metadata: { role: target.role, mode } });
    return NextResponse.json({ success: true, mode });
  } catch (error) {
    console.error("[ADMIN_RESET_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

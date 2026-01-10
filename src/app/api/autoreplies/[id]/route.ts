import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, canAccessSession } from "@/lib/api-auth";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rule = await prisma.autoReply.findUnique({
            where: { id },
            include: { session: true }
        });

        if (!rule) {
            return NextResponse.json({ error: "Rule not found" }, { status: 404 });
        }

        // Check if user can access the session this rule belongs to
        // uses session.sessionId (Active string ID) or session.id (CUID)
        // canAccessSession checks both.
        const canAccess = await canAccessSession(user.id, user.role, rule.session.sessionId);
        if (!canAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.autoReply.delete({ where: { id } });
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete auto reply error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

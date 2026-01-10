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

        const msg = await prisma.scheduledMessage.findUnique({
            where: { id },
            include: { session: true }
        });

        if (!msg) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        const canAccess = await canAccessSession(user.id, user.role, msg.session.sessionId);
        if (!canAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.scheduledMessage.delete({ where: { id } });
        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

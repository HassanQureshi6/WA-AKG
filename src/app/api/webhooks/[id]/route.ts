import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthenticatedUser(request);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = await params;

    try {
        const body = await request.json();
        const { name, url, secret, sessionId, events, isActive } = body;

        // Verify ownership
        const existing = await prisma.webhook.findFirst({
            where: { id, userId: user.id }
        });

        if (!existing) {
            return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
        }

        const webhook = await prisma.webhook.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(url !== undefined && { url }),
                ...(secret !== undefined && { secret }),
                ...(sessionId !== undefined && { sessionId }),
                ...(events !== undefined && { events }),
                ...(isActive !== undefined && { isActive })
            }
        });

        return NextResponse.json(webhook);
    } catch (error) {
        console.error("Update webhook error:", error);
        return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthenticatedUser(request);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = await params;

    try {
        // Verify ownership
        const existing = await prisma.webhook.findFirst({
            where: { id, userId: user.id }
        });

        if (!existing) {
            return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
        }

        await prisma.webhook.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete webhook error:", error);
        return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
    }
}

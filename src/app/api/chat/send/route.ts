import { NextResponse, NextRequest } from "next/server";
import { waManager } from "@/modules/whatsapp/manager";
import { getAuthenticatedUser, canAccessSession } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { sessionId, jid, message } = body;

        if (!sessionId || !jid || !message) {
            return NextResponse.json({ error: "sessionId, jid, and message are required" }, { status: 400 });
        }

        // Check if user can access this session
        const canAccess = await canAccessSession(user.id, user.role, sessionId);
        if (!canAccess) {
            return NextResponse.json({ error: "Forbidden - Cannot access this session" }, { status: 403 });
        }

        const instance = waManager.getInstance(sessionId);
        if (!instance) {
            return NextResponse.json({ error: "Session not found or disconnected" }, { status: 404 });
        }

        const socket = instance.socket;
        if (!socket) {
             return NextResponse.json({ error: "Socket not ready" }, { status: 503 });
        }

        // Send Message
        await socket.sendMessage(jid, message);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Send message error:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}

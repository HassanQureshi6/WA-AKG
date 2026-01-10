import { prisma } from "./prisma";
import crypto from "crypto";

// Event types that can trigger webhooks
export type WebhookEventType = 
    | "message.received"
    | "message.sent"
    | "message.status"
    | "connection.update"
    | "group.update"
    | "contact.update"
    | "status.update";

interface WebhookPayload {
    event: WebhookEventType;
    sessionId: string;
    timestamp: string;
    data: any;
}

/**
 * Dispatch webhook to all matching endpoints
 */
export async function dispatchWebhook(
    sessionId: string, 
    event: WebhookEventType, 
    data: any
) {
    try {
        // Get the session to find the userId
        const session = await prisma.session.findUnique({
            where: { sessionId },
            select: { id: true, userId: true }
        });

        if (!session) {
            console.warn(`Webhook dispatch: Session ${sessionId} not found`);
            return;
        }

        // Find all active webhooks for this user/session
        const webhooks = await prisma.webhook.findMany({
            where: {
                userId: session.userId,
                isActive: true,
                OR: [
                    { sessionId: null }, // Global webhooks
                    { sessionId: session.id } // Session-specific webhooks
                ]
            }
        });

        if (webhooks.length === 0) return;

        const payload: WebhookPayload = {
            event,
            sessionId,
            timestamp: new Date().toISOString(),
            data
        };

        // Dispatch to all matching webhooks
        for (const webhook of webhooks) {
            // Check if this webhook subscribes to this event
            const events = (webhook.events as string[]) || [];
            if (!events.includes(event) && !events.includes("*")) {
                continue;
            }

            // Send webhook in background
            sendWebhookRequest(webhook.url, payload, webhook.secret).catch(err => {
                console.error(`Webhook ${webhook.id} failed:`, err);
            });
        }
    } catch (error) {
        console.error("Webhook dispatch error:", error);
    }
}

/**
 * Send HTTP POST request to webhook endpoint
 */
async function sendWebhookRequest(url: string, payload: WebhookPayload, secret?: string | null) {
    const body = JSON.stringify(payload);
    
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "WA-AKG-Webhook/1.0"
    };

    // Add HMAC signature if secret is provided
    if (secret) {
        const signature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");
        headers["X-Webhook-Signature"] = `sha256=${signature}`;
    }

    const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
    }

    return response;
}

/**
 * Helper to dispatch message received event
 */
export function onMessageReceived(sessionId: string, message: any) {
    dispatchWebhook(sessionId, "message.received", {
        keyId: message.key?.id,
        remoteJid: message.key?.remoteJid,
        fromMe: message.key?.fromMe,
        pushName: message.pushName,
        content: message.message,
        timestamp: message.messageTimestamp
    });
}

/**
 * Helper to dispatch message sent event
 */
export function onMessageSent(sessionId: string, message: any) {
    dispatchWebhook(sessionId, "message.sent", {
        keyId: message.key?.id,
        remoteJid: message.key?.remoteJid,
        content: message.message,
        timestamp: new Date().toISOString()
    });
}

/**
 * Helper to dispatch connection update event
 */
export function onConnectionUpdate(sessionId: string, status: string, qr?: string) {
    dispatchWebhook(sessionId, "connection.update", {
        status,
        qr: qr ? "QR_GENERATED" : null // Don't send actual QR, just indicator
    });
}

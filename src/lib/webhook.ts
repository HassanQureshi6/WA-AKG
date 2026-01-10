import { prisma } from "./prisma";
import crypto from "crypto";
import { normalizeMessageContent } from "@whiskeysockets/baileys";

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
            data: normalizePayloadData(event, data) // Normalize data before sending
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
 * Normalize payload data to match API format and avoid Circular/BigInt errors
 */
function normalizePayloadData(event: WebhookEventType, data: any): any {
    if (event === "message.received" || event === "message.sent") {
        // If data is already simplified, return it
        if (data.type && data.content) return data;

        // If data is raw Baileys message (which we shouldn't be passing raw anymore, but just in case)
        // Ideally the caller (onMessageReceived) should have already simplified it.
        // But let's handle the specific fields passed by onMessageReceived below.
        return data; 
    }
    return data;
}

/**
 * JSON Replacer to handle BigInt
 */
function jsonReplacer(key: string, value: any) {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
}

/**
 * Send HTTP POST request to webhook endpoint
 */
async function sendWebhookRequest(url: string, payload: WebhookPayload, secret?: string | null) {
    // Use custom replacer for BigInt support
    const body = JSON.stringify(payload, jsonReplacer);
    
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
 * Normalizes message content to match API structure
 */
export function onMessageReceived(sessionId: string, message: any) {
    const normalized = extractMessageContent(message);
    
    dispatchWebhook(sessionId, "message.received", {
        keyId: message.key?.id,
        remoteJid: message.key?.remoteJid,
        fromMe: message.key?.fromMe || false,
        pushName: message.pushName,
        type: normalized.type,
        content: normalized.content,
        timestamp: message.messageTimestamp 
            ? Number(message.messageTimestamp) * 1000 
            : Date.now()
    });
}

/**
 * Helper to dispatch message sent event
 */
export function onMessageSent(sessionId: string, message: any) {
    const normalized = extractMessageContent(message);

    dispatchWebhook(sessionId, "message.sent", {
        keyId: message.key?.id,
        remoteJid: message.key?.remoteJid,
        fromMe: true,
        type: normalized.type,
        content: normalized.content,
        timestamp: Date.now() // Sent now
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

/**
 * Extract content and type from Baileys message
 */
function extractMessageContent(msg: any): { type: string, content: string } {
    const messageContent = normalizeMessageContent(msg.message);
    let text = "";
    let messageType = "TEXT";

    if (!messageContent) return { type: "UNKNOWN", content: "" };

    if (messageContent.conversation) {
        text = messageContent.conversation;
    } else if (messageContent.extendedTextMessage?.text) {
        text = messageContent.extendedTextMessage.text;
    } else if (messageContent.imageMessage) {
        messageType = "IMAGE";
        text = messageContent.imageMessage.caption || "";
    } else if (messageContent.videoMessage) {
        messageType = "VIDEO";
        text = messageContent.videoMessage.caption || "";
    } else if (messageContent.audioMessage) {
        messageType = "AUDIO";
    } else if (messageContent.documentMessage) {
        messageType = "DOCUMENT";
        text = messageContent.documentMessage.fileName || "";
    } else if (messageContent.stickerMessage) {
        messageType = "STICKER";
    } else if (messageContent.locationMessage) {
        messageType = "LOCATION";
        text = `${messageContent.locationMessage.degreesLatitude},${messageContent.locationMessage.degreesLongitude}`;
    } else if (messageContent.contactMessage) {
        messageType = "CONTACT";
        text = messageContent.contactMessage.displayName || "";
    }

    return { type: messageType, content: text };
}

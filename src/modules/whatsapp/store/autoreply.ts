import { prisma } from "@/lib/prisma";
import type { WASocket } from "@whiskeysockets/baileys";
import { normalizeMessageContent } from "@whiskeysockets/baileys";

export async function bindAutoReply(sock: WASocket, sessionId: string) {
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.key.remoteJid || msg.key.fromMe) continue;

            const content = normalizeMessageContent(msg.message);
            const text = content?.conversation || content?.extendedTextMessage?.text || "";

            if (!text) continue;

            try {
                // Fetch rules for this session
                // optimization: Cache rules in memory or fetch only on message
                // Match session by its 'sessionId' (string ID from Baileys)
                const rules = await prisma.autoReply.findMany({
                    where: { 
                        session: {
                            sessionId: sessionId
                        }
                    }
                });

                for (const rule of rules) {
                    let match = false;
                    const keyword = rule.keyword.toLowerCase();
                    const incoming = text.toLowerCase();

                    switch (rule.matchType) {
                        case 'EXACT':
                            match = incoming === keyword;
                            break;
                        case 'CONTAINS':
                            match = incoming.includes(keyword);
                            break;
                        case 'REGEX':
                            try {
                                const regex = new RegExp(rule.keyword, 'i');
                                match = regex.test(text); // Use original case for regex
                            } catch (e) {
                                console.error("Invalid regex in auto-reply", rule.keyword);
                            }
                            break;
                    }

                    if (match) {
                        console.log(`Auto-reply match: ${rule.keyword} -> ${msg.key.remoteJid}`);
                        
                        // Send response
                        // Check if media or text
                        if (rule.isMedia && rule.mediaUrl) {
                            // TODO: Implement media sending from URL
                            await sock.sendMessage(msg.key.remoteJid, { 
                                text: rule.response // Caption
                                // image: { url: rule.mediaUrl } // Need to determine type
                            });
                        } else {
                            await sock.sendMessage(msg.key.remoteJid, { text: rule.response });
                        }
                        
                        // Stop after first match? Or allow multiple? 
                        // Typically break after first overlap unless configured otherwise.
                        break; 
                    }
                }

            } catch (e) {
                console.error("Auto-reply error", e);
            }
        }
    });
}

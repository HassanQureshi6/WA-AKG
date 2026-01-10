import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import Sticker from "wa-sticker-formatter";
import { formatDistanceToNow } from "date-fns"; // We might need date-fns, or just manual calculation

// Map to track start times for uptime
const startTimes = new Map<string, number>();

export function setSessionStartTime(sessionId: string) {
    if (!startTimes.has(sessionId)) {
        startTimes.set(sessionId, Date.now());
    }
}

export async function handleBotCommand(
    sock: WASocket | undefined,
    sessionId: string,
    msg: WAMessage
) {
    if (!sock || !msg.message || !msg.key.remoteJid) return;

    const keyId = msg.key.id;
    const remoteJid = msg.key.remoteJid;
    const fromMe = msg.key.fromMe;
    
    // Ignore own messages (prevent loops)
    if (fromMe) return;

    // Get text content
    let text = "";
    const messageContent = msg.message;
    
    if (messageContent.conversation) {
        text = messageContent.conversation;
    } else if (messageContent.extendedTextMessage?.text) {
        text = messageContent.extendedTextMessage.text;
    } else if (messageContent.imageMessage?.caption) {
        text = messageContent.imageMessage.caption;
    } else if (messageContent.videoMessage?.caption) {
        text = messageContent.videoMessage.caption;
    }

    if (!text.startsWith("#")) return;

    const [command, ...args] = text.trim().split(" ");
    const cmd = command.toLowerCase().slice(1); // remove #

    try {
        switch (cmd) {
            case "ping": {
                const start = Date.now();
                // Send a reaction to calculate "send" time approx or just reply
                await sock.sendMessage(remoteJid, { text: "Pong! 🏓" }, { quoted: msg });
                break;
            }
            
            case "id": {
                await sock.sendMessage(remoteJid, { 
                    text: `*Chat ID:* \`${remoteJid}\`` 
                }, { quoted: msg });
                break;
            }

            case "uptime": {
                const start = startTimes.get(sessionId) || Date.now();
                const uptimeMs = Date.now() - start;
                const hours = Math.floor(uptimeMs / 3600000);
                const minutes = Math.floor((uptimeMs % 3600000) / 60000);
                const seconds = Math.floor((uptimeMs % 60000) / 1000);
                
                await sock.sendMessage(remoteJid, { 
                    text: `*Session Uptime:* ${hours}h ${minutes}m ${seconds}s` 
                }, { quoted: msg });
                break;
            }

            case "sticker": 
            case "s": 
            case "stiker": {
                // Check if message has image
                let mediaMsg: WAMessage | null = msg;
                
                // If quoted, check quoted
                const quoted = messageContent.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quoted) {
                    // Create a fake WAMessage for downloadMediaMessage
                    mediaMsg = {
                        key: {
                            remoteJid,
                            id: messageContent.extendedTextMessage?.contextInfo?.stanzaId,
                        },
                        message: quoted
                    } as WAMessage;
                }

                // Verify it is an image
                const isImage = !!mediaMsg.message?.imageMessage;
                
                if (!isImage) {
                    await sock.sendMessage(remoteJid, { text: "❌ Please reply to an image or send an image with caption #sticker" }, { quoted: msg });
                    return;
                }

                await sock.sendMessage(remoteJid, { react: { text: "⏳", key: msg.key } });

                try {
                    // Download
                    const buffer = await downloadMediaMessage(
                        mediaMsg,
                        "buffer",
                        {}
                    );

                    // Convert
                    const sticker = new Sticker(buffer as Buffer, {
                        pack: "WA-AKG Bot",
                        author: "By WA-AKG",
                        type: "full", // full, crop, circle
                        quality: 50
                    });

                    const stickerBuffer = await sticker.toBuffer();

                    // Send
                    await sock.sendMessage(remoteJid, { sticker: stickerBuffer }, { quoted: msg });
                    await sock.sendMessage(remoteJid, { react: { text: "✅", key: msg.key } });

                } catch (e) {
                    console.error("Sticker generation failed", e);
                    await sock.sendMessage(remoteJid, { text: "❌ Failed to create sticker. Error: " + (e as any).message }, { quoted: msg });
                }
                break;
            }
            
            case "menu":
            case "help": {
                 const menu = `
🤖 *WA-AKG Bot Menu* 🤖

📌 *Commands:*
• *#sticker* / *#s*: Convert Image to Sticker
• *#ping*: Check Bot Status
• *#uptime*: Check Session Uptime
• *#id*: Get Chat ID

_Made with ❤️_
`;
                 await sock.sendMessage(remoteJid, { text: menu }, { quoted: msg });
                 break;
            }

            default:
                // Ignore unknown commands
                break;
        }
    } catch (e) {
        console.error("Bot command error", e);
    }
}

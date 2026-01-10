# Ultimate WhatsApp Gateway - Complete API Documentation

Complete and detailed API reference for the WhatsApp Gateway & Management Dashboard.

**Base URL:** `http://your-server:3030`

---

## Authentication

All API endpoints require authentication. There are two methods:

### 1. API Key (Recommended for External Integrations)

Include your API key in the `X-API-Key` header:

```bash
curl http://your-server:3030/api/sessions \
  -H "X-API-Key: wag_your_api_key_here"
```

### 2. Session Cookie (Web UI)

For web dashboard users, include the NextAuth.js session cookie:

```bash
curl http://your-server:3030/api/sessions \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

---

## Role-Based Access Control

The system implements role-based permissions:

| Role | Permissions |
|------|-------------|
| `SUPERADMIN` | Full access to all resources, manage all users and sessions |
| `OWNER` | Manage own sessions only, cannot access other users' data |
| `STAFF` | Limited access, manage assigned sessions only |

**Key Rules:**
- Users can only create/edit/delete their **own** sessions
- Admins (`SUPERADMIN`) can access and manage **all** sessions
- All API requests are scoped to the authenticated user's permissions

---

## Table of Contents

1. [API Key Management](#api-key-management)
2. [Sessions](#sessions)
3. [Chat & Messages](#chat--messages)
4. [Groups](#groups)
5. [Broadcast](#broadcast)
6. [Sticker Maker](#sticker-maker)
7. [Spam/Bombing](#spambombing)
8. [WhatsApp Status](#whatsapp-status)
9. [Scheduler](#scheduler)
10. [Auto Reply](#auto-reply)
11. [Webhooks](#webhooks)
12. [WebSocket Events](#websocket-events)
13. [Error Codes](#error-codes)

---

## API Key Management

### GET `/api/user/api-key`

Get your current API key.

**Headers:**
- `X-API-Key` or Session Cookie

**Response (200):**
```json
{
  "apiKey": "wag_j10883AbCdEfGhIjKlMnOpQrStUvWxYz"
}
```

**Response (No Key):**
```json
{
  "apiKey": null
}
```

---

### POST `/api/user/api-key`

Generate a new API key. This invalidates any existing key.

**Response (200):**
```json
{
  "apiKey": "wag_NEW_GENERATED_API_KEY_HERE"
}
```

---

### DELETE `/api/user/api-key`

Revoke your API key.

**Response (200):**
```json
{
  "success": true
}
```

---

## Sessions

### GET `/api/sessions`

Fetch all WhatsApp sessions accessible to you.

- **Regular Users:** Returns only their own sessions
- **Admins:** Returns all sessions

**Response (200):**
```json
[
  {
    "id": "clxxx...",
    "userId": "clyyy...",
    "name": "My iPhone",
    "sessionId": "57xx1x",
    "status": "CONNECTED",
    "qr": null,
    "config": {
      "autoReplyEnabled": true,
      "ppGuardEnabled": false
    },
    "createdAt": "2026-01-09T10:00:00.000Z",
    "updatedAt": "2026-01-10T10:00:00.000Z"
  }
]
```

**Session Status Values:**
| Status | Description |
|--------|-------------|
| `DISCONNECTED` | Not connected, may need QR scan |
| `CONNECTING` | Currently connecting |
| `CONNECTED` | Active and ready |
| `ZOMBIE` | Connection lost, needs restart |

---

### POST `/api/sessions`

Create a new WhatsApp session for the authenticated user.

**Request Body:**
```json
{
  "name": "Marketing WA"
}
```

**Response (200):**
```json
{
  "id": "clxxx...",
  "sessionId": "abc123",
  "name": "Marketing WA",
  "status": "DISCONNECTED",
  "qr": null
}
```

---

### PATCH `/api/sessions/[id]/settings`

Update session configuration.

**URL Parameters:**
- `id`: The session ID string (e.g., "57xx1x")

**Access Control:** User must own the session OR be SUPERADMIN

**Request Body:**
```json
{
  "config": {
    "autoReplyEnabled": true,
    "ppGuardEnabled": true,
    "ppGuardFallbackUrl": "https://example.com/default-avatar.jpg",
    "readReceipts": true,
    "antiDelete": false,
    "ghostMode": false
  }
}
```

**Response (200):**
```json
{
  "id": "clxxx...",
  "sessionId": "57xx1x",
  "name": "My iPhone",
  "config": { ... }
}
```

---

### DELETE `/api/sessions/[id]/settings`

Delete a session.

**Access Control:** User must own the session OR be SUPERADMIN

**Response (200):**
```json
{
  "success": true
}
```

---

## Chat & Messages

### GET `/api/chat/[sessionId]`

Get all contacts/chats for a session.

**URL Parameters:**
- `sessionId`: WhatsApp session ID string (e.g., "57xx1x")

**Access Control:** User must have access to this session

**Response (200):**
```json
[
  {
    "jid": "6287748687946@s.whatsapp.net",
    "name": "Adit",
    "notify": "Adit",
    "profilePic": "https://...",
    "lastMessage": {
      "content": "Hello!",
      "timestamp": "2026-01-10T10:30:00.000Z",
      "type": "TEXT"
    }
  }
]
```

---

### GET `/api/chat/[sessionId]/[jid]`

Get messages for a specific chat.

**URL Parameters:**
- `sessionId`: WhatsApp session ID
- `jid`: Contact JID (URL encoded, e.g., `6287748687946%40s.whatsapp.net`)

**Access Control:** User must have access to this session

**Response (200):**
```json
[
  {
    "id": "clxxx...",
    "sessionId": "clyyy...",
    "remoteJid": "6287748687946@s.whatsapp.net",
    "senderJid": null,
    "fromMe": true,
    "keyId": "3EB0XXX...",
    "pushName": "User",
    "type": "TEXT",
    "content": "Hello World",
    "mediaUrl": null,
    "status": "DELIVERED",
    "timestamp": "2026-01-10T10:30:00.000Z",
    "quoteId": null
  }
]
```

**Message Types:**
| Type | Description |
|------|-------------|
| `TEXT` | Plain text message |
| `IMAGE` | Image with optional caption |
| `VIDEO` | Video with optional caption |
| `AUDIO` | Voice note or audio file |
| `DOCUMENT` | File attachment |
| `STICKER` | Sticker |
| `LOCATION` | GPS location |
| `CONTACT` | Contact card |

**Message Status:**
| Status | Description |
|--------|-------------|
| `PENDING` | Message sent, waiting confirmation |
| `SENT` | Sent to WhatsApp servers |
| `DELIVERED` | Delivered to recipient |
| `READ` | Read by recipient |
| `FAILED` | Failed to send |

---

### POST `/api/chat/send`

Send a message to a contact or group.

**Access Control:** User must have access to the specified session

**Request Body:**
```json
{
  "sessionId": "57xx1x",
  "jid": "6287748687946@s.whatsapp.net",
  "message": {
    "text": "Hello from API!"
  }
}
```

**Message Format Examples:**

**Text Message:**
```json
{
  "sessionId": "57xx1x",
  "jid": "6287748687946@s.whatsapp.net",
  "message": { "text": "Hello!" }
}
```

**Image Message:**
```json
{
  "sessionId": "57xx1x",
  "jid": "6287748687946@s.whatsapp.net",
  "message": {
    "image": { "url": "https://example.com/image.jpg" },
    "caption": "Check this out!"
  }
}
```

**Video Message:**
```json
{
  "sessionId": "57xx1x",
  "jid": "6287748687946@s.whatsapp.net",
  "message": {
    "video": { "url": "https://example.com/video.mp4" },
    "caption": "Watch this!"
  }
}
```

**Document:**
```json
{
  "sessionId": "57xx1x",
  "jid": "6287748687946@s.whatsapp.net",
  "message": {
    "document": { "url": "https://example.com/doc.pdf" },
    "mimetype": "application/pdf",
    "fileName": "document.pdf"
  }
}
```

**Response (200):**
```json
{
  "success": true
}
```

---

## Groups

### GET `/api/groups`

Get all groups from the first connected session.

**Access Control:** Based on user role

**Response (200):**
```json
[
  {
    "id": "clxxx...",
    "sessionId": "clyyy...",
    "jid": "120363014587327510@g.us",
    "subject": "AiKei Group",
    "description": "Official group",
    "ownerJid": "6287748687946@s.whatsapp.net",
    "participants": [
      { "id": "628XXX@s.whatsapp.net", "admin": "admin" },
      { "id": "628YYY@s.whatsapp.net", "admin": null }
    ],
    "creation": "2024-01-01T00:00:00.000Z",
    "restrict": false,
    "announce": false,
    "inviteCode": "ABC123"
  }
]
```

---

### POST `/api/groups/create`

Create a new WhatsApp group.

**Access Control:** User must have access to the specified session

**Request Body:**
```json
{
  "sessionId": "57xx1x",
  "subject": "New Group Name",
  "participants": [
    "6287748687946@s.whatsapp.net",
    "628123456789@s.whatsapp.net"
  ]
}
```

**Validation Rules:**
- `sessionId`: Required, non-empty string
- `subject`: Required, 1-100 characters
- `participants`: Array of JIDs ending with `@s.whatsapp.net`, minimum 1

**Response (200):**
```json
{
  "success": true,
  "group": {
    "id": "120363014587327510@g.us",
    "subject": "New Group Name"
  }
}
```

---

## Broadcast

### POST `/api/messages/broadcast`

Send messages to multiple recipients with automatic delays to avoid spam detection.

**Access Control:** User must have access to the specified session

**Request Body:**
```json
{
  "sessionId": "57xx1x",
  "recipients": [
    "6287748687946@s.whatsapp.net",
    "628123456789@s.whatsapp.net",
    "628555666777@s.whatsapp.net"
  ],
  "message": "Hello everyone! This is a broadcast message.",
  "delay": 5000
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | string | Yes | WhatsApp session ID |
| `recipients` | string[] | Yes | Array of JIDs (minimum 1) |
| `message` | string | Yes | Message text |
| `delay` | number | No | Base delay in ms (overridden by random 10-20s delay) |

**Behavior:**
- Messages are sent with **random 10-20 second delays** between each recipient
- Processing happens in the background - returns immediately
- Progress is logged to server console

**Response (200):**
```json
{
  "success": true,
  "message": "Broadcast started in background"
}
```

---

## Sticker Maker

### POST `/api/messages/sticker`

Convert an image to a WhatsApp sticker and send it.

**Content-Type:** `multipart/form-data`

**Access Control:** User must have access to the specified session

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | string | Yes | WhatsApp session ID |
| `jid` | string | Yes | Target contact/group JID |
| `file` | File | Yes | Image file (PNG, JPG, WEBP) |

**Example (cURL):**
```bash
curl -X POST http://your-server:3030/api/messages/sticker \
  -H "X-API-Key: wag_your_api_key" \
  -F "sessionId=57xx1x" \
  -F "jid=6287748687946@s.whatsapp.net" \
  -F "file=@/path/to/image.png"
```

**Response (200):**
```json
{
  "success": true
}
```

---

## Spam/Bombing

### POST `/api/messages/spam`

Send repeated messages to a contact. **Use responsibly!**

**Access Control:** User must have access to the specified session

**Request Body:**
```json
{
  "sessionId": "57xx1x",
  "jid": "6287748687946@s.whatsapp.net",
  "message": "Spam message content",
  "count": 10,
  "delay": 500
}
```

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `sessionId` | string | Yes | - | WhatsApp session ID |
| `jid` | string | Yes | - | Target JID |
| `message` | string | Yes | - | Message content |
| `count` | number | No | 10 | Number of messages |
| `delay` | number | No | 500 | Delay between messages (ms) |

**Response (200):**
```json
{
  "success": true,
  "message": "Bombing 10 messages started"
}
```

---

## WhatsApp Status

### POST `/api/status/update`

Post a WhatsApp status/story.

**Access Control:** User must have access to the specified session

**Text Status:**
```json
{
  "sessionId": "57xx1x",
  "content": "My text status!",
  "type": "TEXT",
  "backgroundColor": "0xff1e90ff",
  "font": 2
}
```

**Image Status:**
```json
{
  "sessionId": "57xx1x",
  "content": "Check this photo!",
  "type": "IMAGE",
  "mediaUrl": "https://example.com/image.jpg"
}
```

**Video Status:**
```json
{
  "sessionId": "57xx1x",
  "content": "Watch this!",
  "type": "VIDEO",
  "mediaUrl": "https://example.com/video.mp4"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | string | Yes | WhatsApp session ID |
| `content` | string | Yes | Text content or caption |
| `type` | string | No | `TEXT`, `IMAGE`, or `VIDEO` (default: `TEXT`) |
| `mediaUrl` | string | For media | URL to image/video |
| `backgroundColor` | string | No | Background color (hex ARGB) |
| `font` | number | No | Font style (0-5) |

**Response (200):**
```json
{
  "success": true
}
```

---


---

## Scheduler

### GET `/api/scheduler`

List all scheduled messages for a session.

**URL Parameters:**
- `sessionId`: Session ID string

**Response (200):**
```json
[
  {
    "id": "clxxx...",
    "jid": "6287748687946@s.whatsapp.net",
    "content": "Scheduled hello!",
    "mediaUrl": null,
    "sendAt": "2026-01-10T12:00:00.000Z",
    "status": "PENDING"
  }
]
```

### POST `/api/scheduler`

Schedule a message.

**Request Body:**
```json
{
  "sessionId": "57xx1x",
  "jid": "6287748687946@s.whatsapp.net",
  "content": "Project update",
  "sendAt": "2026-01-15T09:00:00"
}
```

### DELETE `/api/scheduler/[id]`

Cancel a scheduled message.

**Response (200):**
```json
{ "success": true }
```

---

## Auto Reply

### GET `/api/autoreplies`

List all auto-reply rules.

**URL Parameters:**
- `sessionId`: Session ID string

**Response (200):**
```json
[
  {
    "id": "clxxx...",
    "keyword": "!help",
    "response": "Here is the help menu...",
    "matchType": "EXACT"
  }
]
```

### POST `/api/autoreplies`

Create a new auto-reply rule.

**Request Body:**
```json
{
  "sessionId": "57xx1x",
  "keyword": "hello",
  "response": "Hi there!",
  "matchType": "CONTAINS"
}
```
**Match Types:** `EXACT`, `CONTAINS`, `REGEX`

### DELETE `/api/autoreplies/[id]`

Delete an auto-reply rule.

**Response (200):**
```json
{ "success": true }
```

---

Webhooks allow you to receive real-time notifications when events occur.

### GET `/api/webhooks`

List all your webhooks.

**Response (200):**
```json
[
  {
    "id": "clxxx...",
    "name": "My Server",
    "url": "https://myserver.com/webhook",
    "secret": "optional_hmac_secret",
    "sessionId": null,
    "events": ["message.received", "message.sent"],
    "isActive": true,
    "createdAt": "2026-01-10T10:00:00.000Z",
    "updatedAt": "2026-01-10T10:00:00.000Z"
  }
]
```

---

### POST `/api/webhooks`

Create a new webhook.

**Request Body:**
```json
{
  "name": "My Server",
  "url": "https://myserver.com/webhook",
  "secret": "optional_secret_for_hmac",
  "sessionId": null,
  "events": ["message.received", "message.sent", "connection.update"]
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Webhook name |
| `url` | string | Yes | Webhook endpoint URL |
| `secret` | string | No | Secret for HMAC signature |
| `sessionId` | string | No | Specific session ID, or null for all |
| `events` | string[] | Yes | Array of event types |

**Available Events:**
| Event | Description |
|-------|-------------|
| `message.received` | New message received |
| `message.sent` | Message sent from this account |
| `message.status` | Message status changed (delivered, read) |
| `connection.update` | Session connected/disconnected |
| `group.update` | Group info changed |
| `contact.update` | Contact info changed |
| `status.update` | WhatsApp status posted or viewed |
| `*` | All events |

**Response (200):**
```json
{
  "id": "clxxx...",
  "name": "My Server",
  "url": "https://myserver.com/webhook",
  "events": ["message.received", "message.sent"],
  "isActive": true
}
```

---

### PATCH `/api/webhooks/[id]`

Update a webhook.

**Request Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "url": "https://new-url.com/webhook",
  "secret": "new_secret",
  "events": ["message.received"],
  "isActive": false
}
```

---

### DELETE `/api/webhooks/[id]`

Delete a webhook.

**Response (200):**
```json
{
  "success": true
}
```

---

### Webhook Payload Format

All webhooks receive POST requests with this JSON payload:

```json
{
  "event": "message.received",
  "sessionId": "57xx1x",
  "timestamp": "2026-01-10T10:30:00.000Z",
  "data": {
    "keyId": "3EB0XXX...",
    "remoteJid": "6287748687946@s.whatsapp.net",
    "fromMe": false,
    "pushName": "Adit",
    "content": {
      "conversation": "Hello!"
    },
    "timestamp": 1736503800
  }
}
```

---

### HMAC Signature Verification

If you configure a `secret`, webhooks include an `X-Webhook-Signature` header:

```
X-Webhook-Signature: sha256=abc123...
```

**Verify in Node.js:**
```javascript
const crypto = require('crypto');

function verifyWebhook(body, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  return signature === expected;
}
```

---

## WebSocket Events

The application uses Socket.io for real-time updates.

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://your-server:3030');

socket.on('connect', () => {
  console.log('Connected to WebSocket');
  
  // Join a session room
  socket.emit('join-session', { sessionId: '57xx1x' });
});
```

### Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connection.update` | Server → Client | Session status changed |
| `message` | Server → Client | New message received |
| `qr` | Server → Client | QR code generated for scanning |
| `join-session` | Client → Server | Subscribe to session events |

**connection.update payload:**
```json
{
  "sessionId": "57xx1x",
  "status": "CONNECTED",
  "qr": null
}
```

---

## Error Codes

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Bad Request - Invalid input or validation failed |
| `401` | Unauthorized - Not authenticated |
| `403` | Forbidden - Authenticated but not allowed to access resource |
| `404` | Not Found - Resource doesn't exist |
| `500` | Internal Server Error |
| `503` | Service Unavailable - WhatsApp socket not ready |

---

## JID Format Reference

WhatsApp uses JID (Jabber ID) format for identifiers:

| Type | Format | Example |
|------|--------|---------|
| Individual | `<phone>@s.whatsapp.net` | `6287748687946@s.whatsapp.net` |
| Group | `<id>@g.us` | `120363014587327510@g.us` |
| Status/Story | `status@broadcast` | `status@broadcast` |

**Phone Number Rules:**
- Use international format without `+`
- Indonesian numbers: Replace leading `0` with `62`
- Example: `08123456789` → `628123456789`

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Broadcast | Random 10-20s delay between messages |
| Spam | Configurable delay (default 500ms) |
| General API | No explicit limits (respect WhatsApp ToS) |

---

## Testing Examples

### Create a Test User
```bash
curl -X POST http://your-server:3030/api/test/create-user
```

### Get Sessions (with API Key)
```bash
curl http://your-server:3030/api/sessions \
  -H "X-API-Key: wag_your_api_key"
```

### Send Message
```bash
curl -X POST http://your-server:3030/api/chat/send \
  -H "X-API-Key: wag_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "57xx1x",
    "jid": "6287748687946@s.whatsapp.net",
    "message": { "text": "Hello from API!" }
  }'
```

### Create Webhook
```bash
curl -X POST http://your-server:3030/api/webhooks \
  -H "X-API-Key: wag_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Server",
    "url": "https://myserver.com/webhook",
    "events": ["message.received", "message.sent"]
  }'
```

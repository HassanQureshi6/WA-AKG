'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react'; // Need to install this or use another lib. Let's use 'qrcode' lib I installed earlier but it's typically server side. 
// Actually I installed `qrcode` package. I can use it to generate data URL.
import QRCode from 'qrcode'; // Client side usage might require buffer polyfill or just use SVG simpler lib.
// Let's use `qrcode.react` which is standard for react. I'll add it.
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// For now let's assume I need to install qrcode.react
// But I can also just render the QR string if I have a component. 
// Let's implement logic first.

type Session = {
    id: string;
    name: string;
    sessionId: string;
    status: string;
    qr?: string | null;
};

export function SessionManager({ user }: { user: any }) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [newSessionName, setNewSessionName] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/sessions').then(res => res.json()).then(data => {
            if (Array.isArray(data)) setSessions(data);
        });

        // Init Socket
        const socketInstance = io({
            path: "/api/socket/io",
            addTrailingSlash: false,
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected');
        });

        socketInstance.on('connection.update', (data: { status: string, qr: string }) => {
            console.log("Connection update:", data);
            if (activeSessionId) { 
                // Determine if this update belongs to the active view logic
                // Typically we need to verify the session ID, but for now I am listening globally?
                // Wait, I need to JOIN the room for the specific session.
            }
             setQrCode(data.qr);
             if (data.status === 'CONNECTED') {
                 setQrCode(null);
                 refreshSessions();
             }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    const refreshSessions = () => {
        fetch('/api/sessions').then(res => res.json()).then(data => setSessions(data));
    }

    const createSession = async () => {
        if (!newSessionName) return;
        setLoading(true);
        try {
            const res = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, name: newSessionName })
            });
            const session = await res.json();
            setSessions([...sessions, session]);
            setNewSessionName("");
            
            // Auto select
            handleViewSession(session);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleViewSession = (session: Session) => {
        setActiveSessionId(session.sessionId);
        setQrCode(session.qr || null);
        // Join room
        socket?.emit('join-session', session.sessionId);
    }
    
    // Simple QR renderer
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    
    useEffect(() => {
        if (qrCode) {
            QRCode.toDataURL(qrCode).then(setQrDataUrl);
        } else {
            setQrDataUrl(null);
        }
    }, [qrCode]);

    const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

    const handleDeleteClick = () => {
        if (activeSessionId) {
            setDeleteSessionId(activeSessionId);
        }
    };

    const confirmDeleteSession = async () => {
        if (!deleteSessionId) return;
        
        try {
            // Standard DELETE via /settings endpoint as per API design
            const res = await fetch(`/api/sessions/${deleteSessionId}/settings`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Session deleted");
                setSessions(sessions.filter(s => s.sessionId !== deleteSessionId));
                setActiveSessionId(null);
                setQrCode(null);
            } else {
                toast.error("Failed to delete session");
            }
        } catch (error) {
            toast.error("Failed to delete session");
        } finally {
            setDeleteSessionId(null);
        }
    };


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Your WhatsApp Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex space-x-2 mb-4">
                        <Input 
                            value={newSessionName} 
                            onChange={e => setNewSessionName(e.target.value)} 
                            placeholder="New Session Name (e.g. Sales)" 
                        />
                        <Button onClick={createSession} disabled={loading}>
                            {loading ? 'Creating...' : 'Add'}
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {sessions.map(session => (
                            <div key={session.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => handleViewSession(session)}>
                                <div>
                                    <div className="font-medium">{session.name}</div>
                                    <div className="text-xs text-gray-500">{session.sessionId}</div>
                                </div>
                                <div className={`text-xs font-bold px-2 py-1 rounded ${session.status === 'CONNECTED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {session.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Session Details</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
                    {activeSessionId ? (
                        <>
                            <h3 className="mb-4 font-semibold text-lg">{sessions.find(s => s.sessionId === activeSessionId)?.name}</h3>
                            
                            {qrDataUrl ? (
                                <div className="text-center">
                                    <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 border p-2 mb-2" />
                                    <p className="text-sm text-gray-500 animate-pulse">Scan with WhatsApp</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    {sessions.find(s => s.sessionId === activeSessionId)?.status === 'CONNECTED' ? (
                                        <div className="text-green-600 font-bold text-xl">CONNECTED</div>
                                    ) : (
                                        <div className="text-gray-400">Waiting for QR or Connected...</div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-gray-400">Select a session to manage</div>
                    )}
                </CardContent>
                {activeSessionId && (
                     <CardFooter>
                         <Button variant="destructive" className="w-full" onClick={handleDeleteClick}>Delete Session / Logout</Button>
                     </CardFooter>
                )}
            </Card>

            <AlertDialog open={!!deleteSessionId} onOpenChange={(open) => !open && setDeleteSessionId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this session? This will disconnect the WhatsApp client and remove session data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteSession} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

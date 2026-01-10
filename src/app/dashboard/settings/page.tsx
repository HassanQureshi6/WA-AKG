"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
    const [sessionId, setSessionId] = useState("");
    const [config, setConfig] = useState({
        ghostMode: false,
        antiDelete: false,
        readReceipts: true,
    });
    const [loading, setLoading] = useState(false);

    const [sessions, setSessions] = useState<any[]>([]);

    useEffect(() => {
        // Fetch sessions first
        fetch('/api/sessions').then(r => r.json()).then(data => {
            const connected = data.filter((s: any) => s.status === 'CONNECTED');
            setSessions(connected);
            if (connected.length > 0) {
                setSessionId(connected[0].sessionId);
            }
        });
    }, []);

    useEffect(() => {
        if (!sessionId) return;
        // Fetch config for selected session
        // Note: The API /api/sessions returns config in the list? Or we need to fetch specific?
        // Let's find it in the sessions list for now
        const session = sessions.find(s => s.sessionId === sessionId);
        if (session && session.config) {
             setConfig(session.config);
        } else {
            // Reset or fetch fresh if needed
             setConfig({
                ghostMode: false,
                antiDelete: false,
                readReceipts: true,
            });
        }
    }, [sessionId, sessions]);

    const handleSave = async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/sessions/${sessionId}/settings`, {
                method: "PATCH",
                body: JSON.stringify({ config })
            });
            if (res.ok) {
                toast.success("Settings saved successfully");
                // Update local state or re-fetch?
            } else {
                toast.error("Failed to save settings");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error saving settings");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                 <div className="flex items-center gap-2">
                     <span className="text-sm font-medium">Session:</span>
                     <select 
                        className="flex h-10 w-[200px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={sessionId} 
                        onChange={(e) => setSessionId(e.target.value)}
                     >
                         <option value="" disabled>Select Session</option>
                         {sessions.map((s: any) => (
                             <option key={s.sessionId} value={s.sessionId}>{s.name}</option>
                         ))}
                     </select>
                 </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Privacy & Utility</CardTitle>
                    <CardDescription>Configure ghost mode and other features for your active session.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="ghost-mode" className="flex flex-col space-y-1">
                            <span>Ghost Mode</span>
                            <span className="font-normal text-xs text-muted-foreground">View status and read messages without sending blue ticks.</span>
                        </Label>
                        <Switch 
                            id="ghost-mode" 
                            checked={config.ghostMode}
                            onCheckedChange={c => setConfig({...config, ghostMode: c})}
                        />
                    </div>
                    
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="anti-delete" className="flex flex-col space-y-1">
                            <span>Anti-Delete</span>
                            <span className="font-normal text-xs text-muted-foreground">Keep messages even if the sender deletes them for everyone.</span>
                        </Label>
                        <Switch 
                            id="anti-delete" 
                            checked={config.antiDelete}
                            onCheckedChange={c => setConfig({...config, antiDelete: c})}
                        />
                    </div>

                    <div className="pt-4">
                        <Button onClick={handleSave} disabled={loading || !sessionId}>
                            <Save className="mr-2 h-4 w-4" /> Save Configuration
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

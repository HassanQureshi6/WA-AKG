import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

import { auth } from "@/lib/auth";
import { getAccessibleSessions } from "@/lib/api-auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const sessions = await getAccessibleSessions(session.user.id!, session.user.role || "OWNER");

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <Link href="/dashboard/sessions">
                     <Button><Plus className="mr-2 h-4 w-4" /> Add Session</Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                    </CardHeader>
                     <CardContent>
                        <div className="text-2xl font-bold">{sessions.length}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                    </CardHeader>
                     <CardContent>
                        <div className="text-2xl font-bold">{sessions.filter(s => s.status === 'CONNECTED').length}</div>
                    </CardContent>
                </Card>
            </div>
            
             <h3 className="text-xl font-semibold mt-8">Recent Sessions</h3>
             <div className="grid gap-4 md:grid-cols-3">
                 {sessions.map(session => (
                     <Card key={session.id}>
                         <CardHeader>
                             <CardTitle>{session.name}</CardTitle>
                         </CardHeader>
                         <CardContent>
                             <p className="text-sm text-gray-500">Status: <span className={session.status === 'CONNECTED' ? 'text-green-600 font-bold' : 'text-yellow-600'}>{session.status}</span></p>
                             <p className="text-xs text-gray-400 mt-2">ID: {session.sessionId}</p>
                         </CardContent>
                     </Card>
                 ))}
                 {sessions.length === 0 && <p className="text-gray-500">No sessions found.</p>}
             </div>
        </div>
    );
}

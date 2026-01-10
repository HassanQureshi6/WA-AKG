import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const user = await prisma.user.create({
            data: {
                email: `test-${Date.now()}@example.com`,
                password: "password123", // In real app, hash this!
                name: "Test User",
                role: "OWNER"
            }
        });
        return NextResponse.json(user);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}

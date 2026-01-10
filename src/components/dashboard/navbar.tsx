import { SessionSelector } from "./session-selector";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";

export function Navbar() {
    return (
        <header className="bg-white border-b px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4">
               <MobileNav />
               {/* Left side content if any */}
            </div>
            
            <div className="flex items-center gap-4">
                <SessionSelector />
                <div className="h-6 w-px bg-gray-200 mx-2" />
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-500" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
                </Button>
            </div>
        </header>
    );
}

"use client";

import { useState } from "react";
import { ChatList } from "./chat-list";
import { ChatWindow } from "./chat-window";
import { Button } from "@/components/ui/button";

interface ChatLayoutClientProps {
    sessionId: string;
}

interface SelectedChat {
    jid: string;
    name?: string;
}

export function ChatLayoutClient({ sessionId }: ChatLayoutClientProps) {
    const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);

    // Handler that receives both jid and optional name from ChatList
    const handleSelectChat = (jid: string, name?: string) => {
        setSelectedChat({ jid, name });
    };

    const handleBack = () => {
        setSelectedChat(null);
    };

    return (
        <div className="flex h-full relative">
            {/* Chat List: Hidden on mobile if chat is selected, always visible on desktop */}
            <div className={`w-full md:w-80 border-r bg-white h-full overflow-y-auto absolute md:static z-10 transition-transform duration-300 ${selectedChat ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
                <ChatList 
                    sessionId={sessionId} 
                    onSelectChat={handleSelectChat} 
                    selectedJid={selectedChat?.jid}
                />
            </div>

            {/* Chat Window: Visible on mobile if chat is selected (covers list), always visible on desktop */}
            <div className={`flex-1 h-full bg-white absolute md:static w-full md:w-auto z-20 transition-transform duration-300 ${selectedChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                {selectedChat ? (
                     <div className="h-full flex flex-col">
                         {/* Mobile Header for Back Button - Only visible on mobile */}
                         <div className="md:hidden p-2 border-b flex items-center bg-slate-50">
                             <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
                                 &larr; Back
                             </Button>
                             <span className="font-medium ml-2 truncate">{selectedChat.name || selectedChat.jid}</span>
                         </div>
                         <div className="flex-1 overflow-hidden">
                             <ChatWindow 
                                 sessionId={sessionId} 
                                 jid={selectedChat.jid} 
                                 name={selectedChat.name}
                             />
                         </div>
                     </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground bg-slate-50">
                        <div className="text-center p-4">
                            <p className="hidden md:block">Select a chat to start messaging</p>
                            <p className="md:hidden">Select a chat from the list</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

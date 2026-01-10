import Link from "next/link";
import { ArrowRight, Bot, Github, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Bot className="h-6 w-6 text-green-600" />
            <span>WA-AKG</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#about" className="text-sm font-medium hover:text-green-600">About</Link>
            <Link href="/docs/USER_GUIDE.md" className="text-sm font-medium hover:text-green-600">Documentation</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container px-4 py-24 md:py-32 md:px-6 lg:py-40">
          <div className="flex flex-col items-center space-y-8 text-center">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Simple <span className="text-green-600">WhatsApp Gateway</span> Management
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                A powerful, self-hosted dashboard to manage your WhatsApp sessions, schedules, and auto-replies.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8 bg-green-600 hover:bg-green-700 text-lg">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="https://github.com/mrifqidaffaaditya/WA-AKG" target="_blank">
                <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                  <Github className="mr-2 h-5 w-5" />
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Simplified Info Section */}
        <section id="about" className="container px-4 py-12 md:px-6 bg-white rounded-3xl shadow-sm my-8 max-w-5xl">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">About WA-AKG</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  WA-AKG is an open-source project designed to bridge the gap between WhatsApp API capabilities and user-friendly management.
                </p>
                <p>
                  Built with modern technologies like Next.js, Baileys, and Prisma, it ensures stability, security, and ease of use for developers and businesses alike.
                </p>
                <div className="pt-4 flex gap-4">
                  <div className="flex flex-col border-l-4 border-green-500 pl-4">
                    <span className="font-bold text-2xl">100%</span>
                    <span className="text-sm text-gray-500">Self-Hosted</span>
                  </div>
                  <div className="flex flex-col border-l-4 border-green-500 pl-4">
                    <span className="font-bold text-2xl">MIT</span>
                    <span className="text-sm text-gray-500">License</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-100 p-8">
              <h3 className="font-bold mb-4">Quick Documentation</h3>
              <ul className="space-y-3">
                {[
                  "Multi-Session support via QR Code",
                  "Real-time message sending & receiving",
                  "Webhook integration for developers",
                  "Scheduled messages & broadcasts",
                  "Keyword-based Auto Replies"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/docs/USER_GUIDE.md">
                  <Button variant="link" className="text-green-600 p-0 h-auto">
                    Read Full Guide <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white">
        <div className="container px-4 py-8 md:px-6 flex flex-col items-center justify-between gap-4">
          <p className="text-sm text-gray-500 text-center">
            Built with ❤️ by <a href="https://github.com/mrifqidaffaaditya" className="font-medium hover:text-green-600 underline underline-offset-4">Aditya</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

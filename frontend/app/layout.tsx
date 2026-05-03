import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Arena AI Debate",
  description:
    "Multi-agent AI debate platform where AI agents engage in structured debates",
  keywords: ["AI", "debate", "multi-agent", "artificial intelligence"],
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}
      >
        <div className="bg-arena-mesh min-h-screen flex flex-col">
          {/* Navigation Header */}
          <header className="sticky top-0 z-50 w-full glass-strong">
            <div className="gradient-divider" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-3 group">
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-105 border border-white/10">
                    <Image
                      src="/icon.png"
                      alt="Arena AI Logo"
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-base font-bold font-heading text-white leading-tight">
                      Arena
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-arena-cyan/70 leading-tight">
                      AI Debate
                    </span>
                  </div>
                </Link>

                {/* Navigation Links */}
                <nav className="flex items-center space-x-1">
                  <Link
                    href="/"
                    className="relative px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5 group"
                  >
                    <span className="relative z-10">Home</span>
                  </Link>
                  <Link
                    href="/history"
                    className="relative px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5 group"
                  >
                    <span className="relative z-10">History</span>
                  </Link>
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
            {children}
          </main>

          {/* Footer */}
          <footer className="relative z-10 glass-subtle">
            <div className="gradient-divider" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <div className="text-sm text-gray-500">
                  <p>© 2026 Arena AI Debate. Multi-agent debate platform.</p>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-arena-cyan/60 animate-pulse" />
                    Powered by AI Agents
                  </span>
                  <span className="hidden sm:inline text-gray-700">•</span>
                  <span className="hidden sm:inline">Built with Next.js</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

// Made with Bob

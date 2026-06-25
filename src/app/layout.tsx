import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sg",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jbm",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SportsFest — Inter-College Sports Events Portal",
  description:
    "SportsFest — the inter-college sports events portal. Browse, filter and register for upcoming sports events. Strict black & white glassmorphism design.",
  keywords: [
    "SportsFest",
    "sports",
    "college",
    "events",
    "tournament",
    "registration",
  ],
  authors: [{ name: "SportsFest" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "SportsFest — Inter-College Sports Events Portal",
    description: "Play. Compete. Win. Browse and register for inter-college sports events.",
    siteName: "SportsFest",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        {/* Theme bootstrap — runs before paint to avoid FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sportsfest-theme');if(t==='light'){document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
        {/* Decorative display fonts (Bebas Neue, Cormorant Garamond, Playfair Display) loaded via <link> */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,400;1,300;1,400&family=Playfair+Display:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}

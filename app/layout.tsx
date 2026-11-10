import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, Caveat, Manrope } from "next/font/google";
import "./globals.css";
import { SplashScreen } from "@/components/SplashScreen";
import { PWAProvider } from "@/components/PWAProvider";
import { InstallPrompt } from "@/components/InstallPrompt";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-price",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://renukaartstudio.com"),
  title: "Learn Art. Rediscover Yourself. Create a Kinder You. | Renuka Aggarwal — Renuka Art Studio",
  description:
    "Join Renuka Aggarwal for a transformative 120-minute live watercolor masterclass. Step-by-step mindful watercolor courses designed for adults 25+ — no prior experience needed.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Renuka Art Studio",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Learn Art. Rediscover Yourself. Create a Kinder You. | Renuka Aggarwal",
    description:
      "Join Renuka Aggarwal for a transformative 120-minute live watercolor masterclass. Step-by-step mindful watercolor courses designed for adults 25+.",
    type: "website",
    url: "https://renukaartstudio.com",
    images: [
      {
        url: "/images/instructor_hero.jpeg",
        width: 1200,
        height: 630,
        alt: "Renuka Aggarwal — Renuka Art Studio Masterclass",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Learn Art. Rediscover Yourself. Create a Kinder You. | Renuka Aggarwal",
    description:
      "Join Renuka Aggarwal for a transformative 120-minute live watercolor masterclass.",
    images: ["/images/instructor_hero.jpeg"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#444C38" },
    { media: "(prefers-color-scheme: dark)", color: "#444C38" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cormorant.variable} ${jakarta.variable} ${caveat.variable} ${manrope.variable} scroll-smooth antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background text-foreground font-sans selection:bg-sage-light/40 selection:text-foreground"
      >
        {/* Branded splash screen — shown on full page load/refresh, auto-dismissed */}
        <SplashScreen />
        {children}
        {/* PWA: service worker registration + update notifications */}
        <PWAProvider />
        {/* PWA: install prompt banner (Chromium + iOS Safari) */}
        <InstallPrompt />
      </body>
    </html>
  );
}

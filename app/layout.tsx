import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://renukaatelier.com"),
  title: "Free Live Masterclass — The Luminosity Blueprint™ | Renuka Atelier",
  description:
    "Join Renuka Rao for a transformative 120-minute live masterclass. Master light vectors, warm-cool color harmonies, and emotional depth in your paintings.",
  openGraph: {
    title: "Free Live Masterclass — The Luminosity Blueprint™ | Renuka Atelier",
    description:
      "Join Renuka Rao for a transformative 120-minute live masterclass. Master light vectors, warm-cool color harmonies, and emotional depth in your paintings.",
    type: "website",
    url: "https://renukaatelier.com/masterclass",
    images: [
      {
        url: "/images/instructor_hero.jpg",
        width: 1200,
        height: 630,
        alt: "The Luminosity Blueprint Masterclass with Renuka Rao",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Live Masterclass — The Luminosity Blueprint™ | Renuka Atelier",
    description:
      "Join Renuka Rao for a transformative 120-minute live masterclass. Master light vectors, warm-cool color harmonies, and emotional depth in your paintings.",
    images: ["/images/instructor_hero.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${playfair.variable} ${outfit.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground font-sans selection:bg-accent/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}

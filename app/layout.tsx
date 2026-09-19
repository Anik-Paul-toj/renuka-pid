import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, Caveat } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://renukaartstudio.com"),
  title: "Learn Art. Rediscover Yourself. Create a Kinder You. | Renuka Aggarwal — Art & Soul Studio",
  description:
    "Join Renuka Aggarwal for a transformative 120-minute live watercolor masterclass. Step-by-step mindful watercolor courses designed for adults 25+ — no prior experience needed.",
  openGraph: {
    title: "Learn Art. Rediscover Yourself. Create a Kinder You. | Renuka Aggarwal",
    description:
      "Join Renuka Aggarwal for a transformative 120-minute live watercolor masterclass. Step-by-step mindful watercolor courses designed for adults 25+.",
    type: "website",
    url: "https://renukaartstudio.com",
    images: [
      {
        url: "/images/instructor_hero.jpg",
        width: 1200,
        height: 630,
        alt: "Renuka Aggarwal — Art & Soul Studio Masterclass",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Learn Art. Rediscover Yourself. Create a Kinder You. | Renuka Aggarwal",
    description:
      "Join Renuka Aggarwal for a transformative 120-minute live watercolor masterclass.",
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
      className={`${cormorant.variable} ${jakarta.variable} ${caveat.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground font-sans selection:bg-sage-light/40 selection:text-foreground">
        {children}
      </body>
    </html>
  );
}

import React from "react";
import type { Metadata, Viewport } from "next";
import { Mali, Varela_Round } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const mali = Mali({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-mali",
});

const varelaRound = Varela_Round({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-varela",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#4ADE80",
};

export const metadata: Metadata = {
  title: "Asobeto - Learn Vietnamese",
  description: "A fun language learning app for kids to learn Vietnamese",
  generator: "v0.app",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Asobeto",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/asobeto-icon.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/asobeto-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`font-sans antialiased ${mali.variable} ${varelaRound.variable} min-h-dvh`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}

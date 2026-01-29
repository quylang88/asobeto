import React from "react";
import type { Metadata } from "next";
import { Nunito, Varela_Round } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const _nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const _varelaRound = Varela_Round({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-varela",
});

export const metadata: Metadata = {
  title: "Asobeto - Learn Vietnamese",
  description: "A fun language learning app for kids to learn Vietnamese",
  generator: "v0.app",
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
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

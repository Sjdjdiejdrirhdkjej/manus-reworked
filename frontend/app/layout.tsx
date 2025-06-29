import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ConnectionStatus from "@/components/ConnectionStatus";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Manus",
  description: "An AI Chat App with Agent Capabilities",
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 999 }}>
          <ConnectionStatus />
        </div>
        {children}
      </body>
    </html>
  );
}
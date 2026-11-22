import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "RO-CKET",
  description: "Repair order and profit tracking",
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-touch-icon.png",
    icon: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RO-CKET" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body 
        className="min-h-screen bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/galaxy.png')" }}
      >
        <div className="bg-black/20 min-h-screen">
          <div className="bg-white/90 border-b">
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-end items-center gap-4">
              <Link href="/dashboard">
                <img 
                  src="/mission-control.png" 
                  alt="Mission Control" 
                  className="h-12 hover:opacity-80"
                />
              </Link>
              <Link href="/repair-orders">
                <img 
                  src="/launch-ro.png" 
                  alt="Launch RO" 
                  className="h-12 hover:opacity-80"
                />
              </Link>
            </div>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
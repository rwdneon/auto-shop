import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auto Shop Manager",
  description: "Repair order and profit tracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

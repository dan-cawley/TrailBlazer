import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrailBlazer",
  description: "A flexible homeschool scheduling engine.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

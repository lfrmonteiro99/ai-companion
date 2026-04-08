import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Companion",
  description: "Chat with distinct AI personalities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-gray-800 px-6 py-4">
          <a href="/" className="text-xl font-bold text-white">
            AI Companion
          </a>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}

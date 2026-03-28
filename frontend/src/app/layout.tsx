import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeForge — AI-Powered Competitive Programming",
  description:
    "An intelligent competitive programming platform that generates personalized problems, evaluates code with AI, and tracks your progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col font-sans bg-gray-950 text-white">
        {children}
      </body>
    </html>
  );
}

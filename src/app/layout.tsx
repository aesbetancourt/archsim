import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import ThemeProvider from "@/components/ThemeProvider";
import { migrationScript } from "@/lib/storage-migration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Charrette",
  description:
    "Draw it. Defend it. Face the crit. Practice software architecture with katas and an AI reviewer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* Move the browser data of the old app name before the app reads it. */}
        {/* oxlint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: migrationScript }} />
        <ThemeProvider>
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

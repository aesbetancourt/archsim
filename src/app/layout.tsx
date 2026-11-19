import type { Metadata } from "next";
import { Bodoni_Moda, EB_Garamond, Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import ThemeProvider from "@/components/ThemeProvider";
import { readingFontScript } from "@/lib/reading-font";
import { migrationScript } from "@/lib/storage-migration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${bodoni.variable} ${garamond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* Move the browser data of the old app name before the app reads it. */}
        {/* oxlint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: migrationScript }} />
        {/* Set the reading font before the first paint, so the text does not change. */}
        {/* oxlint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: readingFontScript }} />
        <ThemeProvider>
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

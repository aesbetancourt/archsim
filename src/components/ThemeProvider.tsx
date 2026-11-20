"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Applies the light or the dark theme as a class on the page. The first visit follows the system
 * setting.
 * @returns The children inside the theme provider.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

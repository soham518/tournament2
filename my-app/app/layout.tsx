import type { Metadata } from "next";
import { spaceGrotesk, spaceMono } from "@/lib/fonts";
import "./globals.css";
import "./usw-theme.css";

export const metadata: Metadata = {
  title: "Shadow Fight Arena Tournaments",
  description: "Discover, register for, and manage Shadow Fight Arena tournaments.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} h-full antialiased`}
    >
      {/* Font variables and theme tokens live on <html> (the one true
          ancestor of everything, portals included) rather than a wrapper
          div — Base UI's Dialog portals its content straight onto <body>,
          outside any component-scoped wrapper, so anything scoped lower
          than this is invisible to dialog content. See usw-theme.css. */}
      <body className="usw-theme min-h-full flex flex-col">{children}</body>
    </html>
  );
}

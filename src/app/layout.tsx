// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProjeX - Project Management App",
  description: "Organize tasks, track progress, and collaborate seamlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* The font is now controlled by the @theme directive in globals.css */}
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* Apply background and text colors using CSS variables */}
          <div 
            className="min-h-screen transition-colors duration-300"
            style={{
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-foreground)'
            }}
          >
            <style jsx global>{`
              body {
                --color-background: var(--color-light-bg);
                --color-foreground: var(--color-light-text);
              }
              .dark body {
                --color-background: var(--color-dark-bg);
                --color-foreground: var(--color-dark-text);
              }
            `}</style>
            <Header />
            <main>{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
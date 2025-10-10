// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import PusherSubscriber from "@/components/PusherSubscriber";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProjeXY - Project Management App",
  description: "Organize tasks, track progress, and collaborate seamlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} flex flex-col min-h-screen bg-white dark:bg-black text-black dark:text-white`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 10000,
              }}
            />
            <PusherSubscriber />
            <div className="flex flex-col flex-1">
              <Header />
              <main className="flex-grow container mx-auto px-4 py-12">
                {children}
              </main>
              <Footer />
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}

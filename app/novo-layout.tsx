"use client";
import { Toaster } from "./_components/ui/toaster";
import AuthProvider from "./_providers/auth";
import "./globals.css";
import { ThemeProvider } from "next-themes";

export default function NewRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className="font-sans">
        <link rel="icon" href="/iconprontuario.png" />
        <ThemeProvider attribute="class">
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
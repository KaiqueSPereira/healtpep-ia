
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "./_components/ui/toaster";
import AuthProvider from "./_providers/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Health Pep",
  description: "Seu prontuario medico pessoal",
  icons: {
    icon: "/iconprontuario.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className="font-sans flex flex-col min-h-screen">
        <ThemeProvider attribute="class">
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}

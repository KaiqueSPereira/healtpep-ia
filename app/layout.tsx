import { Toaster } from "./_components/ui/toaster";
import AuthProvider from "./_providers/auth";
import "./globals.css";

export const metadata = {
  title: "Health Pep",
  description: "Seu prontuario medico pessoal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className="dark">
      <body className="font-sans">
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}

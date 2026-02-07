
import type { Metadata } from "next";
import Providers from "./_components/providers";
import Footer from "./_components/footer"; 
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
        <Providers>
          {/* Esta main agora é um container flex-col para os filhos da página */}
          <main className="flex flex-col flex-grow">
            {children}
          </main>
        </Providers>
        <Footer />
      </body>
    </html>
  );
}

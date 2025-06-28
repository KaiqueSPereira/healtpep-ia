
import Providers from "./_components/providers";
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
    <html lang="pt-br">
      <body className="font-sans">
        <link rel="icon" href="/iconprontuario.png" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

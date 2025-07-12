
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
 <div className="bottom-0 left-0 z-50 w-full p-4">
 <p className="text-center text-sm">© 2024 Health Pep</p>
 </div>
      </body>
    </html>
  );
}

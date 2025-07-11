
import Providers from "./_components/providers";
import { Card, CardContent } from "./_components/ui/card";
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
        <div className="bottom-0 left-0 z-50 w-full">
      <Card className="rounded-none">
        <CardContent className="px-5 py-5">
          <p className="text-center text-sm">© 2024 Health Pep</p>
        </CardContent>
      </Card>
    </div>
      </body>
    </html>
  );
}

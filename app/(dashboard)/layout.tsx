
import Header from "@/app/_components/header";
import Footer from "@/app/_components/footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </header>
      
      {/* 
        O conteúdo principal agora tem padding-top (pt-20) e padding-bottom (pb-20)
        para não ser sobreposto pelo Header e Footer.
        Ajuste esses valores se a altura do seu header/footer mudar.
      */}
      <main className="pt-20 pb-20">
        {children}
      </main>
      
      <footer className="fixed bottom-0 left-0 right-0 z-50">
        <Footer />
      </footer>
    </div>
  );
}

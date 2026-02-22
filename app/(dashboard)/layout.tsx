
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
    <div className="grid h-screen grid-rows-[auto_1fr_auto]">
      <Header />
      {/* O <main> atua como um contêiner de dimensionamento do grid, com posicionamento relativo. */}
      <main className="relative min-h-0">
        {/* A <div> interna, absolutamente posicionada, lida com a rolagem e o padding. */}
        <div className="absolute inset-0 overflow-y-auto px-4 py-8 md:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

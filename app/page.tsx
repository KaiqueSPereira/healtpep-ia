import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Header from "./_components/header";
import Searchbar from "./_components/searchbar";
import NovaConsulta from "./consulta/components/novaconsulta";
import Footer from "./_components/footer";
import AgendamentosList from "./consulta/components/agendamentolist";
import { authOptions } from "./_lib/auth";

const Home = async () => {
  // Obtém a sessão do usuário autenticado
  const session = await getServerSession(authOptions);

  // Se o usuário não estiver autenticado, redireciona para a página de login
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const formattedDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      <Header />
      <div className="p-5">
        <h2 className="text-2xl font-bold">Olá, {session.user.name}</h2>
        <p>{formattedDate}</p>
        <div className="mt-6">
          <Searchbar />
        </div>
        <div className="mt-5 flex flex-col gap-5">
          <NovaConsulta />
          <div>
            <AgendamentosList userId={session.user.id} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;

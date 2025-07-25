﻿import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Header from "./_components/header";
import Searchbar from "./_components/searchbar";
import NovaConsulta from "./consulta/components/novaconsulta";
import AgendamentosList from "./consulta/components/agendamentolist";
import { authOptions } from "./_lib/auth";
import { Button } from "./_components/ui/button";
import Link from "next/link";

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
        <div className="mt-5 flex flex-col justify-between gap-5">
          <div className="mt-5 flex flex-row items-center gap-5">
            <NovaConsulta />
            <Link href="/exames/novo"><Button className="w-auto">Novo Exame</Button></Link>
          </div>

          <div>
            <AgendamentosList userId={session.user.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

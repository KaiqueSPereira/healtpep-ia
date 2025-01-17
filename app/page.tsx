import Header from "./_components/header";
import AgendamentoItem from "./_components/agendamentosItem";
import { db } from "./_lib/prisma";
import { Card, CardContent } from "./_components/ui/card";
import { Inter, Roboto_Mono } from "next/font/google";
import Searchbar from "./_components/searchbar";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const Home = async () => {
  let agendamentos = [];

  try {
    // Consulta os agendamentos com os relacionamentos necessários
    agendamentos = await db.consultas.findMany({
      include: {
        profissional: {
          select: {
            nome: true,
          },
        },
        unidade: {
          select: {
            nome: true,
          },
        },
      },
    });

    // Verifique se agendamentos é nulo ou vazio
    if (!agendamentos || agendamentos.length === 0) {
      console.error("Nenhum agendamento encontrado.");
      return;
    }
  } catch (error) {
    console.error("Erro ao consultar agendamentos:", error);
    return;
  }

  // Filtra agendamentos futuros e passados
  const agendamentosFuturos = agendamentos.filter((agendamento) => {
    const dataAgendamento = new Date(agendamento.data);
    // Verifica se a data é válida antes de comparar
    if (isNaN(dataAgendamento)) {
      console.error(`Data inválida para o agendamento ${agendamento.id}`);
      return false;
    }
    return dataAgendamento >= new Date(); // Verifica se é futuro
  });

  const agendamentosPassados = agendamentos.filter((agendamento) => {
    const dataAgendamento = new Date(agendamento.data);
    // Verifica se a data é válida antes de comparar
    if (isNaN(dataAgendamento)) {
      console.error(`Data inválida para o agendamento ${agendamento.id}`);
      return false;
    }
    return dataAgendamento < new Date(); // Verifica se é passado
  });

  // Formata a data atual
  const currentDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Capitaliza o primeiro caractere da data formatada
  const formattedDate =
    currentDate.charAt(0).toUpperCase() + currentDate.slice(1);

  return (
    <div>
      <Header />
      <div className="p-5">
        {/* Nome do usuário dinâmico pode ser passado aqui */}
        <h2 className="text-2xl font-bold">Olá, Kaique</h2>
        <p>{formattedDate}</p>
        <div className="mt-6">
          <Searchbar />
        </div>
        <div className="mt-5">
          <h2 className="text-xs font-bold uppercase text-gray-400">
            Agendamentos
          </h2>
          <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden">
            {agendamentosFuturos.map((agendamento) => (
              <AgendamentoItem
                key={agendamento.id}
                consultas={agendamento}
                profissional={
                  agendamento.profissional
                    ? agendamento.profissional.nome
                    : "Profissional desconhecido"
                }
                unidade={
                  agendamento.unidade
                    ? agendamento.unidade.nome
                    : "Unidade desconhecida"
                }
              />
            ))}
          </div>
        </div>
        <div className="mt-5">
          <h2 className="text-xs font-bold uppercase text-gray-400">
            Últimas Consultas
          </h2>
          <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden">
            {agendamentosPassados.map((agendamento) => (
              <AgendamentoItem
                key={agendamento.id}
                consultas={agendamento}
                profissional={
                  agendamento.profissional
                    ? agendamento.profissional.nome
                    : "Profissional desconhecido"
                }
                unidade={
                  agendamento.unidade
                    ? agendamento.unidade.nome
                    : "Unidade desconhecida"
                }
              />
            ))}
          </div>
        </div>
      </div>
      <footer>
        <Card>
          <CardContent className="px-5 py-5">
            <p className="text-center text-sm">© 2024 Health Pep</p>
          </CardContent>
        </Card>
      </footer>
    </div>
  );
};

export default Home;

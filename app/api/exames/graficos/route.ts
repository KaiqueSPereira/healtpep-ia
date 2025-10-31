import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { safeDecrypt } from "@/app/_lib/crypto";

// Função robusta para descriptografar ou retornar o valor original
function tryDecrypt(value: string | null | undefined): string {
    if (!value) return "";
    const decryptedValue = safeDecrypt(value);
    // Se a descriptografia falhar (retornar null), usa o valor original.
    // Isso lida com dados antigos não criptografados.
    return decryptedValue !== null ? decryptedValue : value;
}

// Interface para estruturar os dados para o gráfico
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: (number | null)[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

// Função para gerar uma cor aleatória para as linhas do gráfico
const getRandomColor = () => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return {
    borderColor: `rgb(${r}, ${g}, ${b})`,
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.5)`,
  };
};

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const exames = await prisma.exame.findMany({
      where: { userId },
      include: { resultados: true },
      orderBy: { dataExame: 'asc' },
    });

    // Objeto para agrupar os resultados por nome
    const resultsByName: { [key: string]: { date: Date; value: number }[] } = {};
    const allDates = new Set<string>();

    exames.forEach(exame => {
      const examDate = new Date(exame.dataExame).toISOString().split('T')[0];
      allDates.add(examDate);

      exame.resultados.forEach(resultado => {
        const nome = tryDecrypt(resultado.nome);
        const valorStr = tryDecrypt(resultado.valor);
        const numericValue = parseFloat(valorStr.replace(',', '.'));

        // Adiciona ao grupo apenas se for um nome válido e um número
        if (nome && !isNaN(numericValue)) {
          if (!resultsByName[nome]) {
            resultsByName[nome] = [];
          }
          resultsByName[nome].push({ date: exame.dataExame, value: numericValue });
        }
      });
    });

    // Cria os 'labels' (datas) ordenados
    const labels = Array.from(allDates).sort();

    // Cria os 'datasets'
    const datasets = Object.keys(resultsByName).map(nome => {
      const dataPoints = resultsByName[nome];
      const color = getRandomColor();

      // Mapeia os valores para as datas corretas, inserindo 'null' onde não há dados
      const data = labels.map(labelDate => {
        const point = dataPoints.find(p => new Date(p.date).toISOString().split('T')[0] === labelDate);
        return point ? point.value : null;
      });

      return {
        label: nome,
        data,
        ...color,
      };
    });

    const chartData: ChartData = { labels, datasets };

    return NextResponse.json(chartData, { status: 200 });

  } catch (error) {
    console.error("Erro ao montar dados para gráficos:", error);
    return NextResponse.json({ error: "Erro interno ao processar dados para gráficos." }, { status: 500 });
  }
}
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Textarea } from "@/app/_components/ui/textarea";

interface Anotacao {
  id: string;
  anotacao: string;
}

interface AnotacoesCardProps {
  anotacoes: Anotacao[];
  novaAnotacaoContent: string;
  setNovaAnotacaoContent: (value: string) => void;
  handleAdicionarAnotacao: () => void;
}

const AnotacoesCard = ({ 
  anotacoes, 
  novaAnotacaoContent, 
  setNovaAnotacaoContent, 
  handleAdicionarAnotacao 
}: AnotacoesCardProps) => {
  return (
    <>
      {anotacoes.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Anotações</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {anotacoes.map((anotacao) => (
                <li key={anotacao.id}>{anotacao.anotacao}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Adicionar Nova Anotação</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <Textarea 
            placeholder="Digite sua anotação aqui..." 
            value={novaAnotacaoContent} 
            onChange={(e) => setNovaAnotacaoContent(e.target.value)} 
          />
          <Button onClick={handleAdicionarAnotacao}>Adicionar Anotação</Button>
        </CardContent>
      </Card>
    </>
  );
};

export default AnotacoesCard;
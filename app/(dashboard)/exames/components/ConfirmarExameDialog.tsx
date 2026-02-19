// app/exames/components/ConfirmarExameDialog.tsx
"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
// CORREÇÃO: Importa os tipos corretos do Prisma, e cria um alias para UnidadeDeSaude
import type { ResultadoExame, Profissional, UnidadeDeSaude as Unidade } from "@prisma/client";

// CORREÇÃO: Define um tipo frontend para os resultados que inclui o campo temporário "outraUnidade"
interface ResultadoExameFrontend extends Omit<ResultadoExame, 'exameId' | 'createdAt' | 'id'> {
    id?: string;
    outraUnidade?: string;
}

interface ConfirmarExameDialogProps {
  loadingSubmit: boolean;
  tipo: string;
  dataExame: string;
  selectedProfissional: Profissional | null;
  selectedUnidade: Unidade | null;
  anotacao: string;
  // CORREÇÃO: Usa o novo tipo frontend para a prop exames
  exames: ResultadoExameFrontend[];
  onSubmit: () => void;
  children: React.ReactNode;
}

export const ConfirmarExameDialog = ({
  loadingSubmit,
  tipo,
  dataExame,
  selectedProfissional,
  selectedUnidade,
  anotacao,
  exames = [], // Valor padrão para evitar undefined
  onSubmit,
  children,
}: ConfirmarExameDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Cadastro do Exame</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm text-muted-foreground max-h-[400px] overflow-y-auto">
          <p>
            <strong>Tipo:</strong> {tipo || "Não selecionado"}
          </p>
          <p>
            <strong>Data:</strong> {dataExame || "Não definida"}
          </p>
          <p>
            <strong>Profissional:</strong>{" "}
            {selectedProfissional?.nome || "Não selecionado"}
          </p>
          <p>
            <strong>Unidade:</strong>{" "}
            {selectedUnidade?.nome || "Não selecionada"}
          </p>
          <p>
            <strong>Anotação:</strong> {anotacao || "Nenhuma"}
          </p>
          {/* A lógica para exibir os exames permanece a mesma, mas agora o tipo está correto */}
          {["Sangue", "Urina"].includes(tipo) && exames && exames.length > 0 && (
            <>
              <p className="pt-2 font-semibold">Resultados:</p>
              <ul className="list-disc pl-4">
                {exames.map((resultado, idx) => (
                  <li key={idx}>
                    {resultado.nome || "(sem nome)"} — {resultado.valor || "-"}
                    {" "}
                    {resultado.unidade === "Outro"
                      ? resultado.outraUnidade
                      : resultado.unidade || ""}
                    {" "}
                    — Ref: {resultado.referencia || "-"}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={loadingSubmit}>
            Confirmar e Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

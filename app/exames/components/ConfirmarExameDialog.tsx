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
import { Exame, Profissional, Unidade } from "@/app/_components/types";

interface ConfirmarExameDialogProps {
  loadingSubmit: boolean;
  tipoExame: string;
  dataExame: string;
  selectedProfissional: Profissional | null;
  selectedUnidade: Unidade | null;
  anotacao: string;
  exames: Exame["resultados"]; // Agora usamos apenas os resultados
  onSubmit: () => void;
  children: React.ReactNode;
}

export const ConfirmarExameDialog = ({
  loadingSubmit,
  tipoExame,
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
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Tipo:</strong> {tipoExame || "Não selecionado"}
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
          {["sangue", "urina"].includes(tipoExame) && exames && (
            <>
              <p className="pt-2 font-semibold">Exames:</p>
              <ul className="list-disc pl-4">
                {exames.map((exame, idx) => (
                  <li key={idx}>
                    {exame.nome || "(sem nome)"} — {exame.valor || "-"}{" "}
                    {exame.unidade === "Outro"
                      ? exame.outraUnidade
                      : exame.unidade || ""}{" "}
                    — Ref: {exame.valorReferencia || "-"}
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

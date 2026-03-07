
'use client'

import { useState } from 'react';
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Textarea } from "@/app/_components/ui/textarea";
import { Edit, Trash2, Save, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog"

interface Anotacao {
  id: string;
  anotacao: string;
}

interface AnotacoesCardProps {
  anotacoes: Anotacao[];
  novaAnotacaoContent: string;
  setNovaAnotacaoContent: (value: string) => void;
  handleAdicionarAnotacao: () => void;
  handleDeleteAnotacao: (anotacaoId: string) => void;
  handleUpdateAnotacao: (anotacaoId: string, newContent: string) => void;
}

const AnotacoesCard = ({ 
  anotacoes, 
  novaAnotacaoContent, 
  setNovaAnotacaoContent, 
  handleAdicionarAnotacao, 
  handleDeleteAnotacao,
  handleUpdateAnotacao
}: AnotacoesCardProps) => {
  const [editingAnotacaoId, setEditingAnotacaoId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const handleEditClick = (anotacao: Anotacao) => {
    setEditingAnotacaoId(anotacao.id);
    setEditText(anotacao.anotacao);
  };

  const handleCancelEdit = () => {
    setEditingAnotacaoId(null);
    setEditText("");
  };

  const handleSaveEdit = (anotacaoId: string) => {
    if (editText.trim()) {
        handleUpdateAnotacao(anotacaoId, editText);
    }
    handleCancelEdit();
  };

  return (
    <>
      {anotacoes.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Anotações</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {anotacoes.map((anotacao) => (
                <li key={anotacao.id} className="flex flex-col p-3 rounded-lg">
                  {editingAnotacaoId === anotacao.id ? (
                    <div className="space-y-2">
                        <Textarea 
                            value={editText} 
                            onChange={(e) => setEditText(e.target.value)} 
                            className="bg-white dark:bg-slate-950"
                        />
                        <div className="flex justify-end space-x-2">
                            <Button onClick={() => handleSaveEdit(anotacao.id)} size="sm">
                                <Save className="h-4 w-4 mr-2" /> Salvar
                            </Button>
                            <Button onClick={handleCancelEdit} variant="ghost" size="sm">
                                <X className="h-4 w-4 mr-2" /> Cancelar
                            </Button>
                        </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <p className="flex-1 whitespace-pre-wrap break-words pr-4">{anotacao.anotacao}</p>
                      <div className="flex items-center space-x-2">
                        <Button onClick={() => handleEditClick(anotacao)} variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso irá apagar permanentemente a anotação.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteAnotacao(anotacao.id)}>Apagar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader><CardTitle>Nova Anotação</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <Textarea 
            placeholder="Fazer anotações ..." 
            value={novaAnotacaoContent} 
            onChange={(e) => setNovaAnotacaoContent(e.target.value)} 
          />
          <Button onClick={handleAdicionarAnotacao}>Salvar</Button>
        </CardContent>
      </Card>
    </>
  );
};

export default AnotacoesCard;

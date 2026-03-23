"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

type Time = { id: number; nome: string };
type IntegranteTime = { time: Time };
type Integrante = { id: number; nome: string; ativo: boolean; times: IntegranteTime[] };

export default function IntegrantesPage() {
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [allTimes, setAllTimes] = useState<Time[]>([]);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(true);

  // Edição inline
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEditando, setNomeEditando] = useState("");

  // Confirmação inline (toggle ativo)
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  // Gerenciamento de times do integrante
  const [gerenciandoIntegrante, setGerenciandoIntegrante] = useState<Integrante | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<number[]>([]);

  useEffect(() => { 
    loadData(); 
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [integrantesRes, timesRes] = await Promise.all([
        fetch("/api/integrantes?todos=true"),
        fetch("/api/times")
      ]);
      const integrantesData = await integrantesRes.json();
      const timesData = await timesRes.json();
      
      setIntegrantes([...integrantesData].sort((a: Integrante, b: Integrante) => a.nome.localeCompare(b.nome, "pt-BR")));
      setAllTimes(timesData);
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function addIntegrante(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    try {
      const res = await fetch("/api/integrantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });
      if (!res.ok) { throw new Error("Erro") }
      setNome("");
      toast.success("Integrante adicionado!");
      loadData();
    } catch {
      toast.error("Erro ao adicionar integrante");
    }
  }

  async function salvarNome(id: number) {
    if (!nomeEditando.trim()) return;
    try {
      const res = await fetch("/api/integrantes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nome: nomeEditando }),
      });
      if (!res.ok) { throw new Error("Erro") }
      toast.success("Nome atualizado!");
      setEditandoId(null);
      loadData();
    } catch {
      toast.error("Erro ao salvar nome");
    }
  }

  async function toggleAtivo(id: number, ativo: boolean) {
    try {
      await fetch("/api/integrantes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ativo: !ativo }),
      });
      toast.success(ativo ? "Integrante desativado" : "Integrante ativado");
      setConfirmandoId(null);
      loadData();
    } catch {
      toast.error("Erro ao atualizar integrante");
    }
  }

  const openTimesManager = (integrante: Integrante) => {
    setGerenciandoIntegrante(integrante);
    setSelectedTimes(integrante.times?.map(t => t.time.id) || []);
  };

  const saveTimesManager = async () => {
    if (!gerenciandoIntegrante) return;
    
    // Regra: max 2 times
    if (selectedTimes.length > 2) {
      toast.error("Um integrante pode estar vinculado a no máximo dois times");
      return;
    }

    try {
      const res = await fetch("/api/integrantes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: gerenciandoIntegrante.id, times_ids: selectedTimes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar times");
      toast.success("Times atualizados com sucesso!");
      setGerenciandoIntegrante(null);
      loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display text-primary mb-6">Integrantes</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle>Adicionar Integrante</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addIntegrante} className="flex gap-3">
            <Input
              placeholder="Nome do integrante"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lista de Integrantes</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : integrantes.length === 0 ? (
            <p className="text-muted-foreground">Nenhum integrante cadastrado</p>
          ) : (
            <div className="space-y-4">
              {integrantes.map((integrante) => (
                <div key={integrante.id} className="border rounded-lg p-3 space-y-2 shadow-sm">
                  {/* Linha principal */}
                  <div className="flex items-center gap-3">
                    {editandoId === integrante.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={nomeEditando}
                          onChange={(e) => setNomeEditando(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") salvarNome(integrante.id);
                            if (e.key === "Escape") setEditandoId(null);
                          }}
                          className="h-8 flex-1"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => salvarNome(integrante.id)}>
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditandoId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium flex-1 text-lg">{integrante.nome}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={integrante.ativo ? "default" : "secondary"}>
                            {integrante.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openTimesManager(integrante)}
                            title="Gerenciar os times do participante"
                          >
                            Times ({integrante.times?.length || 0}/2)
                          </Button>

                          <button
                            onClick={() => { setEditandoId(integrante.id); setNomeEditando(integrante.nome); setConfirmandoId(null); }}
                            className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                            title="Editar nome"
                          >
                            ✏️
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Renderizando as Etiquetas (Tags) de Times */}
                  {integrante.times && integrante.times.length > 0 && (
                     <div className="flex flex-wrap gap-2 pt-1">
                       {integrante.times.map((it) => (
                         <Badge key={it.time.id} variant="outline" className="bg-primary/5 text-primary border-primary/20">
                           {it.time.nome}
                         </Badge>
                       ))}
                     </div>
                  )}

                  {/* Confirmação de toggle */}
                  {editandoId !== integrante.id && (
                    confirmandoId === integrante.id ? (
                      <div className="flex items-center gap-2 pt-2 border-t mt-2">
                        <span className="text-sm text-muted-foreground flex-1">
                          {integrante.ativo ? "Desativar este integrante?" : "Ativar este integrante?"}
                        </span>
                        <Button
                          size="sm"
                          variant={integrante.ativo ? "destructive" : "default"}
                          onClick={() => toggleAtivo(integrante.id, integrante.ativo)}
                        >
                          Confirmar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmandoId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end border-t pt-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={() => { setConfirmandoId(integrante.id); setEditandoId(null); }}
                        >
                          {integrante.ativo ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Gerenciar Times */}
      <Dialog open={!!gerenciandoIntegrante} onOpenChange={(open) => !open && setGerenciandoIntegrante(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Times</DialogTitle>
            <DialogDescription>
              Selecione até 2 times para <strong className="text-foreground">{gerenciandoIntegrante?.nome}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto space-y-2 py-4 border-y my-2 px-1">
            {allTimes.map((time) => {
              const isChecked = selectedTimes.includes(time.id);
              const isDisabled = !isChecked && selectedTimes.length >= 2;
              return (
                <label 
                  key={time.id} 
                  className={`flex items-center p-2 rounded-md border border-transparent transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50 hover:border-border cursor-pointer'}`}
                 >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={(e) => {
                         if (e.target.checked) setSelectedTimes([...selectedTimes, time.id]);
                         else setSelectedTimes(selectedTimes.filter(id => id !== time.id));
                      }}
                      className="w-4 h-4 rounded border-primary ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed"
                    />
                    <span>{time.nome}</span>
                  </div>
                </label>
              );
            })}
            {allTimes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum time cadastrado.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGerenciandoIntegrante(null)}>Cancelar</Button>
            <Button onClick={saveTimesManager}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

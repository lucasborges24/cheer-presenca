"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

type Integrante = { id: number; nome: string; ativo: boolean };
type TimeIntegrante = { integrante: Integrante };
type Time = { id: number; nome: string; criado_em: string; integrantes: TimeIntegrante[] };

export default function TimesPage() {
  const [times, setTimes] = useState<Time[]>([]);
  const [allIntegrantes, setAllIntegrantes] = useState<Integrante[]>([]);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(true);

  // Edição inline
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEditando, setNomeEditando] = useState("");

  // Confirmação de exclusão
  const [confirmandoDeleteId, setConfirmandoDeleteId] = useState<number | null>(null);

  // Gerenciamento de participantes
  const [gerenciandoTime, setGerenciandoTime] = useState<Time | null>(null);
  const [selectedIntegrantes, setSelectedIntegrantes] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [timesRes, integrantesRes] = await Promise.all([
        fetch("/api/times"),
        fetch("/api/integrantes?todos=true"),
      ]);
      const timesData = await timesRes.json();
      const integrantesData = await integrantesRes.json();
      setTimes(timesData);
      setAllIntegrantes(integrantesData);
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function addTime(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    try {
      const res = await fetch("/api/times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });
      if (!res.ok) { throw new Error("Erro"); }
      setNome("");
      toast.success("Time adicionado!");
      loadData();
    } catch {
      toast.error("Erro ao adicionar time");
    }
  }

  async function salvarNome(id: number) {
    if (!nomeEditando.trim()) return;
    try {
      const res = await fetch("/api/times", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nome: nomeEditando }),
      });
      if (!res.ok) throw new Error("Erro");
      toast.success("Nome atualizado!");
      setEditandoId(null);
      loadData();
    } catch {
      toast.error("Erro ao salvar nome");
    }
  }

  async function deletarTime(id: number) {
    try {
      const res = await fetch(`/api/times?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro");
      toast.success("Time excluído com sucesso");
      setConfirmandoDeleteId(null);
      loadData();
    } catch {
      toast.error("Erro ao excluir time");
    }
  }

  const openManager = (time: Time) => {
    setGerenciandoTime(time);
    setSelectedIntegrantes(time.integrantes.map(i => i.integrante.id));
  };

  const saveManager = async () => {
    if (!gerenciandoTime) return;
    try {
      const res = await fetch("/api/times", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: gerenciandoTime.id, integrantes_ids: selectedIntegrantes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar participantes");
      toast.success("Participantes atualizados!");
      setGerenciandoTime(null);
      loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <h1 className="text-2xl font-display text-primary mb-6">Times</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle>Adicionar Time</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addTime} className="flex gap-3">
            <Input
              placeholder="Nome do time"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lista de Times</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : times.length === 0 ? (
            <p className="text-muted-foreground">Nenhum time cadastrado</p>
          ) : (
            <div className="space-y-4">
              {times.map((time) => (
                <div key={time.id} className="border rounded-lg p-4 space-y-3 shadow-sm">
                  {/* Linha principal */}
                  <div className="flex items-center gap-3">
                    {editandoId === time.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={nomeEditando}
                          onChange={(e) => setNomeEditando(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") salvarNome(time.id);
                            if (e.key === "Escape") setEditandoId(null);
                          }}
                          className="h-8 flex-1"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => salvarNome(time.id)}>Salvar</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditandoId(null)}>Cancelar</Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold text-lg flex-1">{time.nome}</span>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openManager(time)}>
                            Gerenciar Participantes ({time.integrantes.length})
                          </Button>
                          <button
                            onClick={() => { setEditandoId(time.id); setNomeEditando(time.nome); setConfirmandoDeleteId(null); }}
                            className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                            title="Editar time"
                          >
                            ✏️
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Participantes tags */}
                  {time.integrantes.length > 0 && (
                     <div className="flex flex-wrap gap-2 pt-2">
                       {time.integrantes.map((ti) => (
                         <Badge key={ti.integrante.id} variant="secondary">
                           {ti.integrante.nome}
                         </Badge>
                       ))}
                     </div>
                  )}

                  {/* Confirmação de exclusão */}
                  {editandoId !== time.id && (
                    confirmandoDeleteId === time.id ? (
                      <div className="flex items-center gap-2 pt-3 border-t mt-3">
                        <span className="text-sm text-destructive font-medium flex-1">
                          Excluir este time permanentemente? Os participantes vinculados perderão este vínculo.
                        </span>
                        <Button size="sm" variant="destructive" onClick={() => deletarTime(time.id)}>Confirmar</Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmandoDeleteId(null)}>Cancelar</Button>
                      </div>
                    ) : (
                      <div className="flex justify-end border-t pt-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive text-xs h-7"
                          onClick={() => { setConfirmandoDeleteId(time.id); setEditandoId(null); }}
                        >
                          Excluir Time
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

      <Dialog open={!!gerenciandoTime} onOpenChange={(open) => !open && setGerenciandoTime(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Participantes</DialogTitle>
            <DialogDescription>
              Selecione os participantes que farão parte do time <strong className="text-foreground">{gerenciandoTime?.nome}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto space-y-2 py-4 border-y my-2 px-1">
            {allIntegrantes.map((integrante) => (
              <label 
                key={integrante.id} 
                className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md cursor-pointer border border-transparent hover:border-border transition-colors"
               >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIntegrantes.includes(integrante.id)}
                    onChange={(e) => {
                       if (e.target.checked) setSelectedIntegrantes([...selectedIntegrantes, integrante.id]);
                       else setSelectedIntegrantes(selectedIntegrantes.filter(id => id !== integrante.id));
                    }}
                    className="w-4 h-4 rounded border-primary ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  <span className={!integrante.ativo ? "text-muted-foreground line-through" : ""}>
                    {integrante.nome}
                  </span>
                </div>
                {!integrante.ativo && <Badge variant="outline" className="text-[10px]">Inativo</Badge>}
              </label>
            ))}
            {allIntegrantes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum participante encontrado.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGerenciandoTime(null)}>Cancelar</Button>
            <Button onClick={saveManager}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

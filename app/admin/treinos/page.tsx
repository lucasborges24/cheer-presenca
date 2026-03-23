"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type Integrante = { id: number; nome: string };
type Time = { 
  id: number; 
  nome: string;
  integrantes: { integrante_id: number; time_id: number }[];
};
type Treino = { id: number; data: string; descricao: string; horario_inicio: string };
type Presenca = { id: number; integrante_nome: string; horario_checkin: string; atrasado: boolean };

const HORARIOS_RAPIDOS = ["09:00", "10:00", "19:30"];

function dataLocal(offsetDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function proximoDiaSemana(diaSemana: number): string {
  const d = new Date();
  const atual = d.getDay();
  let diff = diaSemana - atual;
  if (diff <= 0) diff += 7;
  d.setDate(d.getDate() + diff);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export default function TreinosPage() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [times, setTimes] = useState<Time[]>([]);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());

  const [data, setData] = useState(dataLocal());
  const [descricao, setDescricao] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [loading, setLoading] = useState(true);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [descricaoEditando, setDescricaoEditando] = useState("");

  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  const [dialogAberto, setDialogAberto] = useState(false);
  const [presencasVinculadas, setPresencasVinculadas] = useState<Presenca[]>([]);
  const [treinoParaExcluir, setTreinoParaExcluir] = useState<number | null>(null);

  useEffect(() => { loadDados(); }, []);

  async function loadDados() {
    try {
      const [resT, resI, resTm] = await Promise.all([
        fetch("/api/treinos"),
        fetch("/api/integrantes"),
        fetch("/api/times")
      ]);
      const treinosData = await resT.json();
      setTreinos(treinosData);
      
      const intsData = await resI.json();
      setIntegrantes(intsData);
      
      const timesData = await resTm.json();
      setTimes(timesData);
      
      setSelecionados(new Set(intsData.map((i: Integrante) => i.id)));
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function loadTreinosOnly() {
    try {
      const res = await fetch("/api/treinos");
      setTreinos(await res.json());
    } catch {
      toast.error("Erro ao carregar treinos");
    }
  }

  async function addTreino(e: React.FormEvent) {
    e.preventDefault();
    if (!data || !descricao.trim() || !horarioInicio) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (selecionados.size === 0) {
      toast.error("Selecione ao menos um participante");
      return;
    }

    try {
      const res = await fetch("/api/treinos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          data, 
          descricao, 
          horario_inicio: horarioInicio,
          integrantesIds: Array.from(selecionados) 
        }),
      });
      if (!res.ok) { toast.error("Erro ao adicionar treino"); return; }
      setDescricao("");
      setHorarioInicio("");
      toast.success("Treino adicionado!");
      loadTreinosOnly();
    } catch {
      toast.error("Erro ao adicionar treino");
    }
  }

  async function salvarDescricao(id: number) {
    if (!descricaoEditando.trim()) return;
    try {
      const res = await fetch("/api/treinos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, descricao: descricaoEditando }),
      });
      if (!res.ok) { toast.error("Erro ao salvar"); return; }
      toast.success("Descrição atualizada!");
      setEditandoId(null);
      loadTreinosOnly();
    } catch {
      toast.error("Erro ao salvar descrição");
    }
  }

  async function handlePreDelete(id: number) {
    try {
      const res = await fetch(`/api/presenca?treino_id=${id}`);
      if (!res.ok) throw new Error("Erro ao buscar presenças");
      
      const presencas: Presenca[] = await res.json();
      
      if (presencas.length > 0) {
        setPresencasVinculadas(presencas);
        setTreinoParaExcluir(id);
        setConfirmandoId(null);
        setDialogAberto(true);
      } else {
        deleteTreino(id, false);
      }
    } catch {
      toast.error("Erro ao verificar presenças vinculadas");
    }
  }

  async function deleteTreino(id: number, force: boolean = false) {
    try {
      const res = await fetch(`/api/treinos?id=${id}&force=${force}`, { method: "DELETE" });
      
      if (!res.ok) {
        const bdData = await res.json();
        toast.error(bdData.error || "Erro ao excluir treino");
        return;
      }
      
      toast.success("Treino excluído");
      setConfirmandoId(null);
      setDialogAberto(false);
      setTreinoParaExcluir(null);
      loadTreinosOnly();
    } catch {
      toast.error("Erro ao excluir treino");
    }
  }

  function toggleTime(timeId: number) {
    const time = times.find(t => t.id === timeId);
    if (!time) return;
    const idsTime = time.integrantes.map(it => it.integrante_id);
    const todosDoTimeSelecionados = idsTime.every(id => selecionados.has(id));

    setSelecionados(prev => {
      const next = new Set(prev);
      idsTime.forEach(id => {
        if (todosDoTimeSelecionados) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  }

  function toggleIntegrante(id: number) {
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display text-primary mb-6">Treinos</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle>Novo Treino</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addTreino} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-2 block">Data</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { label: "Hoje", valor: dataLocal() },
                  { label: "Próx. domingo", valor: proximoDiaSemana(0) },
                  { label: "Próx. terça", valor: proximoDiaSemana(2) },
                  { label: "Próx. quinta", valor: proximoDiaSemana(4) },
                ].map(({ label, valor }) => (
                  <Button
                    key={label}
                    type="button"
                    size="sm"
                    variant={data === valor ? "default" : "outline"}
                    onClick={() => setData(valor)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="cursor-pointer w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Horário de Início</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {HORARIOS_RAPIDOS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHorarioInicio(h)}
                    className={`cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      horarioInicio === h
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-input text-foreground hover:bg-muted"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
              <input
                type="time"
                value={horarioInicio}
                onChange={(e) => setHorarioInicio(e.target.value)}
                lang="pt-BR"
                className="cursor-pointer w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Descricao</label>
              <Input
                placeholder="Ex: Treino de stunts"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium block">Participantes ({selecionados.size}/{integrantes.length})</label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelecionados(new Set(integrantes.map(i => i.id)))}>Todos</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelecionados(new Set())}>Nenhum</Button>
                </div>
              </div>
              
              <div className="mb-3 flex flex-wrap gap-2">
                {times.map(t => {
                  const idsTime = t.integrantes.map(it => it.integrante_id);
                  const todosSel = idsTime.length > 0 && idsTime.every(id => selecionados.has(id));
                  return (
                    <Badge 
                      key={t.id} 
                      className="cursor-pointer"
                      variant={todosSel ? "default" : "outline"}
                      onClick={() => toggleTime(t.id)}
                    >
                      Time {t.nome}
                    </Badge>
                  );
                })}
              </div>

              <div className="max-h-48 overflow-y-auto border rounded-md p-2 bg-muted/20">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                  {integrantes.map(i => (
                    <label key={i.id} className="flex items-center gap-2 text-sm p-1 rounded hover:bg-muted cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={selecionados.has(i.id)} 
                        onChange={() => toggleIntegrante(i.id)} 
                        className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                      {i.nome}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full">Adicionar Treino</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Treinos Cadastrados</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : treinos.length === 0 ? (
            <p className="text-muted-foreground">Nenhum treino cadastrado</p>
          ) : (
            <div className="space-y-2">
              {treinos.map((treino) => (
                <div key={treino.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-3">
                    {editandoId === treino.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={descricaoEditando}
                          onChange={(e) => setDescricaoEditando(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") salvarDescricao(treino.id);
                            if (e.key === "Escape") setEditandoId(null);
                          }}
                          className="h-8 flex-1"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => salvarDescricao(treino.id)}>Salvar</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditandoId(null)}>Cancelar</Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <span className="font-medium">{treino.descricao}</span>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary">
                              {new Date(treino.data + "T12:00:00").toLocaleDateString("pt-BR", {
                                weekday: "short", day: "2-digit", month: "short",
                              })}
                            </Badge>
                            <Badge variant="outline">{treino.horario_inicio.slice(0, 5)}</Badge>
                          </div>
                        </div>
                        <button
                          onClick={() => { setEditandoId(treino.id); setDescricaoEditando(treino.descricao); setConfirmandoId(null); }}
                          className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-1 rounded mt-0.5"
                          title="Editar descrição"
                        >
                          ✏️
                        </button>
                      </>
                    )}
                  </div>

                  {editandoId !== treino.id && (
                    confirmandoId === treino.id ? (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <span className="text-sm text-muted-foreground flex-1">
                          Excluir este treino permanentemente?
                        </span>
                        <Button size="sm" variant="destructive" onClick={() => handlePreDelete(treino.id)}>
                          Confirmar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmandoId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:border-destructive"
                          onClick={() => { setConfirmandoId(treino.id); setEditandoId(null); }}
                        >
                          Excluir
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
      
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir treino com presenças vinculadas</DialogTitle>
            <DialogDescription>
              Este treino possui {presencasVinculadas.length} presença(s) vinculada(s). Ao excluir o treino, todas essas presenças serão apagadas. Deseja excluir mesmo assim?
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-60 overflow-y-auto mt-4 px-2">
            <ul className="list-disc list-inside space-y-1">
              {presencasVinculadas.map(p => (
                <li key={p.id} className="text-sm text-foreground flex justify-between">
                  <span>{p.integrante_nome}</span>
                  <Badge variant={p.horario_checkin ? "secondary" : "outline"}>
                    {p.horario_checkin ? "Presente" : "Esperado"}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDialogAberto(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => treinoParaExcluir && deleteTreino(treinoParaExcluir, true)}>
              Apagar tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

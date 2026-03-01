"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Treino = { id: number; data: string; descricao: string; horario_inicio: string };

const HORARIOS_RAPIDOS = ["09:00", "10:00", "19:30"];

function dataLocal(offsetDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

// Retorna yyyy-mm-dd do próximo dia da semana (0=dom, 2=ter, 4=qui)
// Sempre avança para a próxima ocorrência (nunca hoje)
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
  const [data, setData] = useState(dataLocal());
  const [descricao, setDescricao] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [loading, setLoading] = useState(true);

  // Edição inline de descrição
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [descricaoEditando, setDescricaoEditando] = useState("");

  // Confirmação de exclusão
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  useEffect(() => { loadTreinos(); }, []);

  async function loadTreinos() {
    try {
      const res = await fetch("/api/treinos");
      setTreinos(await res.json());
    } catch {
      toast.error("Erro ao carregar treinos");
    } finally {
      setLoading(false);
    }
  }

  async function addTreino(e: React.FormEvent) {
    e.preventDefault();
    if (!data || !descricao.trim() || !horarioInicio) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      const res = await fetch("/api/treinos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, descricao, horario_inicio: horarioInicio }),
      });
      if (!res.ok) { toast.error("Erro ao adicionar treino"); return; }
      setDescricao("");
      setHorarioInicio("");
      toast.success("Treino adicionado!");
      loadTreinos();
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
      loadTreinos();
    } catch {
      toast.error("Erro ao salvar descrição");
    }
  }

  async function deleteTreino(id: number) {
    try {
      await fetch(`/api/treinos?id=${id}`, { method: "DELETE" });
      toast.success("Treino excluído");
      setConfirmandoId(null);
      loadTreinos();
    } catch {
      toast.error("Erro ao excluir treino");
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display text-primary mb-6">Treinos</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle>Novo Treino</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addTreino} className="space-y-5">

            {/* Data */}
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
              {data && (
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(data + "T12:00:00").toLocaleDateString("pt-BR", {
                    weekday: "long", day: "2-digit", month: "long",
                  })}
                </p>
              )}
            </div>

            {/* Horário */}
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

            {/* Descrição */}
            <div>
              <label className="text-sm font-medium mb-2 block">Descrição</label>
              <Input
                placeholder="Ex: Treino de stunts"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
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
                  {/* Linha principal */}
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

                  {/* Confirmação de exclusão */}
                  {editandoId !== treino.id && (
                    confirmandoId === treino.id ? (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <span className="text-sm text-muted-foreground flex-1">
                          Excluir este treino permanentemente?
                        </span>
                        <Button size="sm" variant="destructive" onClick={() => deleteTreino(treino.id)}>
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
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Integrante = { id: number; nome: string; ativo: boolean };

export default function IntegrantesPage() {
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(true);

  // Edição inline
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEditando, setNomeEditando] = useState("");

  // Confirmação inline (toggle ativo)
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  useEffect(() => { loadIntegrantes(); }, []);

  async function loadIntegrantes() {
    try {
      const res = await fetch("/api/integrantes?todos=true");
      const data = await res.json();
      setIntegrantes([...data].sort((a: Integrante, b: Integrante) => a.nome.localeCompare(b.nome, "pt-BR")));
    } catch {
      toast.error("Erro ao carregar integrantes");
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
      if (!res.ok) { toast.error("Erro ao adicionar integrante"); return; }
      setNome("");
      toast.success("Integrante adicionado!");
      loadIntegrantes();
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
      if (!res.ok) { toast.error("Erro ao salvar nome"); return; }
      toast.success("Nome atualizado!");
      setEditandoId(null);
      loadIntegrantes();
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
      loadIntegrantes();
    } catch {
      toast.error("Erro ao atualizar integrante");
    }
  }

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
            <div className="space-y-2">
              {integrantes.map((integrante) => (
                <div key={integrante.id} className="border rounded-lg p-3 space-y-2">
                  {/* Linha principal */}
                  <div className="flex items-center gap-3">
                    {editandoId === integrante.id ? (
                      /* Modo edição */
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
                      /* Modo visualização */
                      <>
                        <span className="font-medium flex-1">{integrante.nome}</span>
                        <Badge variant={integrante.ativo ? "default" : "secondary"}>
                          {integrante.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        <button
                          onClick={() => { setEditandoId(integrante.id); setNomeEditando(integrante.nome); setConfirmandoId(null); }}
                          className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                          title="Editar nome"
                        >
                          ✏️
                        </button>
                      </>
                    )}
                  </div>

                  {/* Confirmação de toggle */}
                  {editandoId !== integrante.id && (
                    confirmandoId === integrante.id ? (
                      <div className="flex items-center gap-2 pt-1 border-t">
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
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
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
    </div>
  );
}

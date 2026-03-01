"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Config = {
  id: number;
  nome_criterio: string;
  descricao_criterio: string;
  limiar_presenca: number;
  limiar_pontualidade: number;
};

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Form state espelhando config
  const [nomeCriterio, setNomeCriterio] = useState("");
  const [descricaoCriterio, setDescricaoCriterio] = useState("");
  const [limiarPresenca, setLimiarPresenca] = useState(75);
  const [limiarPontualidade, setLimiarPontualidade] = useState(0);

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    try {
      const res = await fetch("/api/config");
      const data: Config = await res.json();
      setConfig(data);
      setNomeCriterio(data.nome_criterio);
      setDescricaoCriterio(data.descricao_criterio);
      setLimiarPresenca(data.limiar_presenca);
      setLimiarPontualidade(data.limiar_pontualidade);
    } catch {
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_criterio: nomeCriterio,
          descricao_criterio: descricaoCriterio,
          limiar_presenca: limiarPresenca,
          limiar_pontualidade: limiarPontualidade,
        }),
      });
      if (!res.ok) { toast.error("Erro ao salvar"); return; }
      const data = await res.json();
      setConfig(data);
      toast.success("Configurações salvas!");
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSalvando(false);
    }
  }

  // Preview dinâmico: exemplos de integrantes com diferentes situações
  const exemplos = [
    { nome: "Ana Lima", presenca: 100, pontualidade: 100 },
    { nome: "Bruno Melo", presenca: 80, pontualidade: 60 },
    { nome: "Carla Dias", presenca: 60, pontualidade: 100 },
    { nome: "Diego Costa", presenca: 40, pontualidade: 50 },
  ];

  function computaElegivel(presenca: number, pont: number) {
    const atingeP = presenca >= limiarPresenca;
    const atingePont = limiarPontualidade === 0 || pont >= limiarPontualidade;
    return atingeP && atingePont;
  }

  if (loading) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display text-primary mb-6">Configurações</h1>

      <form onSubmit={salvar} className="space-y-5">
        {/* ── Critério de elegibilidade ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Critério de Elegibilidade</CardTitle>
            <p className="text-sm text-muted-foreground">
              Define quem aparece como elegível no relatório mensal. Um integrante é elegível
              quando atinge o mínimo de presença <strong>e</strong> (se configurado) o mínimo
              de pontualidade.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Nome do badge */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Nome do selo
                <span className="text-muted-foreground font-normal ml-1">
                  — aparece no badge verde na tabela
                </span>
              </label>
              <Input
                value={nomeCriterio}
                onChange={(e) => setNomeCriterio(e.target.value)}
                placeholder="Ex: Elegível para desconto"
                maxLength={40}
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Descrição curta
                <span className="text-muted-foreground font-normal ml-1">
                  — exibida como legenda na tela de configurações
                </span>
              </label>
              <Input
                value={descricaoCriterio}
                onChange={(e) => setDescricaoCriterio(e.target.value)}
                placeholder="Ex: Mínimo 75% de presença no mês"
                maxLength={80}
              />
            </div>

            {/* Limiar de presença */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Mínimo de presença
                <span className="text-2xl font-bold text-primary ml-2">{limiarPresenca}%</span>
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Porcentagem mínima de treinos no mês que o integrante deve ter comparecido.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={limiarPresenca}
                  onChange={(e) => setLimiarPresenca(Number(e.target.value))}
                  className="cursor-pointer flex-1 accent-primary"
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={limiarPresenca}
                  onChange={(e) => setLimiarPresenca(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-20 text-center"
                />
              </div>
            </div>

            {/* Limiar de pontualidade */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Mínimo de pontualidade
                <span className="text-2xl font-bold text-primary ml-2">{limiarPontualidade}%</span>
                {limiarPontualidade === 0 && (
                  <span className="text-xs text-muted-foreground ml-2">(não exigida)</span>
                )}
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Porcentagem mínima de chegadas no horário (dentre as presenças). Zero = pontualidade não é critério.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={limiarPontualidade}
                  onChange={(e) => setLimiarPontualidade(Number(e.target.value))}
                  className="cursor-pointer flex-1 accent-primary"
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={limiarPontualidade}
                  onChange={(e) => setLimiarPontualidade(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-20 text-center"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Preview ───────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Preview — como ficará no relatório</CardTitle>
            <p className="text-sm text-muted-foreground">{descricaoCriterio || nomeCriterio}</p>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left pb-2">Integrante</th>
                  <th className="text-center pb-2">Presença</th>
                  <th className="text-center pb-2">Pontualidade</th>
                  <th className="text-right pb-2">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {exemplos.map((ex) => {
                  const elegivel = computaElegivel(ex.presenca, ex.pontualidade);
                  return (
                    <tr key={ex.nome} className="border-b last:border-0">
                      <td className="py-2 font-medium">{ex.nome}</td>
                      <td className="py-2 text-center">
                        <span className={ex.presenca >= limiarPresenca ? "text-green-600 font-semibold" : "text-red-500"}>
                          {ex.presenca}%
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        {limiarPontualidade === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className={ex.pontualidade >= limiarPontualidade ? "text-green-600 font-semibold" : "text-red-500"}>
                            {ex.pontualidade}%
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        {elegivel ? (
                          <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100">
                            ✓ {nomeCriterio || "Elegível"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </form>
    </div>
  );
}

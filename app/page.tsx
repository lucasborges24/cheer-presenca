"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Integrante = { id: number; nome: string };
type Treino = { id: number; data: string; descricao: string; horario_inicio: string };
type Presenca = { integrante_id: number; atrasado: boolean };
type Confirmacao = { nome: string; atrasado: boolean };

export default function CheckinPage() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [presencasPorTreino, setPresencasPorTreino] = useState<Record<number, Presenca[]>>({});
  const [treinoAtivoId, setTreinoAtivoId] = useState<number | null>(null);
  const [selecionado, setSelecionado] = useState<Record<number, number | null>>({});
  const [salvando, setSalvando] = useState(false);
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null);
  const [mostrarRegistrados, setMostrarRegistrados] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  // Define primeiro treino como ativo assim que carregar
  useEffect(() => {
    if (treinos.length > 0 && !treinoAtivoId) {
      setTreinoAtivoId(treinos[0].id);
    }
  }, [treinos, treinoAtivoId]);

  // Auto-dismiss da confirmação após 3.5s
  useEffect(() => {
    if (!confirmacao) return;
    const t = setTimeout(() => setConfirmacao(null), 3500);
    return () => clearTimeout(t);
  }, [confirmacao]);

  async function loadData() {
    try {
      const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
      const [treinosRes, integrantesRes] = await Promise.all([
        fetch(`/api/treinos?data=${hoje}`),
        fetch("/api/integrantes"),
      ]);
      const treinosData: Treino[] = await treinosRes.json();
      const integrantesData: Integrante[] = await integrantesRes.json();
      setTreinos(treinosData);
      setIntegrantes([...integrantesData].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));

      const map: Record<number, Presenca[]> = {};
      for (const t of treinosData) {
        const r = await fetch(`/api/presenca?treino_id=${t.id}`);
        map[t.id] = await r.json();
      }
      setPresencasPorTreino(map);
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function registrarPresenca() {
    if (!treinoAtivoId) return;
    const integranteId = selecionado[treinoAtivoId];
    if (!integranteId) return;

    setSalvando(true);
    try {
      const res = await fetch("/api/presenca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrante_id: integranteId, treino_id: treinoAtivoId }),
      });

      if (res.status === 409) { toast.warning("Presença já registrada!"); return; }
      if (!res.ok) { toast.error("Erro ao registrar presença"); return; }

      const data: Presenca = await res.json();
      const nome = integrantes.find((i) => i.id === integranteId)?.nome ?? "";

      setPresencasPorTreino((prev) => ({
        ...prev,
        [treinoAtivoId]: [...(prev[treinoAtivoId] ?? []), { integrante_id: integranteId, atrasado: data.atrasado }],
      }));
      setSelecionado((prev) => ({ ...prev, [treinoAtivoId]: null }));
      setMostrarRegistrados(false);
      setConfirmacao({ nome, atrasado: data.atrasado });
    } catch {
      toast.error("Erro ao registrar presença");
    } finally {
      setSalvando(false);
    }
  }

  // ── Dados derivados ──────────────────────────────────────────────────────────
  const treinoAtivo = treinos.find((t) => t.id === treinoAtivoId) ?? null;
  const presencasAtivas = treinoAtivoId ? (presencasPorTreino[treinoAtivoId] ?? []) : [];
  const jaRegistradosIds = new Set(presencasAtivas.map((p) => p.integrante_id));
  const opcoes = integrantes.filter((i) => !jaRegistradosIds.has(i.id));
  const jaPresentes = integrantes.filter((i) => jaRegistradosIds.has(i.id));
  const nomeSelecionado = treinoAtivoId
    ? integrantes.find((i) => i.id === selecionado[treinoAtivoId])?.nome
    : null;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-2xl text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">

      {/* ── Confirmação full-screen ──────────────────────────────────────────── */}
      {confirmacao && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center text-white animate-in fade-in duration-300 ${
            confirmacao.atrasado ? "bg-orange-500" : "bg-[#23ADBA]"
          }`}
        >
          <div className="text-[96px] leading-none mb-5 animate-in zoom-in duration-300">✓</div>
          <p className="text-4xl sm:text-5xl font-display mb-3">Presença registrada!</p>
          <p className="text-2xl sm:text-3xl font-medium opacity-90">{confirmacao.nome}</p>
          {confirmacao.atrasado && (
            <div className="mt-6 bg-white/25 px-6 py-2 rounded-full text-xl">Atrasado</div>
          )}
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="shrink-0 bg-[#152426] px-4 py-3 flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Cheer"
          width={46}
          height={46}
          className="object-contain shrink-0"
          priority
        />
        <span className="font-display text-[#23ADBA] text-lg leading-none whitespace-nowrap hidden sm:block">
          Cheer Presença
        </span>

        {treinoAtivo && (
          <div className="ml-auto flex items-center gap-2 text-sm text-right">
            <span className="font-semibold text-[#F5F5F5]">{treinoAtivo.descricao}</span>
            <span className="text-[#96D3DE]/50">·</span>
            <span className="text-[#96D3DE]">{treinoAtivo.horario_inicio.slice(0, 5)}</span>
            <span className="text-[#96D3DE]/50 hidden sm:block">·</span>
            <span className="text-[#96D3DE] hidden sm:block">
              {new Date(treinoAtivo.data + "T12:00:00").toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              })}
            </span>
          </div>
        )}
      </header>

      {/* ── Tabs (se houver mais de 1 treino no dia) ────────────────────────── */}
      {treinos.length > 1 && (
        <div className="shrink-0 flex gap-2 px-4 pt-3">
          {treinos.map((t) => (
            <button
              key={t.id}
              onClick={() => setTreinoAtivoId(t.id)}
              className={`cursor-pointer px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                treinoAtivoId === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t.descricao}
            </button>
          ))}
        </div>
      )}

      {/* ── Sem treino ──────────────────────────────────────────────────────── */}
      {treinos.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
          <Image
            src="/logo.png"
            alt="Cheer"
            width={80}
            height={80}
            className="object-contain opacity-30"
          />
          <p className="text-xl text-muted-foreground text-center">
            Nenhum treino cadastrado para hoje
          </p>
        </div>
      )}

      {/* ── Grade de nomes (scrollável) ──────────────────────────────────────── */}
      {treinoAtivo && (
        <div className="flex-1 overflow-y-auto px-4 pt-4">
          {opcoes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 py-12">
              <span className="text-5xl">🎉</span>
              <p className="text-2xl font-display text-primary">Todos presentes!</p>
              <p className="text-muted-foreground">Todos os atletas já registraram presença.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {opcoes.map((integrante) => {
                const isSelected = selecionado[treinoAtivo.id] === integrante.id;
                return (
                  <button
                    key={integrante.id}
                    onClick={() =>
                      setSelecionado((prev) => ({
                        ...prev,
                        [treinoAtivo.id]: isSelected ? null : integrante.id,
                      }))
                    }
                    className={`cursor-pointer min-h-[72px] rounded-xl border-2 font-medium text-base sm:text-lg px-3 transition-all active:scale-95 select-none ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground shadow-md scale-[1.02]"
                        : "bg-card border-border text-foreground hover:border-primary/40 hover:shadow-sm"
                    }`}
                  >
                    {integrante.nome}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Já registraram (colapsável) ─────────────────────────────────── */}
          {jaPresentes.length > 0 && (
            <div className="mt-5 mb-2">
              <button
                onClick={() => setMostrarRegistrados((v) => !v)}
                className="cursor-pointer flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <span
                  className={`text-xs transition-transform duration-200 ${
                    mostrarRegistrados ? "rotate-90" : ""
                  }`}
                >
                  ▶
                </span>
                {jaPresentes.length} já registraram presença
              </button>

              {mostrarRegistrados && (
                <div className="mt-2 flex flex-wrap gap-2 pb-2">
                  {jaPresentes.map((i) => {
                    const p = presencasAtivas.find((p) => p.integrante_id === i.id);
                    return (
                      <Badge
                        key={i.id}
                        variant="outline"
                        className={
                          p?.atrasado
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        }
                      >
                        {i.nome}
                        {p?.atrasado ? " (atrasado)" : ""}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Espaço para o botão fixo não cobrir o último card */}
          <div className="h-6" />
        </div>
      )}

      {/* ── Botão fixo no rodapé ─────────────────────────────────────────────── */}
      {treinoAtivo && (
        <div className="shrink-0 px-4 py-3 bg-background border-t shadow-[0_-4px_20px_rgba(0,0,0,0.07)]">
          <button
            disabled={!nomeSelecionado || salvando}
            onClick={registrarPresenca}
            className={`w-full h-[68px] rounded-xl text-xl font-display tracking-wide transition-all select-none ${
              nomeSelecionado && !salvando
                ? "cursor-pointer bg-primary text-primary-foreground shadow-md active:scale-[0.99]"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            {salvando
              ? "Registrando..."
              : nomeSelecionado
              ? `Confirmar — ${nomeSelecionado}`
              : "Selecione seu nome acima"}
          </button>
        </div>
      )}
    </div>
  );
}

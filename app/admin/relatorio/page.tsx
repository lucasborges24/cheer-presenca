"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type DetalhePresenca = {
  treino_id: number;
  data: string;
  descricao: string;
  horario_inicio: string;
  presente: boolean;
  horario_checkin: string | null;
  atrasado: boolean | null;
};

type RelatorioItem = {
  id: number;
  nome: string;
  ativo: boolean;
  total_presencas: number;
  faltas: number;
  no_horario: number;
  atrasados: number;
  percentual_pontualidade: number;
  percentual_frequencia: number;
  total_treinos: number;
  elegivel: boolean;
  detalhes: DetalhePresenca[];
};

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function formatHora(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  });
}

function formatData(yyyyMmDd: string): string {
  return new Date(yyyyMmDd + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit",
  });
}

const columnHelper = createColumnHelper<RelatorioItem>();

export default function RelatorioPage() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [dados, setDados] = useState<RelatorioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // ── Colunas (dependem de expandedId para o chevron) ──────────────────────
  const columns = useMemo(
    () => [
      columnHelper.accessor("nome", {
        header: "Nome",
        cell: (info) => {
          const isOpen = expandedId === info.row.original.id;
          return (
            <div className="flex items-center gap-2 font-medium">
              <span className={`text-[10px] text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
                ▶
              </span>
              {info.getValue()}
              {!info.row.original.ativo && (
                <span className="text-xs text-muted-foreground">(inativo)</span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("total_presencas", {
        header: "Presenças",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("faltas", {
        header: "Faltas",
        cell: (info) => (
          <span className={info.getValue() > 0 ? "text-red-600 font-semibold" : ""}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("no_horario", {
        header: "No Horário",
        cell: (info) => (
          <Badge className="bg-green-600 hover:bg-green-700 text-white">{info.getValue()}</Badge>
        ),
      }),
      columnHelper.accessor("atrasados", {
        header: "Atrasados",
        cell: (info) => (
          <Badge variant="destructive">{info.getValue()}</Badge>
        ),
      }),
      columnHelper.accessor("percentual_pontualidade", {
        header: "Pontualidade",
        cell: (info) => {
          const v = info.getValue();
          return (
            <span className={v === 100 ? "text-green-700 font-semibold" : v < 50 && info.row.original.total_presencas > 0 ? "text-red-600 font-semibold" : ""}>
              {v}%
            </span>
          );
        },
      }),
      columnHelper.accessor("elegivel", {
        header: "Elegível",
        cell: (info) =>
          info.getValue() ? (
            <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100">
              ✓ Sim
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
      }),
    ],
    [expandedId]
  );

  const table = useReactTable({
    data: dados,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => { loadRelatorio(); }, [mes, ano]); // eslint-disable-line

  async function loadRelatorio() {
    setLoading(true);
    setExpandedId(null);
    try {
      const res = await fetch(`/api/relatorio?mes=${mes}&ano=${ano}`);
      setDados(await res.json());
    } catch {
      toast.error("Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  }

  // ── Resumo geral ─────────────────────────────────────────────────────────
  const resumo = useMemo(() => {
    if (!dados.length) return null;
    const numTreinos = dados[0].total_treinos;
    const totalP = dados.reduce((s, d) => s + d.total_presencas, 0);
    const totalNH = dados.reduce((s, d) => s + d.no_horario, 0);
    const possivel = numTreinos * dados.length;
    return {
      integrantes: dados.length,
      treinos: numTreinos,
      frequencia: possivel > 0 ? Math.round((totalP / possivel) * 100) : 0,
      pontualidade: totalP > 0 ? Math.round((totalNH / totalP) * 100) : 0,
    };
  }, [dados]);

  // ── Export CSV ───────────────────────────────────────────────────────────
  function exportarCSV() {
    const headers = ["Nome","Presenças","Faltas","No Horário","Atrasados","Pontualidade (%)","Elegível"];
    const linhas = dados.map((d) =>
      [
        `"${d.nome}"`,
        d.total_presencas,
        d.faltas,
        d.no_horario,
        d.atrasados,
        d.percentual_pontualidade,
        d.elegivel ? "Sim" : "Não",
      ].join(";")
    );
    const csv = [headers.join(";"), ...linhas].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `presenca-${String(mes).padStart(2, "0")}-${ano}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Cor da linha ─────────────────────────────────────────────────────────
  function rowBg(d: RelatorioItem): string {
    if (d.total_treinos === 0) return "";
    if (d.total_presencas === 0) return "bg-red-50";
    if (d.faltas === 0 && d.atrasados === 0) return "bg-green-50";
    if (d.percentual_pontualidade < 50) return "bg-orange-50";
    return "";
  }

  return (
    <div>
      <h1 className="text-2xl font-display text-primary mb-6">Relatório Mensal</h1>

      {/* ── Filtros ─────────────────────────────────────────────────────── */}
      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-sm font-medium mb-1 block">Mês</label>
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="cursor-pointer h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {MESES.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ano</label>
              <Input
                type="number"
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <Button onClick={loadRelatorio} variant="outline">Atualizar</Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Cards de resumo ──────────────────────────────────────────────── */}
      {resumo && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Integrantes", value: resumo.integrantes, icon: "👥" },
            { label: "Treinos no mês", value: resumo.treinos, icon: "📅" },
            { label: "Frequência geral", value: `${resumo.frequencia}%`, icon: "✅" },
            { label: "Pontualidade geral", value: `${resumo.pontualidade}%`, icon: "⏱️" },
          ].map(({ label, value, icon }) => (
            <Card key={label} className="text-center">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-2xl font-bold text-primary">{value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Tabela ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>
              {MESES[mes - 1]} {ano}
              {resumo && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  — clique em um nome para ver o histórico
                </span>
              )}
            </CardTitle>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Buscar integrante..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="max-w-xs"
              />
              <Button variant="outline" size="sm" onClick={exportarCSV} disabled={!dados.length}>
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-4">Carregando...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="cursor-pointer select-none whitespace-nowrap"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? " ↕"}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                        Nenhum dado encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => {
                      const isOpen = expandedId === row.original.id;
                      const bg = rowBg(row.original);

                      return (
                        <Fragment key={row.id}>
                          <TableRow
                            className={`cursor-pointer transition-colors ${bg} hover:brightness-[0.97]`}
                            onClick={() => setExpandedId(isOpen ? null : row.original.id)}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>

                          {/* ── Accordion: histórico individual ──────── */}
                          {isOpen && (
                            <TableRow className={bg}>
                              <TableCell colSpan={columns.length} className="p-0">
                                <div className="px-6 py-4 bg-muted/30 border-t">
                                  <p className="text-sm font-semibold mb-3">
                                    {row.original.nome} — {MESES[mes - 1]} {ano}
                                  </p>
                                  {row.original.detalhes.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Sem treinos neste mês.</p>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm border-collapse">
                                        <thead>
                                          <tr className="border-b text-xs text-muted-foreground">
                                            <th className="text-left pb-2 pr-3 w-6"></th>
                                            <th className="text-left pb-2 pr-4 whitespace-nowrap">Data</th>
                                            <th className="text-left pb-2 pr-4">Treino</th>
                                            <th className="text-center pb-2 pr-4 whitespace-nowrap">Início</th>
                                            <th className="text-center pb-2 pr-4 whitespace-nowrap">Chegada</th>
                                            <th className="text-right pb-2 whitespace-nowrap">Situação</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                      {row.original.detalhes.map((d) => (
                                        <tr key={d.treino_id} className="border-b border-border/40 last:border-0">
                                          <td className="py-2 pr-3 text-base leading-none">
                                            {d.presente ? (d.atrasado ? "🔴" : "✅") : "❌"}
                                          </td>
                                          <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                                            {formatData(d.data)}
                                          </td>
                                          <td className="py-2 pr-4 text-foreground">
                                            {d.descricao}
                                          </td>
                                          <td className="py-2 pr-4 text-center text-muted-foreground whitespace-nowrap">
                                            {d.horario_inicio.slice(0, 5)}
                                          </td>
                                          <td className="py-2 pr-4 text-center whitespace-nowrap font-medium">
                                            {d.presente ? formatHora(d.horario_checkin) : "—"}
                                          </td>
                                          <td className={`py-2 text-right whitespace-nowrap font-medium ${
                                            !d.presente ? "text-red-500"
                                            : d.atrasado ? "text-orange-600"
                                            : "text-green-600"
                                          }`}>
                                            {!d.presente ? "Faltou" : d.atrasado ? "Atrasado" : "No horário"}
                                          </td>
                                        </tr>
                                      ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { presencas, treinos, integrantes, configuracoes } from "@/lib/schema";
import { and, gte, lte, sql } from "drizzle-orm";

async function getConfig() {
  const rows = await db.select().from(configuracoes).limit(1);
  if (rows.length > 0) return rows[0];
  return { limiar_presenca: 75, limiar_pontualidade: 0, nome_criterio: "Elegível", descricao_criterio: "" };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get("mes");
  const ano = searchParams.get("ano");

  if (!mes || !ano) {
    return NextResponse.json({ error: "mes e ano são obrigatórios" }, { status: 400 });
  }

  const [config, membros] = await Promise.all([
    getConfig(),
    db.select().from(integrantes).orderBy(integrantes.nome),
  ]);

  const mesNum = Number(mes);
  const anoNum = Number(ano);
  const inicioMes = `${anoNum}-${String(mesNum).padStart(2, "0")}-01`;
  const ultimoDia = new Date(anoNum, mesNum, 0).getDate();
  const fimMes = `${anoNum}-${String(mesNum).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;

  const treinosDoMes = await db
    .select()
    .from(treinos)
    .where(and(gte(treinos.data, inicioMes), lte(treinos.data, fimMes)));

  const totalTreinos = treinosDoMes.length;
  const treinosOrdenados = [...treinosDoMes].sort((a, b) => a.data.localeCompare(b.data));
  const treinoIds = treinosDoMes.map((t) => t.id);

  if (treinoIds.length === 0) {
    return NextResponse.json(
      membros.map((m) => ({
        id: m.id, nome: m.nome, ativo: m.ativo,
        total_presencas: 0, faltas: 0, no_horario: 0, atrasados: 0,
        percentual_pontualidade: 0, percentual_frequencia: 0,
        total_treinos: 0, elegivel: false, detalhes: [],
        config: { nome_criterio: config.nome_criterio, limiar_presenca: config.limiar_presenca, limiar_pontualidade: config.limiar_pontualidade },
      }))
    );
  }

  const presencasDoMes = await db
    .select()
    .from(presencas)
    .where(
      sql`${presencas.treino_id} IN (${sql.join(
        treinoIds.map((id) => sql`${id}`),
        sql`, `
      )})`
    );

  const resultado = membros.map((m) => {
    const minhasPresencasGlobais = presencasDoMes.filter((p) => p.integrante_id === m.id);
    const minhasPresencasPresentes = minhasPresencasGlobais.filter((p) => p.status === "presente");
    const totalTreinosEsperado = minhasPresencasGlobais.length;
    
    const noHorario = minhasPresencasPresentes.filter((p) => !p.atrasado).length;
    const atrasados = minhasPresencasPresentes.filter((p) => p.atrasado).length;
    const total = minhasPresencasPresentes.length;
    const faltas = totalTreinosEsperado - total;
    const percFrequencia = totalTreinosEsperado > 0 ? (total / totalTreinosEsperado) * 100 : 0;
    const percPontualidade = total > 0 ? (noHorario / total) * 100 : 0;

    const atingePresenca = totalTreinosEsperado > 0 ? percFrequencia >= config.limiar_presenca : false;
    const atingePontualidade = config.limiar_pontualidade === 0 || percPontualidade >= config.limiar_pontualidade;
    const elegivel = totalTreinosEsperado > 0 && atingePresenca && atingePontualidade;

    const detalhes = treinosOrdenados
      .filter(treino => minhasPresencasGlobais.some(p => p.treino_id === treino.id))
      .map((treino) => {
        const p = minhasPresencasGlobais.find((p) => p.treino_id === treino.id);
        return {
          treino_id: treino.id,
          data: treino.data,
          descricao: treino.descricao,
          horario_inicio: treino.horario_inicio,
          presente: p?.status === "presente",
          horario_checkin: p?.horario_checkin ?? null,
          atrasado: p?.atrasado ?? null,
        };
      });

    return {
      id: m.id, nome: m.nome, ativo: m.ativo,
      total_presencas: total, faltas, no_horario: noHorario, atrasados,
      percentual_pontualidade: Math.round(percPontualidade),
      percentual_frequencia: Math.round(percFrequencia),
      total_treinos: totalTreinosEsperado,
      elegivel, detalhes,
    };
  });

  return NextResponse.json(resultado);
}

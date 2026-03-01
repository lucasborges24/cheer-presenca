import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { configuracoes } from "@/lib/schema";
import { eq } from "drizzle-orm";

const DEFAULTS = {
  nome_criterio: "Elegível",
  descricao_criterio: "Mínimo 75% de presença no mês",
  limiar_presenca: 75,
  limiar_pontualidade: 0,
};

async function getOrCreateConfig() {
  const rows = await db.select().from(configuracoes).limit(1);
  if (rows.length > 0) return rows[0];

  const [criado] = await db.insert(configuracoes).values(DEFAULTS).returning();
  return criado;
}

export async function GET() {
  const config = await getOrCreateConfig();
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { nome_criterio, descricao_criterio, limiar_presenca, limiar_pontualidade } = body;

  if (
    typeof limiar_presenca !== "number" ||
    typeof limiar_pontualidade !== "number" ||
    limiar_presenca < 0 || limiar_presenca > 100 ||
    limiar_pontualidade < 0 || limiar_pontualidade > 100
  ) {
    return NextResponse.json({ error: "Valores inválidos" }, { status: 400 });
  }

  const config = await getOrCreateConfig();

  const [atualizado] = await db
    .update(configuracoes)
    .set({ nome_criterio, descricao_criterio, limiar_presenca, limiar_pontualidade })
    .where(eq(configuracoes.id, config.id))
    .returning();

  return NextResponse.json(atualizado);
}

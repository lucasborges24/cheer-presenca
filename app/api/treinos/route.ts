import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { treinos, presencas } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data");

  let query = db.select().from(treinos).orderBy(desc(treinos.data));

  if (data) {
    const result = await db
      .select()
      .from(treinos)
      .where(eq(treinos.data, data))
      .orderBy(desc(treinos.criado_em));
    return NextResponse.json(result);
  }

  const result = await query;
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const { data, descricao, horario_inicio, integrantesIds } = await request.json();

  if (!data || !descricao || !horario_inicio || !Array.isArray(integrantesIds)) {
    return NextResponse.json(
      { error: "Todos os campos são obrigatórios, incluindo integrantesIds" },
      { status: 400 }
    );
  }

  const [novo] = await db
    .insert(treinos)
    .values({ data, descricao, horario_inicio })
    .returning();

  if (integrantesIds.length > 0) {
    const presencasData = integrantesIds.map((id: number) => ({
      treino_id: novo.id,
      integrante_id: id,
      status: "esperado" as const,
    }));
    await db.insert(presencas).values(presencasData);
  }

  return NextResponse.json(novo, { status: 201 });
}

export async function PATCH(request: Request) {
  const { id, descricao } = await request.json();

  if (typeof id !== "number" || typeof descricao !== "string" || descricao.trim().length === 0) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const [atualizado] = await db
    .update(treinos)
    .set({ descricao: descricao.trim() })
    .where(eq(treinos.id, id))
    .returning();

  return NextResponse.json(atualizado);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const force = searchParams.get("force") === "true";

  if (!id) {
    return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
  }

  try {
    if (force) {
      await db.delete(presencas).where(eq(presencas.treino_id, Number(id)));
    }

    await db.delete(treinos).where(eq(treinos.id, Number(id)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir treino:", error);
    return NextResponse.json(
      { error: "Erro ao excluir treino. Pode haver presenças vinculadas." },
      { status: 400 }
    );
  }
}

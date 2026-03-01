import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { treinos } from "@/lib/schema";
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
  const { data, descricao, horario_inicio } = await request.json();

  if (!data || !descricao || !horario_inicio) {
    return NextResponse.json(
      { error: "Todos os campos são obrigatórios" },
      { status: 400 }
    );
  }

  const [novo] = await db
    .insert(treinos)
    .values({ data, descricao, horario_inicio })
    .returning();

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

  if (!id) {
    return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
  }

  await db.delete(treinos).where(eq(treinos.id, Number(id)));

  return NextResponse.json({ ok: true });
}

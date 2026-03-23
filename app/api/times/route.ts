import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { times, integrantes_times } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const result = await db.query.times.findMany({
    with: {
      integrantes: {
        with: {
          integrante: true,
        },
      },
    },
    orderBy: [asc(times.nome)],
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const { nome } = await request.json();

  if (!nome || typeof nome !== "string" || nome.trim().length === 0) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const [novo] = await db
    .insert(times)
    .values({ nome: nome.trim() })
    .returning();

  return NextResponse.json(novo, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, nome, integrantes_ids } = body;

  if (typeof id !== "number") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Se passou 'nome', atualizamos os dados do time
  if (typeof nome === "string" && nome.trim().length > 0) {
    await db
      .update(times)
      .set({ nome: nome.trim() })
      .where(eq(times.id, id));
  }

  // Se passou 'integrantes_ids', atualizamos os vínculos
  if (Array.isArray(integrantes_ids)) {
    // 1. Deletar todos os vínculos atuais para este time
    await db.delete(integrantes_times).where(eq(integrantes_times.time_id, id));
    
    // 2. Inserir os novos vínculos
    if (integrantes_ids.length > 0) {
      await db.insert(integrantes_times).values(
        integrantes_ids.map((integranteId: number) => ({
          time_id: id,
          integrante_id: integranteId,
        }))
      );
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const idStr = searchParams.get("id");

  if (!idStr) {
    return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
  }

  const id = parseInt(idStr, 10);

  // Deletar o time (O onDelete: 'cascade' cuidará de limpar a tabela integrantes_times)
  await db.delete(times).where(eq(times.id, id));

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { integrantes, integrantes_times } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const todos = searchParams.get("todos");

  let result;
  if (todos === "true") {
    result = await db.query.integrantes.findMany({
      with: {
        times: {
          with: { time: true }
        }
      },
      orderBy: [asc(integrantes.nome)],
    });
  } else {
    result = await db.query.integrantes.findMany({
      where: eq(integrantes.ativo, true),
      with: {
        times: {
          with: { time: true }
        }
      },
      orderBy: [asc(integrantes.nome)],
    });
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const { nome } = await request.json();

  if (!nome || typeof nome !== "string" || nome.trim().length === 0) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const [novo] = await db
    .insert(integrantes)
    .values({ nome: nome.trim() })
    .returning();

  return NextResponse.json(novo, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id } = body;

  if (typeof id !== "number") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const campos: Record<string, unknown> = {};
  if (typeof body.ativo === "boolean") campos.ativo = body.ativo;
  if (typeof body.nome === "string" && body.nome.trim().length > 0) {
    campos.nome = body.nome.trim();
  }

  // Atualizar dados principais se houver campos
  let atualizado = null;
  if (Object.keys(campos).length > 0) {
    const res = await db
      .update(integrantes)
      .set(campos)
      .where(eq(integrantes.id, id))
      .returning();
    atualizado = res[0] || null;
  }

  // Atualizar relacionamentos se times_ids for passado
  if (Array.isArray(body.times_ids)) {
    if (body.times_ids.length > 2) {
      return NextResponse.json({ error: "Um integrante pode estar vinculado a no máximo dois times" }, { status: 400 });
    }

    // Deleta os vínculos atuais
    await db.delete(integrantes_times).where(eq(integrantes_times.integrante_id, id));

    // Insere os novos
    if (body.times_ids.length > 0) {
      await db.insert(integrantes_times).values(
        body.times_ids.map((timeId: number) => ({
          integrante_id: id,
          time_id: timeId,
        }))
      );
    }
  }

  return NextResponse.json(atualizado || { success: true });
}

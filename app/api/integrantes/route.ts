import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { integrantes } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const todos = searchParams.get("todos");

  let result;
  if (todos === "true") {
    result = await db.select().from(integrantes).orderBy(integrantes.nome);
  } else {
    result = await db
      .select()
      .from(integrantes)
      .where(eq(integrantes.ativo, true))
      .orderBy(integrantes.nome);
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

  if (Object.keys(campos).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const [atualizado] = await db
    .update(integrantes)
    .set(campos)
    .where(eq(integrantes.id, id))
    .returning();

  return NextResponse.json(atualizado);
}

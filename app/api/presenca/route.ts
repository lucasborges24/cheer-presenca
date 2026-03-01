import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { presencas, treinos } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const treino_id = searchParams.get("treino_id");

  if (!treino_id) {
    return NextResponse.json(
      { error: "treino_id é obrigatório" },
      { status: 400 }
    );
  }

  const result = await db
    .select()
    .from(presencas)
    .where(eq(presencas.treino_id, Number(treino_id)));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const { integrante_id, treino_id } = await request.json();

  if (!integrante_id || !treino_id) {
    return NextResponse.json(
      { error: "integrante_id e treino_id são obrigatórios" },
      { status: 400 }
    );
  }

  // Check for duplicate
  const existing = await db
    .select()
    .from(presencas)
    .where(
      and(
        eq(presencas.integrante_id, integrante_id),
        eq(presencas.treino_id, treino_id)
      )
    );

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Presença já registrada para este integrante neste treino" },
      { status: 409 }
    );
  }

  // Get training info to check lateness
  const [treino] = await db
    .select()
    .from(treinos)
    .where(eq(treinos.id, treino_id));

  if (!treino) {
    return NextResponse.json(
      { error: "Treino não encontrado" },
      { status: 404 }
    );
  }

  // Calculate if late: compare current time with horario_inicio + 10min (São Paulo timezone)
  const now = new Date();
  const saoPauloTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );

  const [hours, minutes] = treino.horario_inicio.split(":").map(Number);
  const treinoStart = new Date(saoPauloTime);
  treinoStart.setHours(hours, minutes + 10, 0, 0);

  const atrasado = saoPauloTime > treinoStart;

  const [nova] = await db
    .insert(presencas)
    .values({
      integrante_id,
      treino_id,
      atrasado,
    })
    .returning();

  return NextResponse.json(nova, { status: 201 });
}

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: attemptId } = await params;

  const attempt = await (prisma as any).simulationAttempt.findFirst({
    where:   { id: attemptId, userId: user.id, completedAt: null },
    include: { scenario: true },
  });
  if (!attempt) return NextResponse.json({ error: "Intento no encontrado" }, { status: 404 });

  const transcript: Array<{ role: string; content: string }> = attempt.transcript as never ?? [];
  if (transcript.length < 2) {
    return NextResponse.json({ error: "Conversación demasiado corta para evaluar" }, { status: 400 });
  }

  const conversationText = transcript
    .map((m: { role: string; content: string }) =>
      `${m.role === "employee" ? "EMPLEADO" : "CLIENTE"}: ${m.content}`
    )
    .join("\n");

  const evaluatorPrompt = `Eres un evaluador experto en atención al cliente y ventas para gimnasios.

ESCENARIO:
Objetivo del empleado: ${attempt.scenario.objective}
Contexto: ${attempt.scenario.customerContext}

CONVERSACIÓN:
${conversationText}

Evalúa la actuación del empleado y devuelve ÚNICAMENTE un JSON con este formato exacto:
{
  "score": <número 0-100>,
  "objectiveAchieved": <true|false>,
  "tone": "<frío|neutro|profesional|empático|excelente>",
  "summary": "<resumen breve de la actuación en 2-3 frases>",
  "strengths": ["<punto fuerte 1>", "<punto fuerte 2>"],
  "improvements": ["<área de mejora 1>", "<área de mejora 2>"]
}

Solo JSON, sin texto adicional.`;

  const model  = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(evaluatorPrompt);
  const raw    = result.response.text();

  let evaluation: Record<string, unknown> = {};
  let score = 50;

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      evaluation = JSON.parse(jsonMatch[0]);
      score      = Number(evaluation.score) || 50;
    }
  } catch { /* keep defaults */ }

  await (prisma as any).simulationAttempt.update({
    where: { id: attemptId },
    data:  { score, feedback: (evaluation.summary as string) ?? null, evaluation, completedAt: new Date() },
  });

  return NextResponse.json({ score, evaluation, attemptId });
}

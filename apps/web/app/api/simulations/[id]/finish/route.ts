import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL   = "llama-3.3-70b-versatile";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const user = session?.user as { id?: string } | undefined;
    if (!user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id: attemptId } = await params;

    const attempt = await (prisma as any).simulationAttempt.findFirst({
      where: { id: attemptId, userId: user.id, completedAt: null },
    });
    if (!attempt) return NextResponse.json({ error: "Intento no encontrado" }, { status: 404 });

    const scenario = await (prisma as any).scenario.findFirst({
      where: { id: attempt.scenarioId },
    });
    if (!scenario) return NextResponse.json({ error: "Escenario no encontrado" }, { status: 404 });

    const transcript: Array<{ role: string; content: string }> = attempt.transcript ?? [];
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
Objetivo del empleado: ${scenario.objective}
Contexto: ${scenario.customerContext}

CONVERSACIÓN:
${conversationText}

Evalúa la actuación del empleado. OUTPUT ONLY JSON. NO INTRODUCTION. NO EXPLANATION.

{
  "score": <número 0-100>,
  "objectiveAchieved": <true|false>,
  "tone": "<frío|neutro|profesional|empático|excelente>",
  "summary": "<resumen breve 2-3 frases>",
  "strengths": ["<punto fuerte 1>", "<punto fuerte 2>"],
  "improvements": ["<área de mejora 1>", "<área de mejora 2>"]
}`;

    const groqRes = await fetch(GROQ_API_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: "You are an expert evaluator. OUTPUT ONLY A JSON OBJECT. NO MARKDOWN. NO EXPLANATION." },
          { role: "user",   content: evaluatorPrompt },
        ],
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      throw new Error(`Groq error ${groqRes.status}: ${err}`);
    }

    const groqData = await groqRes.json();
    const raw      = groqData.choices?.[0]?.message?.content ?? "";

    let evaluation: Record<string, unknown> = {};
    let score = 50;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        evaluation = JSON.parse(match[0]);
        score      = Number(evaluation.score) || 50;
      }
    } catch { /* keep defaults */ }

    await (prisma as any).simulationAttempt.update({
      where: { id: attemptId },
      data:  { score, feedback: (evaluation.summary as string) ?? null, evaluation, completedAt: new Date() },
    });

    return NextResponse.json({ score, evaluation, attemptId });

  } catch (err) {
    console.error("[simulation/finish]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 }
    );
  }
}

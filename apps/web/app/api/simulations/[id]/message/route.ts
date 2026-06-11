import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL   = "llama-3.3-70b-versatile";
const MAX_TURNS    = 15;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const user = session?.user as { id?: string } | undefined;
    if (!user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id: attemptId } = await params;
    const { message }       = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });

    const attempt = await (prisma as any).simulationAttempt.findFirst({
      where: { id: attemptId, userId: user.id, completedAt: null },
    });
    if (!attempt) return NextResponse.json({ error: "Intento no encontrado o ya completado" }, { status: 404 });

    const scenario = await (prisma as any).scenario.findFirst({
      where: { id: attempt.scenarioId },
    });
    if (!scenario) return NextResponse.json({ error: "Escenario no encontrado" }, { status: 404 });

    const transcript: Array<{ role: string; content: string; ts: string }> = attempt.transcript ?? [];

    if (transcript.filter((m: { role: string }) => m.role === "employee").length >= MAX_TURNS) {
      return NextResponse.json({ error: "Límite de turnos alcanzado" }, { status: 400 });
    }

    transcript.push({ role: "employee", content: message.trim(), ts: new Date().toISOString() });

    const systemPrompt = `${scenario.customerContext}

INSTRUCCIONES DE ROL:
- Eres un cliente de un gimnasio. Mantente SIEMPRE en el personaje.
- Responde de forma realista, natural y en español.
- No rompas el personaje bajo ninguna circunstancia.
- Si el empleado maneja bien la situación, reacciona positivamente.
- Si el empleado es brusco o no ayuda, reacciona con más frustración.
- Respuestas cortas y directas (2-4 frases máximo).`;

    // Build message history in OpenAI format
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...transcript.slice(0, -1).map((m: { role: string; content: string }) => ({
        role:    m.role === "employee" ? "user" : "assistant",
        content: m.content,
      })),
      { role: "user", content: message.trim() },
    ];

    const groqRes = await fetch(GROQ_API_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        messages:    chatMessages,
        temperature: 0.8,
        max_tokens:  256,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      throw new Error(`Groq error ${groqRes.status}: ${err}`);
    }

    const groqData = await groqRes.json();
    const reply    = groqData.choices?.[0]?.message?.content ?? "...";

    transcript.push({ role: "customer", content: reply, ts: new Date().toISOString() });

    await (prisma as any).simulationAttempt.update({
      where: { id: attemptId },
      data:  { transcript },
    });

    const turnsLeft = MAX_TURNS - transcript.filter((m: { role: string }) => m.role === "employee").length;

    return NextResponse.json({ reply, turnsLeft });

  } catch (err) {
    console.error("[simulation/message]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 }
    );
  }
}

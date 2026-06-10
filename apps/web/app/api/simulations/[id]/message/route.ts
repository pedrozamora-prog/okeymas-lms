import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MAX_TURNS = 15;

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

    // Fetch scenario separately to avoid include relation issues with non-regenerated client
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

    const history = transcript
      .slice(0, -1)
      .map((m: { role: string; content: string }) => ({
        role:  m.role === "employee" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

    const model  = genAI.getGenerativeModel({ model: "gemini-2.0-flash", systemInstruction: systemPrompt });
    const chat   = model.startChat({ history });
    const result = await chat.sendMessage(message.trim());
    const reply  = result.response.text();

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

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY no configurada en el servidor" }, { status: 500 });
  }

  const { type, courseTitle, moduleTitle, lessonTitle } = await req.json();

  const prompts: Record<string, string> = {
    description: `Escribe una descripción atractiva y profesional (2-3 párrafos) para un curso de formación llamado "${courseTitle}" dentro del sector fitness y gimnasios. Incluye objetivos de aprendizaje y a quién va dirigido. Responde solo con el texto, sin títulos ni markdown.`,
    lessonDescription: `Escribe una introducción breve (3-5 frases) para la lección "${lessonTitle}" del módulo "${moduleTitle}". Explica de qué trata, qué aprenderá el alumno y por qué es importante. Responde solo con el texto, sin títulos ni markdown.`,
    objectives: `Lista 5-7 objetivos de aprendizaje concretos y medibles para el módulo "${moduleTitle}" del curso "${courseTitle}". Usa verbos de acción (identificar, aplicar, analizar...). Formato: una línea por objetivo, sin numeración, sin markdown.`,
    quiz: `Genera 5 preguntas de test de opción múltiple (4 opciones cada una) para la lección "${lessonTitle}" del módulo "${moduleTitle}".
Formato JSON estricto:
[{"question":"...","options":["A","B","C","D"],"correct":0}]
Donde "correct" es el índice (0-3) de la respuesta correcta. Solo JSON, sin texto adicional.`,
  };

  const prompt = prompts[type];
  if (!prompt) return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[ai/generate] Groq error:", err);
      return NextResponse.json({ error: `Error de Groq (${res.status})` }, { status: 500 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ai/generate] error:", msg);
    return NextResponse.json({ error: `Error: ${msg}` }, { status: 500 });
  }
}

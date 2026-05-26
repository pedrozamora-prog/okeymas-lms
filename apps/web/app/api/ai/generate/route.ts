import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY no configurada en el servidor" }, { status: 500 });
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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return NextResponse.json({ text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ai/generate] Gemini error:", msg);
    return NextResponse.json({ error: `Error de Gemini: ${msg}` }, { status: 500 });
  }
}

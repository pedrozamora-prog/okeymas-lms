import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const BASE_SYSTEM_PROMPT = `Eres el tutor IA de Formia, una plataforma de formación corporativa para empresas.
Ayudas a los alumnos a entender los contenidos de sus cursos, resolver dudas y reforzar el aprendizaje.
Responde siempre en español, de forma clara, cercana y motivadora. Sé conciso pero completo.
Si te preguntan algo completamente ajeno a la formación, redirige amablemente hacia el aprendizaje.`;

function buildSystemPrompt(lessonCtx?: {
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonType:  string;
  contentText: string;
} | null): string {
  if (!lessonCtx) return BASE_SYSTEM_PROMPT;

  return `${BASE_SYSTEM_PROMPT}

--- CONTEXTO ACTUAL DEL ALUMNO ---
Curso:   ${lessonCtx.courseTitle}
Módulo:  ${lessonCtx.moduleTitle}
Lección: ${lessonCtx.lessonTitle} (${lessonCtx.lessonType})
${lessonCtx.contentText
  ? `\nCONTENIDO DE LA LECCIÓN:\n${lessonCtx.contentText}`
  : ""}

INSTRUCCIONES ESPECIALES:
- El alumno está viendo ESTA lección ahora mismo. Enfoca tus respuestas en su contenido.
- Si hace preguntas sobre el contenido, explícalo con tus propias palabras y ejemplos prácticos.
- Si no entiende un concepto de la lección, desglósalo paso a paso.
- Puedes responder preguntas de otros temas del curso si son relevantes.`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { message, history, lessonContext } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });

  const model = genAI.getGenerativeModel({
    model:             "gemini-2.0-flash",
    systemInstruction: buildSystemPrompt(lessonContext ?? null),
  });

  const chat = model.startChat({
    history: (history ?? []).map((m: { role: string; text: string }) => ({
      role:  m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    })),
  });

  const result = await chat.sendMessage(message);
  const text   = result.response.text();

  return NextResponse.json({ text });
}

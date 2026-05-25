import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `Eres un asistente de formación de Okeymas LMS, especializado en el Técnico Superior en Acondicionamiento Físico.
Ayudas a los alumnos a entender los contenidos del curso, resolver dudas sobre anatomía, fisiología del ejercicio, nutrición deportiva,
planificación de entrenamientos y todos los temas relacionados con la formación profesional en acondicionamiento físico.
Responde siempre en español, de forma clara y motivadora. Sé conciso pero completo.
Si te preguntan algo fuera del ámbito de la formación, redirige amablemente la conversación hacia el aprendizaje.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { message, history } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const chat = model.startChat({
    history: (history ?? []).map((m: { role: string; text: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    })),
  });

  const result = await chat.sendMessage(message);
  const text = result.response.text();

  return NextResponse.json({ text });
}

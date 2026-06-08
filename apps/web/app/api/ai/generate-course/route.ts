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

  const {
    topic,
    context,
    numModules     = 3,
    lessonsPerModule = 3,
    includeQuiz    = true,
    includeContent = true,
  } = await req.json();

  if (!topic?.trim()) {
    return NextResponse.json({ error: "El tema del curso es obligatorio" }, { status: 400 });
  }

  const contentInstruction = includeContent
    ? `Para cada lección genera "content": array de 4-6 bloques educativos usando estos tipos:
  {"type":"heading","level":2,"text":"Título"}
  {"type":"paragraph","text":"Texto explicativo con detalle real y práctico"}
  {"type":"callout","variant":"tip"|"info"|"warning"|"danger","text":"Nota o consejo"}`
    : `Para cada lección, "content": []`;

  const quizInstruction = includeQuiz
    ? `Para cada módulo genera "quiz": array de 4 preguntas de opción múltiple:
  {"text":"¿Pregunta?","options":[{"text":"Opción A","isCorrect":false},{"text":"Opción B","isCorrect":true},{"text":"Opción C","isCorrect":false},{"text":"Opción D","isCorrect":false}],"explanation":"Explicación de por qué es correcta"}
  Exactamente una opción con isCorrect:true por pregunta.`
    : `Para cada módulo, "quiz": []`;

  const userPrompt = `Genera un curso de formación corporativa profesional sobre: "${topic}".
${context ? `Contexto: ${context}` : ""}
Estructura: ${numModules} módulos, ${lessonsPerModule} lecciones por módulo.

${contentInstruction}
${quizInstruction}

Devuelve ÚNICAMENTE este JSON exacto (sin texto adicional, sin markdown):
{
  "title": "Título del curso",
  "description": "Descripción atractiva del curso (2-3 frases)",
  "modules": [
    {
      "title": "Nombre del módulo",
      "description": "Descripción del módulo (1 frase)",
      "lessons": [
        {
          "title": "Título de la lección",
          "description": "Descripción breve de la lección",
          "content": []
        }
      ],
      "quiz": []
    }
  ]
}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Eres un experto en diseño instruccional y formación corporativa. Respondes ÚNICAMENTE con JSON válido, sin texto adicional ni markdown.",
          },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 6000,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[ai/generate-course] Groq error:", err);
      return NextResponse.json({ error: `Error de Groq (${res.status})` }, { status: 500 });
    }

    const data  = await res.json();
    const text  = data.choices?.[0]?.message?.content ?? "";

    let course;
    try {
      course = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return NextResponse.json({ error: "La IA no devolvió JSON válido" }, { status: 500 });
      try { course = JSON.parse(match[0]); } catch {
        return NextResponse.json({ error: "No se pudo parsear la respuesta de la IA" }, { status: 500 });
      }
    }

    if (!course?.title || !Array.isArray(course.modules) || course.modules.length === 0) {
      return NextResponse.json({ error: "La IA devolvió una estructura de curso inválida" }, { status: 500 });
    }

    return NextResponse.json({ course });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ai/generate-course]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

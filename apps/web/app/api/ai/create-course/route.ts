import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { randomUUID } from "crypto";
import { LessonType } from "@prisma/client";

interface QuizQuestion {
  text: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  explanation?: string;
}

interface GeneratedLesson {
  title: string;
  description?: string;
  content?: Array<Record<string, unknown>>;
}

interface GeneratedModule {
  title: string;
  description?: string;
  lessons: GeneratedLesson[];
  quiz?: QuizQuestion[];
}

interface GeneratedCourse {
  title: string;
  description?: string;
  modules: GeneratedModule[];
}

/* ── Together AI image generation → upload to Supabase ─────────────────── */
async function generateAndUploadCoverImage(title: string): Promise<string | null> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) return null;

  const prompt =
    `High-quality professional photograph for a corporate training course about "${title}". ` +
    `Modern workplace environment, clean composition, bright natural lighting, ` +
    `sharp focus, professional atmosphere. No text, no logos, no watermarks. ` +
    `Stock photography style, photorealistic.`;

  try {
    // 1. Generate image with Together AI FLUX.1-schnell
    const genRes = await fetch("https://api.together.xyz/v1/images/generations", {
      method:  "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body:    JSON.stringify({
        model:  "black-forest-labs/FLUX.1-schnell",
        prompt,
        width:  1024,
        height: 576,
        steps:  4,
        n:      1,
      }),
    });
    if (!genRes.ok) {
      console.error("[create-course] Together AI error:", await genRes.text());
      return null;
    }

    const genData  = await genRes.json();
    const imageUrl = genData.data?.[0]?.url as string | undefined;
    if (!imageUrl) return null;

    // 2. Download the generated image
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    // 3. Upload to Supabase Storage (same bucket as manual uploads)
    const supabase = getSupabaseAdmin();
    await supabase.storage.createBucket("thumbnails", { public: true }).catch(() => null);
    const filename = `ai-${Date.now()}-${randomUUID().slice(0, 8)}.jpg`;
    const { error } = await supabase.storage
      .from("thumbnails")
      .upload(filename, buffer, { contentType: "image/jpeg", upsert: false });
    if (error) {
      console.error("[create-course] Supabase upload error:", error.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from("thumbnails").getPublicUrl(filename);
    return urlData.publicUrl;
  } catch (err) {
    console.error("[create-course] image generation failed:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id: string; role?: string; organizationId?: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { course }: { course: GeneratedCourse } = await req.json();

  if (!course?.title || !Array.isArray(course.modules) || course.modules.length === 0) {
    return NextResponse.json({ error: "Estructura de curso inválida" }, { status: 400 });
  }

  // Fetch org branding
  const org = await prisma.organization.findUnique({
    where:  { id: user.organizationId! },
    select: { name: true, logoUrl: true },
  });

  // Try Together AI first; fall back to branded OG image
  const aiImageUrl = await generateAndUploadCoverImage(course.title.trim());

  const ogParams = new URLSearchParams({
    title: course.title.trim(),
    org:   org?.name ?? "Formia",
    topic: course.title.trim(),
    ...(org?.logoUrl ? { logo: org.logoUrl } : {}),
  });
  const thumbnailUrl = aiImageUrl ?? `/api/og/course-cover?${ogParams.toString()}`;

  // Create the course record
  const newCourse = await prisma.course.create({
    data: {
      title:          course.title.trim(),
      description:    course.description?.trim() || null,
      status:         "DRAFT",
      thumbnailUrl,
      organizationId: user.organizationId!,
    },
  });

  // Create modules, lessons and quizzes
  for (let mi = 0; mi < course.modules.length; mi++) {
    const mod = course.modules[mi];

    const newModule = await prisma.module.create({
      data: {
        title:       mod.title.trim(),
        description: mod.description?.trim() || null,
        order:       mi,
        courseId:    newCourse.id,
      },
    });

    const lessons = mod.lessons ?? [];
    for (let li = 0; li < lessons.length; li++) {
      const lesson = lessons[li];
      const contentBlocks = (lesson.content ?? []).map((block) => ({
        ...block,
        id: randomUUID(),
      }));

      await prisma.lesson.create({
        data: {
          title:       lesson.title.trim(),
          description: lesson.description?.trim() || null,
          type:        "CONTENT" as LessonType,
          content:     contentBlocks.length > 0 ? contentBlocks : undefined,
          order:       li,
          moduleId:    newModule.id,
          isRequired:  true,
        },
      });
    }

    const quizQuestions = mod.quiz ?? [];
    if (quizQuestions.length > 0) {
      const quizLesson = await prisma.lesson.create({
        data: {
          title:       `Evaluación: ${mod.title}`,
          description: `Test de comprensión del módulo.`,
          type:        "QUIZ" as LessonType,
          order:       lessons.length,
          moduleId:    newModule.id,
          isRequired:  true,
        },
      });

      const quiz = await prisma.quiz.create({
        data: {
          lessonId:     quizLesson.id,
          passingScore: 70,
          maxAttempts:  3,
        },
      });

      for (let qi = 0; qi < quizQuestions.length; qi++) {
        const q = quizQuestions[qi];
        const question = await prisma.quizQuestion.create({
          data: {
            quizId:      quiz.id,
            text:        q.text,
            type:        "MULTIPLE_CHOICE",
            explanation: q.explanation ?? null,
            order:       qi,
          },
        });
        for (let oi = 0; oi < (q.options ?? []).length; oi++) {
          await prisma.quizOption.create({
            data: {
              questionId: question.id,
              text:       q.options[oi].text,
              isCorrect:  q.options[oi].isCorrect,
              order:      oi,
            },
          });
        }
      }
    }
  }

  return NextResponse.json({ courseId: newCourse.id, hasAiImage: !!aiImageUrl });
}

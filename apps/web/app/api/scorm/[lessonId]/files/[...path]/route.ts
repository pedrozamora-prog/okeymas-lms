import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = "scorm-packages";

// GET /api/scorm/[lessonId]/files/[...path]
// Proxies SCORM package files from Supabase Storage so they're same-origin
// (required for window.parent.API access within the iframe)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string; path: string[] }> },
) {
  const session = await auth();
  const user = session?.user as { id: string; organizationId: string } | undefined;
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  const { lessonId, path: pathParts } = await params;
  const filePath = pathParts.join("/");

  // Verify enrollment (the user must be enrolled in the course containing this lesson)
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { course: { organizationId: user.organizationId } } },
    select: { id: true, moduleId: true, module: { select: { courseId: true } } },
  });
  if (!lesson) return new NextResponse("No encontrado", { status: 404 });

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: user.id, courseId: lesson.module.courseId },
  });
  if (!enrollment) return new NextResponse("No inscrito", { status: 403 });

  // Download from Supabase Storage
  const supabase = getSupabaseAdmin();
  const storagePath = `${lessonId}/${filePath}`;
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);

  if (error || !data) {
    return new NextResponse("Archivo no encontrado", { status: 404 });
  }

  const contentType = getMimeType(filePath);
  const arrayBuffer = await data.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
      // Allow the SCORM iframe to access parent window API
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}

function getMimeType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    html: "text/html; charset=utf-8", htm: "text/html; charset=utf-8",
    css: "text/css",
    js: "application/javascript", mjs: "application/javascript",
    json: "application/json",
    xml: "application/xml",
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
    gif: "image/gif", svg: "image/svg+xml", webp: "image/webp",
    mp4: "video/mp4", webm: "video/webm",
    mp3: "audio/mpeg", ogg: "audio/ogg",
    woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf",
    pdf: "application/pdf",
    swf: "application/x-shockwave-flash",
  };
  return map[ext] ?? "application/octet-stream";
}

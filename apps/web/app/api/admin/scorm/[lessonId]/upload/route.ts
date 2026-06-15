import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

const BUCKET = "scorm-packages";
const MAX_SIZE_MB = 200;

// POST /api/admin/scorm/[lessonId]/upload
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { lessonId } = await params;

  // Verify lesson belongs to org
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { course: { organizationId: user.organizationId } } },
    select: { id: true, title: true },
  });
  if (!lesson) return NextResponse.json({ error: "Lección no encontrada" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("package") as File | null;
  if (!file) return NextResponse.json({ error: "No se ha enviado ningún archivo" }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".zip")) {
    return NextResponse.json({ error: "El archivo debe ser un ZIP" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `El ZIP no puede superar ${MAX_SIZE_MB}MB` }, { status: 400 });
  }

  // Extract ZIP
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Parse imsmanifest.xml
  const manifestFile = zip.file("imsmanifest.xml");
  if (!manifestFile) {
    return NextResponse.json({ error: "El ZIP no contiene imsmanifest.xml. ¿Es un paquete SCORM válido?" }, { status: 400 });
  }
  const manifestXml = await manifestFile.async("string");
  const { title, launchFile } = parseManifest(manifestXml, lesson.title);

  // Upload files to Supabase Storage
  const supabase = getSupabaseAdmin();
  const prefix = `${lessonId}/`;

  // Delete previous package if exists
  const { data: existing } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1 });
  if (existing && existing.length > 0) {
    const { data: allFiles } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
    if (allFiles) {
      await supabase.storage.from(BUCKET).remove(allFiles.map(f => `${prefix}${f.name}`));
    }
  }

  // Upload each file
  const uploadErrors: string[] = [];
  const uploadPromises: Promise<void>[] = [];

  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;
    const promise = zipEntry.async("arraybuffer").then(async (content) => {
      const contentType = getMimeType(relativePath);
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(`${lessonId}/${relativePath}`, content, {
          contentType,
          upsert: true,
        });
      if (error) uploadErrors.push(relativePath);
    });
    uploadPromises.push(promise);
  });

  await Promise.all(uploadPromises);

  if (uploadErrors.length > 0) {
    console.error("SCORM upload errors:", uploadErrors);
  }

  // Update lesson: set type = SCORM, fileUrl = launch path
  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      type: "SCORM",
      fileUrl: `${lessonId}/${launchFile}`,
      ...(title !== lesson.title ? { title } : {}),
    },
  });

  return NextResponse.json({
    ok: true,
    launchFile,
    title,
    filesUploaded: uploadPromises.length - uploadErrors.length,
  });
}

// DELETE /api/admin/scorm/[lessonId]/upload — remove SCORM package
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { lessonId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list(`${lessonId}/`, { limit: 1000 });

  if (files && files.length > 0) {
    await supabase.storage.from(BUCKET).remove(files.map(f => `${lessonId}/${f.name}`));
  }

  await prisma.lesson.update({
    where: { id: lessonId },
    data: { type: "CONTENT", fileUrl: null },
  });

  return NextResponse.json({ ok: true });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseManifest(xml: string, fallbackTitle: string): { title: string; launchFile: string } {
  // Extract title from <organizations><organization><title>
  const titleMatch = xml.match(/<title[^>]*>\s*([^<]+)\s*<\/title>/i);
  const title = titleMatch?.[1]?.trim() || fallbackTitle;

  // Find SCO resource href — look for adlcp:scormType="sco" or schemaversion
  const scoMatch = xml.match(/adlcp:scormtype\s*=\s*["']sco["'][^>]*href\s*=\s*["']([^"']+)["']/i)
    || xml.match(/href\s*=\s*["']([^"']+)["'][^>]*adlcp:scormtype\s*=\s*["']sco["']/i);

  if (scoMatch?.[1]) {
    return { title, launchFile: scoMatch[1].split("?")[0] };
  }

  // Fallback: first resource with href pointing to html
  const resourceMatch = xml.match(/<resource[^>]+href\s*=\s*["']([^"'?]+\.html?)["']/i);
  if (resourceMatch?.[1]) {
    return { title, launchFile: resourceMatch[1] };
  }

  // Last fallback: any resource href
  const anyHref = xml.match(/<resource[^>]+href\s*=\s*["']([^"'?#]+)["']/i);
  return { title, launchFile: anyHref?.[1] ?? "index.html" };
}

function getMimeType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    html: "text/html", htm: "text/html",
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

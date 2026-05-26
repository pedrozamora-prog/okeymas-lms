import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

const BUCKET = "thumbnails";
const MAX_MB  = 3;

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });

  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `El archivo supera el límite de ${MAX_MB}MB` }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Solo se permiten imágenes JPG, PNG, WEBP o GIF" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (e) {
    return NextResponse.json({ error: "Supabase no configurado: " + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }

  // Crear bucket si no existe (ignorar error si ya existe)
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => null);

  const ext      = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[upload] Supabase error:", error);
    return NextResponse.json({ error: `Supabase: ${error.message}` }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);

  return NextResponse.json({ url: data.publicUrl });
}

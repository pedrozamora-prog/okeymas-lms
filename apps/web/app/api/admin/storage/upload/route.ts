import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_TYPES: Record<string, string[]> = {
  pdf:   ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
  doc:   ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const BUCKET   = "lessons";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;

  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Almacenamiento no configurado" }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const type = (form.get("type") as string) ?? "pdf";

  if (!file) return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "El archivo supera el límite de 50 MB" }, { status: 400 });

  const allowed = ALLOWED_TYPES[type] ?? ALLOWED_TYPES.pdf;
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: `Tipo de archivo no permitido (${file.type})` }, { status: 400 });
  }

  // Nombre único: org/timestamp-nombre
  const ext      = file.name.split(".").pop() ?? "bin";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path     = `${user.organizationId}/${Date.now()}-${safeName}`;

  const buffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    // Si el bucket no existe, intentar crearlo
    if (error.message.includes("Bucket not found")) {
      await supabase.storage.createBucket(BUCKET, { public: true });
      const retry = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType: file.type });
      if (retry.error) {
        return NextResponse.json({ error: retry.error.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl, path, name: file.name, size: file.size });
}

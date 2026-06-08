import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TOGETHER_API_KEY no configurada" }, { status: 500 });
  }

  const { title } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  }

  const prompt =
    `High-quality professional photograph for a corporate training course about "${title}". ` +
    `Modern workplace environment, clean composition, bright natural lighting, ` +
    `sharp focus, professional atmosphere. No text, no logos, no watermarks. ` +
    `Stock photography style, photorealistic.`;

  // 1. Generate with Together AI FLUX.1-schnell
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
    const err = await genRes.text();
    console.error("[generate-cover] Together AI error:", genRes.status, err);
    return NextResponse.json({ error: `Error de Together AI (${genRes.status}): ${err}` }, { status: 500 });
  }

  const genData  = await genRes.json();
  const imageUrl = genData.data?.[0]?.url as string | undefined;
  if (!imageUrl) {
    return NextResponse.json({ error: "La IA no devolvió ninguna imagen" }, { status: 500 });
  }

  // 2. Download the image
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    return NextResponse.json({ error: "No se pudo descargar la imagen generada" }, { status: 500 });
  }
  const buffer = Buffer.from(await imgRes.arrayBuffer());

  // 3. Upload to Supabase Storage
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (e) {
    return NextResponse.json({ error: "Supabase no configurado: " + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }

  await supabase.storage.createBucket("thumbnails", { public: true }).catch(() => null);
  const filename = `ai-${Date.now()}-${randomUUID().slice(0, 8)}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("thumbnails")
    .upload(filename, buffer, { contentType: "image/jpeg", upsert: false });

  if (uploadError) {
    console.error("[generate-cover] Supabase upload error:", uploadError.message);
    return NextResponse.json({ error: `Error al guardar imagen: ${uploadError.message}` }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("thumbnails").getPublicUrl(filename);
  return NextResponse.json({ url: urlData.publicUrl });
}

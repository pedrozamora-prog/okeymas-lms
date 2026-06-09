import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella"  },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh"   },
];
const VALID_VOICE_IDS = new Set(VOICES.map(v => v.id));
const MAX_CHARS = 2500;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; role?: string; organizationId?: string } | undefined;
    if (!user?.id || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role ?? "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { lessonId, text, voiceId = "21m00Tcm4TlvDq8ikWAM" } = await req.json();
    if (!lessonId || !text?.trim()) {
      return NextResponse.json({ error: "lessonId y text son obligatorios" }, { status: 400 });
    }
    if (!VALID_VOICE_IDS.has(voiceId)) {
      return NextResponse.json({ error: "Voice no válida" }, { status: 400 });
    }

    const elevenlabsKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenlabsKey) {
      return NextResponse.json({ error: "ELEVENLABS_API_KEY no configurada" }, { status: 500 });
    }

    const cleanText = String(text).slice(0, MAX_CHARS).trim();

    // 1. Call ElevenLabs
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method:  "POST",
      headers: {
        "xi-api-key":    elevenlabsKey,
        "Content-Type":  "application/json",
        "Accept":        "audio/mpeg",
      },
      body: JSON.stringify({
        text:       cleanText,
        model_id:   "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!ttsRes.ok) {
      const err = await ttsRes.text();
      return NextResponse.json({ error: `ElevenLabs error: ${err}` }, { status: 502 });
    }

    const audioBuffer = await ttsRes.arrayBuffer();

    // 2. Upload to Supabase Storage
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Almacenamiento no configurado" }, { status: 500 });
    }

    const path   = `${user.organizationId}/audio/${lessonId}-${Date.now()}.mp3`;
    const bucket = "lessons";

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, audioBuffer, { contentType: "audio/mpeg", upsert: true });

    if (uploadError) {
      if (uploadError.message.includes("Bucket not found")) {
        await supabase.storage.createBucket(bucket, { public: true });
        const retry = await supabase.storage.from(bucket).upload(path, audioBuffer, { contentType: "audio/mpeg", upsert: true });
        if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 500 });
      } else {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);

    // 3. Save URL to lesson via raw SQL (column may not be in generated Prisma client yet)
    await prisma.$executeRaw`
      UPDATE lessons SET audio_narration_url = ${publicUrl} WHERE id = ${lessonId}
    `;

    return NextResponse.json({ audioUrl: publicUrl });

  } catch (err) {
    console.error("[narrate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; role?: string } | undefined;
    if (!user?.id || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role ?? "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { lessonId } = await req.json();
    if (!lessonId) return NextResponse.json({ error: "lessonId requerido" }, { status: 400 });

    await prisma.$executeRaw`
      UPDATE lessons SET audio_narration_url = NULL WHERE id = ${lessonId}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

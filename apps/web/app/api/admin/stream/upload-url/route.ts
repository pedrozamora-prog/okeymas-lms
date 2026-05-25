import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  const user = session?.user as { role: string } | undefined;

  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken  = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return NextResponse.json({ error: "Cloudflare Stream no configurado" }, { status: 500 });
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ maxDurationSeconds: 7200 }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.errors?.[0]?.message ?? "Error Cloudflare" }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({
    uploadURL: data.result.uploadURL,
    uid: data.result.uid,
  });
}

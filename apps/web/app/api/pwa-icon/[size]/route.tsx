import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  const dim = size === "192" ? 192 : 512;
  const radius = Math.round(dim * 0.18);
  const fontSize = Math.round(dim * 0.62);

  return new ImageResponse(
    <div
      style={{
        width: dim,
        height: dim,
        borderRadius: radius,
        backgroundColor: "#0C0C0C",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ color: "#FCE900", fontSize, fontWeight: 900, lineHeight: 1 }}>F</span>
    </div>,
    { width: dim, height: dim },
  );
}

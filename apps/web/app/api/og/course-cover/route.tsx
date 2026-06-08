import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const SIZE = { width: 1200, height: 630 };

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title   = searchParams.get("title")   ?? "Curso de formación";
  const orgName = searchParams.get("org")     ?? "Formia";
  const logoUrl = searchParams.get("logo")    ?? null;
  const topic   = searchParams.get("topic")   ?? "";

  // Pick a gradient accent based on first char of topic for variety
  const gradients = [
    ["#A855F7", "#7C3AED"], // purple
    ["#06B6D4", "#0284C7"], // cyan
    ["#10B981", "#059669"], // emerald
    ["#F59E0B", "#D97706"], // amber
    ["#EF4444", "#DC2626"], // red
  ];
  const idx = topic.charCodeAt(0) % gradients.length;
  const [c1, c2] = gradients[idx] ?? ["#A855F7", "#7C3AED"];

  return new ImageResponse(
    (
      <div
        style={{
          width:           "1200px",
          height:          "630px",
          display:         "flex",
          flexDirection:   "column",
          backgroundColor: "#0A0A0A",
          fontFamily:      "sans-serif",
          position:        "relative",
          overflow:        "hidden",
        }}
      >
        {/* Top-right glow */}
        <div
          style={{
            position:     "absolute",
            top:          -120,
            right:        -120,
            width:        480,
            height:       480,
            borderRadius: "50%",
            background:   `radial-gradient(circle, ${c1}55 0%, transparent 70%)`,
          }}
        />
        {/* Bottom-left glow */}
        <div
          style={{
            position:     "absolute",
            bottom:       -100,
            left:         -80,
            width:        360,
            height:       360,
            borderRadius: "50%",
            background:   `radial-gradient(circle, ${c2}44 0%, transparent 70%)`,
          }}
        />

        {/* Accent bar top */}
        <div
          style={{
            position:   "absolute",
            top:        0,
            left:       0,
            right:      0,
            height:     4,
            background: `linear-gradient(90deg, ${c1}, ${c2})`,
          }}
        />

        {/* Content */}
        <div
          style={{
            display:        "flex",
            flexDirection:  "column",
            flex:           1,
            padding:        "60px 80px",
            justifyContent: "space-between",
          }}
        >
          {/* Header: logo + org name */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                width={48}
                height={48}
                style={{ borderRadius: "10px", objectFit: "contain" }}
                alt=""
              />
            )}
            <span
              style={{
                fontSize:      28,
                fontWeight:    700,
                color:         "#FFFFFF",
                letterSpacing: "-0.5px",
                opacity:       0.9,
              }}
            >
              {orgName}
            </span>
          </div>

          {/* Course title */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Label */}
            <div
              style={{
                display:         "flex",
                alignItems:      "center",
                gap:             "10px",
                backgroundColor: `${c1}22`,
                border:          `1px solid ${c1}44`,
                borderRadius:    "8px",
                padding:         "8px 16px",
                width:           "fit-content",
              }}
            >
              <div
                style={{
                  width:        8,
                  height:       8,
                  borderRadius: "50%",
                  background:   c1,
                }}
              />
              <span style={{ fontSize: 18, color: c1, fontWeight: 600 }}>
                Curso de formación
              </span>
            </div>

            <span
              style={{
                fontSize:      title.length > 60 ? 52 : title.length > 40 ? 60 : 72,
                fontWeight:    900,
                color:         "#FFFFFF",
                lineHeight:    1.1,
                letterSpacing: "-2px",
                maxWidth:      900,
              }}
            >
              {title}
            </span>
          </div>

          {/* Footer bar */}
          <div
            style={{
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "space-between",
              borderTop:       "1px solid #FFFFFF18",
              paddingTop:      "24px",
            }}
          >
            <span style={{ fontSize: 20, color: "#FFFFFF60", fontWeight: 500 }}>
              Powered by Formia
            </span>
            <div
              style={{
                display:         "flex",
                alignItems:      "center",
                gap:             "8px",
                backgroundColor: "#FFFFFF0A",
                borderRadius:    "8px",
                padding:         "8px 20px",
              }}
            >
              <div
                style={{
                  width:        10,
                  height:       10,
                  borderRadius: "50%",
                  background:   "#22C55E",
                }}
              />
              <span style={{ fontSize: 18, color: "#FFFFFF80", fontWeight: 600 }}>
                Contenido activo
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}

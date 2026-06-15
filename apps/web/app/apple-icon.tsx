import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        backgroundColor: "#0C0C0C",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ color: "#FCE900", fontSize: 112, fontWeight: 900, lineHeight: 1 }}>F</span>
    </div>,
    size,
  );
}

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 7,
        backgroundColor: "#0C0C0C",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ color: "#FCE900", fontSize: 20, fontWeight: 900, lineHeight: 1 }}>F</span>
    </div>,
    size,
  );
}

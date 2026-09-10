import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#faf8f2",
          color: "#383435",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(90deg, rgba(217,211,202,.42) 1px, transparent 1px), linear-gradient(rgba(217,211,202,.42) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 82,
            top: 70,
            right: 82,
            bottom: 70,
            display: "flex",
            border: "4px solid #d9d3ca",
            background: "#fffefa",
            boxShadow: "14px 14px 0 #d9d3ca",
          }}
        >
          <div
            style={{
              width: "58%",
              padding: "72px 64px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 92, fontWeight: 900, letterSpacing: 0, lineHeight: 1 }}>MINIU</span>
              <span style={{ marginTop: 12, color: "#ae4f63", fontSize: 28, fontWeight: 900 }}>●</span>
            </div>
            <div style={{ color: "#ae4f63", fontSize: 44, fontWeight: 800, lineHeight: 1.28 }}>너를 알아가는 작은 세상</div>
            <div style={{ color: "#76706d", fontSize: 27, lineHeight: 1.45 }}>연인의 취향과 일상을 기억하고, 둘만의 미니유를 함께 키워요.</div>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f0ece4",
              borderLeft: "4px solid #d9d3ca",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 44,
                right: 44,
                bottom: 78,
                height: 74,
                borderRadius: "50%",
                background: "#dcd7f0",
                border: "6px solid #e8e2f4",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <div
                style={{
                  width: 112,
                  height: 148,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f2b9bc",
                  border: "5px solid #ae4f63",
                  color: "#fffefa",
                  fontSize: 52,
                  fontWeight: 900,
                }}
              >
                M
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "18px 24px",
                  background: "#fffefa",
                  border: "3px solid #d9d3ca",
                  boxShadow: "8px 8px 0 #d9d3ca",
                  color: "#ae4f63",
                  fontSize: 40,
                  fontWeight: 800,
                }}
              >
                함께 기억해요
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

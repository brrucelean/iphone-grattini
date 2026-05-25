import { C, FONT } from "../data/theme.js";

// ─── SHARED STYLES ───────────────────────────────────────────
export const S = {
  container: {
    fontFamily: FONT, color: C.text, height: "100%",
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "0", boxSizing: "border-box", userSelect: "none",
    imageRendering: "pixelated",
    fontSize: "clamp(13px, 1vw, 16px)", lineHeight: "1.4",
    overflowX: "hidden",
    background: C.bg,
  },
  panel: {
    background: C.card, border: `1px solid ${C.dim}33`, borderRadius: "0",
    padding: "clamp(10px, 1.5vh, 18px) clamp(12px, 2vw, 28px)",
    margin: "4px clamp(8px, 2vw, 24px)", width: "calc(100% - clamp(16px, 4vw, 48px))", maxWidth: "1100px",
    boxShadow: `0 0 8px ${C.cyan}15, inset 0 0 20px #00000088`,
  },
  btn: {
    fontFamily: FONT, background: "#0a0a12", color: C.text, border: `1px solid ${C.dim}`,
    padding: "8px 16px", cursor: "pointer", borderRadius: "0", fontSize: "13px",
    transition: "none", textShadow: `0 0 6px ${C.cyan}44`,
  },
  btnGold: {
    fontFamily: FONT, background: "#0a0800", color: C.gold, border: `1px solid ${C.gold}`,
    padding: "8px 16px", cursor: "pointer", borderRadius: "0", fontSize: "13px",
    transition: "none", boxShadow: `0 0 8px ${C.gold}22`, textShadow: `0 0 8px ${C.gold}66`,
  },
  btnDanger: {
    fontFamily: FONT, background: "#0a0004", color: C.red, border: `1px solid ${C.red}`,
    padding: "8px 16px", cursor: "pointer", borderRadius: "0", fontSize: "13px",
    transition: "none", boxShadow: `0 0 8px ${C.red}22`, textShadow: `0 0 8px ${C.red}66`,
  },
  btnDisabled: {
    fontFamily: FONT, background: "#080808", color: "#444", border: `1px solid #222`,
    padding: "8px 16px", borderRadius: "0", fontSize: "13px", cursor: "not-allowed",
  },
  pre: { margin: 0, fontFamily: FONT, whiteSpace: "pre", lineHeight: "1.2" },
  title: { color: C.gold, textAlign: "center", fontSize: "11px", textShadow: `0 0 10px ${C.gold}55` },
  h2: { color: C.cyan, margin: "0 0 8px 0", fontSize: "15px", textShadow: `0 0 12px ${C.cyan}66` },
  h3: { color: C.gold, margin: "8px 0 4px 0", fontSize: "14px", textShadow: `0 0 10px ${C.gold}55` },
};

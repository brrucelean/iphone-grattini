import { useState } from "react";
import { createPortal } from "react-dom";
import { C, FONT } from "../data/theme.js";

export function Tooltip({ text, children, color }) {
  const [pos, setPos] = useState(null);
  const borderCol = color || C.magenta;
  const tooltipEl = pos && text
    ? createPortal(
        <div style={{
          position:"fixed", left: pos.x, top: pos.y,
          zIndex:99999,
          background:"#0a000a", border:`2px solid ${borderCol}`,
          padding:"5px 9px", fontSize:"11px", color:C.text, fontFamily:FONT,
          maxWidth:"220px", pointerEvents:"none", lineHeight:"1.5",
          whiteSpace:"pre-wrap", width:"max-content",
        }}>{text}</div>,
        document.body
      )
    : null;
  return (
    <span style={{display:"inline-block", cursor:"inherit"}}
      onMouseMove={e => {
        e.stopPropagation();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const nearRight = e.clientX > vw - 240;
        const nearBottom = e.clientY > vh - 80;
        const x = nearRight ? e.clientX - 230 : e.clientX + 14;
        const y = nearBottom ? e.clientY - 60 : e.clientY + 18;
        setPos({ x, y });
      }}
      onMouseLeave={() => setPos(null)}>
      {children}
      {tooltipEl}
    </span>
  );
}

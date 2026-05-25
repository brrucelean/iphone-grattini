import { useState, useEffect, useRef } from "react";
import { C, FONT } from "../data/theme.js";
import { NPC_ART, SPR_BIG, SPR_COLOR } from "../data/art.js";
import { AudioEngine } from "../audio.js";
import { CornerBrackets } from "./Vintage.jsx";

export function DialogueBox({ npc, name, color, text, footer }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const portrait = SPR_BIG[npc];

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      if (i >= text.length) { clearInterval(iv); setDone(true); return; }
      setDisplayed(text.slice(0, i + 1));
      if (i % 3 === 0 && text[i] !== ' ' && text[i] !== '"') AudioEngine.dialogueTick();
      i++;
    }, 28);
    return () => clearInterval(iv);
  }, [text, npc]);

  const skip = () => { setDisplayed(text); setDone(true); };

  return (
    <div onClick={skip} style={{
      display:"flex", gap:"0", cursor:"pointer",
      border:`2px solid ${color}66`,
      boxShadow:`0 0 30px ${color}22, inset 0 0 60px ${color}08`,
      background:"#04040e",
      animation:"dialogueIn 0.3s ease-out",
      minHeight:"200px",
      position:"relative",
    }}>
      <CornerBrackets color={color} size={13} inset={-3} thickness={2} glow />
      {/* Ritratto ASCII sinistro */}
      <div style={{
        flexShrink:0, width:"160px",
        borderRight:`1px solid ${color}44`,
        background:`linear-gradient(180deg, ${color}08 0%, transparent 100%)`,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:"12px 8px",
      }}>
        {/* Nameplate solid sopra il portrait */}
        <div style={{
          display:"inline-block", background: color, color:"#000",
          fontSize:"8px", fontWeight:"bold", letterSpacing:"2.5px",
          padding:"2px 7px", marginBottom:"10px",
          boxShadow:`0 0 8px ${color}aa`,
        }}>★ {name.toUpperCase()} ★</div>
        {portrait && (
          <pre style={{
            color: color+"cc", fontSize:"9.5px", lineHeight:"1.35", margin:0,
            fontFamily: FONT,
            textShadow:`0 0 6px ${color}55`,
          }}>{portrait.join("\n")}</pre>
        )}
        <div style={{
          marginTop:"6px", fontSize:"8px", color: color+"99",
          letterSpacing:"2px",
        }}>─ RITRATTO ─</div>
      </div>
      {/* Testo dialogo destro */}
      <div style={{
        flex:1, padding:"20px 24px",
        display:"flex", flexDirection:"column", justifyContent:"flex-start",
      }}>
        <div style={{
          color: color, fontSize:"13px", fontWeight:"bold", letterSpacing:"3px",
          marginBottom:"14px",
          textShadow:`0 0 10px ${color}, 0 0 18px ${color}55`,
          borderBottom:`1px solid ${color}33`, paddingBottom:"8px",
          flexShrink:0, fontFamily:FONT,
        }}>⬡ {name} ⬡</div>
        {/* Ghost testo pieno — riserva spazio, evita reflow durante typewriter */}
        <div style={{position:"relative", flex:1}}>
          <div style={{
            visibility:"hidden",
            fontSize:"13px", lineHeight:"1.9", fontStyle:"italic", whiteSpace:"pre-wrap",
          }}>❝{text}❞</div>
          <div style={{
            position:"absolute", top:0, left:0, right:0,
            color:"#e0e0e0", fontSize:"13px", lineHeight:"1.9",
            fontStyle:"italic", whiteSpace:"pre-wrap",
            textShadow:`0 0 3px ${color}22`,
          }}>
            <span style={{color, opacity:0.75, marginRight:"2px"}}>❝</span>
            {displayed}
            {!done && <span style={{
              color: color,
              animation:"dialogueCursor 0.5s step-start infinite",
            }}>▌</span>}
            {done && <span style={{color, opacity:0.75, marginLeft:"2px"}}>❞</span>}
          </div>
        </div>
        {done && footer && (
          <div style={{marginTop:"12px", flexShrink:0}}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CARMELO LOG BOX ─────────────────────────────────────────
// Extracts plain text from a message (string or array of segments)
export function msgPlainText(msg) {
  if (Array.isArray(msg)) return msg.map(s => s.t).join("");
  return msg;
}

// Renders a message with optional colored segments (full or partial up to charCount)
export function MsgRender({ msg, color, style = {}, charCount = Infinity }) {
  if (!Array.isArray(msg)) {
    const txt = typeof msg === "string" ? msg.slice(0, charCount) : String(msg).slice(0, charCount);
    return <span style={{color, ...style}}>{txt}</span>;
  }
  let remaining = charCount;
  return <span style={style}>{msg.map((seg, i) => {
    if (remaining <= 0) return null;
    const txt = seg.t.slice(0, remaining);
    remaining -= seg.t.length;
    return <span key={i} style={{color: seg.c || color}}>{txt}</span>;
  })}</span>;
}

export function CarmeloLogBox({ npc, name, color, messages, footer, height="170px" }) {
  const portrait = SPR_BIG[npc];
  const scrollRef = useRef(null);
  const [typedText, setTypedText] = useState("");
  const [typingDone, setTypingDone] = useState(true);
  const latest = messages.length > 0 ? messages[messages.length - 1] : "";
  const prevMsgs = messages.slice(0, -1);
  const latestPlain = msgPlainText(latest);

  useEffect(() => {
    if (!latest) return;
    setTypedText(""); setTypingDone(false);
    let i = 0;
    const iv = setInterval(() => {
      if (i >= latestPlain.length) { clearInterval(iv); setTypingDone(true); return; }
      setTypedText(latestPlain.slice(0, i + 1));
      if (i % 3 === 0 && latestPlain[i] !== ' ' && latestPlain[i] !== '"') AudioEngine.dialogueTick();
      i++;
    }, 28);
    return () => clearInterval(iv);
  }, [latestPlain]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typedText]);

  const skip = () => { setTypedText(latestPlain); setTypingDone(true); };

  return (
    <div onClick={skip} style={{
      display:"flex", cursor:"pointer",
      border:`2px solid ${color}66`,
      boxShadow:`0 0 30px ${color}22, inset 0 0 60px ${color}08`,
      background:"#04040e", animation:"dialogueIn 0.3s ease-out", height, flexShrink:0,
      position:"relative",
    }}>
      <CornerBrackets color={color} size={13} inset={-3} thickness={2} glow />
      <div style={{
        flexShrink:0, width:"160px", borderRight:`1px solid ${color}44`,
        background:`linear-gradient(180deg, ${color}08 0%, transparent 100%)`,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:"12px 8px", overflow:"hidden",
      }}>
        <div style={{
          display:"inline-block", background: color, color:"#000",
          fontSize:"8px", fontWeight:"bold", letterSpacing:"2.5px",
          padding:"2px 7px", marginBottom:"10px",
          boxShadow:`0 0 8px ${color}aa`,
        }}>★ {name.toUpperCase()} ★</div>
        {portrait && (
          <pre style={{color:color+"cc", fontSize:"9.5px", lineHeight:"1.35", margin:0,
            fontFamily:FONT, textShadow:`0 0 6px ${color}55`,
          }}>{portrait.join("\n")}</pre>
        )}
      </div>
      <div style={{flex:1, padding:"20px 24px", display:"flex", flexDirection:"column", minHeight:0}}>
        <div style={{color, fontSize:"13px", fontWeight:"bold", letterSpacing:"3px",
          marginBottom:"14px",
          textShadow:`0 0 10px ${color}, 0 0 18px ${color}55`,
          borderBottom:`1px solid ${color}33`, paddingBottom:"8px", flexShrink:0,
          fontFamily:FONT,
        }}>⬡ {name} ⬡</div>
        <div ref={scrollRef} style={{
          flex:1, overflowY:"auto", minHeight:0,
          scrollbarWidth:"thin", scrollbarColor:`${color}33 transparent`,
          display:"flex", flexDirection:"column", gap:"6px",
        }}>
          {prevMsgs.map((msg, i) => (
            <div key={i} style={{fontSize:"12px", fontStyle:"italic",
              lineHeight:"1.7", whiteSpace:"pre-wrap",
            }}>"<MsgRender msg={msg} color="#555" />"</div>
          ))}
          {latest && (
            <div style={{fontSize:"12px", fontStyle:"italic",
              lineHeight:"1.7", whiteSpace:"pre-wrap",
            }}>
              "
              <MsgRender msg={latest} color="#e0e0e0"
                charCount={typingDone ? Infinity : typedText.length} />
              {!typingDone && <span style={{color, animation:"dialogueCursor 0.5s step-start infinite"}}>▌</span>}
              {typingDone && `"`}
            </div>
          )}
        </div>
        {footer && <div style={{marginTop:"12px", flexShrink:0}}>{footer}</div>}
      </div>
    </div>
  );
}

export function CarmeloLogMini({ messages, color }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);
  if (!messages || messages.length === 0) return null;
  return (
    <div style={{borderTop:`1px solid ${color}22`, padding:"8px 6px", display:"flex", flexDirection:"column"}}>
      <div style={{color, fontSize:"9px", letterSpacing:"2px", marginBottom:"5px", opacity:0.7}}>
        🧓 carmelo
      </div>
      <div ref={scrollRef} style={{maxHeight:"110px", overflowY:"auto", scrollbarWidth:"none",
        display:"flex", flexDirection:"column", gap:"6px",
      }}>
        {messages.slice(-6).map((msg, i, arr) => (
          <div key={i} style={{
            fontSize:"10px", fontStyle:"italic", lineHeight:"1.4",
          }}>
            "
            <MsgRender msg={msg} color={i === arr.length-1 ? color+"dd" : "#444"}
              style={{color: i === arr.length-1 ? color+"dd" : "#444"}} />
            "
          </div>
        ))}
      </div>
    </div>
  );
}

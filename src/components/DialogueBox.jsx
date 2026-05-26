import { useState, useEffect, useRef } from "react";
import { C, FONT } from "../data/theme.js";
import { NPC_ART, SPR_BIG, SPR_COLOR } from "../data/art.js";
import { AudioEngine } from "../audio.js";
import { CornerBrackets } from "./Vintage.jsx";
import { normalizePortrait } from "../utils/nail.js";

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
          }}>{normalizePortrait(portrait).join("\n")}</pre>
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
  // Mostra SOLO l'ultimo messaggio — no accumulo di prevMsgs
  const latest = messages.length > 0 ? messages[messages.length - 1] : "";
  const latestPlain = msgPlainText(latest);

  useEffect(() => {
    if (!latest) return;
    setTypedText(""); setTypingDone(false);
    // Nuovo messaggio → scolla in testa così si legge dall'inizio
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    let i = 0;
    const iv = setInterval(() => {
      if (i >= latestPlain.length) { clearInterval(iv); setTypingDone(true); return; }
      setTypedText(latestPlain.slice(0, i + 1));
      if (i % 3 === 0 && latestPlain[i] !== ' ' && latestPlain[i] !== '"') AudioEngine.dialogueTick();
      i++;
    }, 28);
    return () => clearInterval(iv);
  }, [latestPlain]);

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
        flexShrink:0, width:"110px", borderRight:`1px solid ${color}44`,
        background:`linear-gradient(180deg, ${color}08 0%, transparent 100%)`,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:"10px 6px", overflow:"hidden",
      }}>
        <div style={{
          display:"inline-block", background: color, color:"#000",
          fontSize:"7px", fontWeight:"bold", letterSpacing:"1.5px",
          padding:"2px 5px", marginBottom:"8px",
          boxShadow:`0 0 8px ${color}aa`,
          whiteSpace:"nowrap", maxWidth:"96px",
          overflow:"hidden", textOverflow:"ellipsis",
        }}>★ {name.toUpperCase()} ★</div>
        {portrait && (
          <pre style={{color:color+"cc", fontSize:"7px", lineHeight:"1.3", margin:0,
            fontFamily:FONT, textShadow:`0 0 6px ${color}55`, overflow:"hidden",
          }}>{normalizePortrait(portrait).join("\n")}</pre>
        )}
      </div>
      <div style={{flex:1, padding:"12px 14px", display:"flex", flexDirection:"column", minHeight:0}}>
        <div style={{color, fontSize:"12px", fontWeight:"bold", letterSpacing:"1.5px",
          marginBottom:"10px",
          textShadow:`0 0 10px ${color}, 0 0 18px ${color}55`,
          borderBottom:`1px solid ${color}33`, paddingBottom:"6px", flexShrink:0,
          fontFamily:FONT, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
        }}>⬡ {name} ⬡</div>
        <div ref={scrollRef} style={{
          flex:1, overflowY:"auto", minHeight:0,
          scrollbarWidth:"thin", scrollbarColor:`${color}33 transparent`,
        }}>
          {latest && (
            <div style={{fontSize:"13px", fontStyle:"italic",
              lineHeight:"1.8", whiteSpace:"pre-wrap", color:"#e0e0e0",
            }}>
              <span style={{color, opacity:0.7}}>"</span>
              <MsgRender msg={latest} color="#e0e0e0"
                charCount={typingDone ? Infinity : typedText.length} />
              {!typingDone && <span style={{color, animation:"dialogueCursor 0.5s step-start infinite"}}>▌</span>}
              {typingDone && <span style={{color, opacity:0.7}}>"</span>}
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

// ─── CARMELO SCRATCH STRIP ──────────────────────────────────
// Striscia compatta (44px): typewriter lettera per lettera + scroll
// che segue il cursore (overflow a sinistra mentre si scrive).
// Dopo la fine: scorre indietro lentamente per rileggere dall'inizio.
export function CarmeloScratchStrip({ messages, color }) {
  const latest = messages && messages.length > 0 ? messages[messages.length - 1] : "";
  const latestPlain = msgPlainText(latest);
  const [typedText, setTypedText] = useState("");
  const [done, setDone] = useState(true);
  const textRef  = useRef(null);
  const wrapRef  = useRef(null);

  // Ogni volta che arriva un nuovo messaggio: reset e riparti
  useEffect(() => {
    if (!latestPlain) return;
    setTypedText("");
    setDone(false);
    // Resetta la posizione del testo
    if (textRef.current) textRef.current.style.transform = "translateX(0)";
    let i = 0;
    const iv = setInterval(() => {
      if (i >= latestPlain.length) { clearInterval(iv); setDone(true); return; }
      setTypedText(latestPlain.slice(0, i + 1));
      if (i % 3 === 0 && latestPlain[i] !== ' ' && latestPlain[i] !== '"') AudioEngine.dialogueTick();
      i++;
    }, 28);
    return () => clearInterval(iv);
  }, [latestPlain]);

  // Dopo ogni carattere: sposta il testo a sinistra per tenere il cursore visibile
  useEffect(() => {
    if (!textRef.current || !wrapRef.current) return;
    const overflow = textRef.current.scrollWidth - wrapRef.current.clientWidth;
    if (overflow > 0) {
      textRef.current.style.transform = `translateX(-${overflow}px)`;
    }
  }, [typedText]);

  // Dopo la fine: torna lentamente all'inizio per rileggere il testo
  useEffect(() => {
    if (!done || !textRef.current || !wrapRef.current) return;
    const overflow = textRef.current.scrollWidth - wrapRef.current.clientWidth;
    if (overflow > 2) {
      // Pausa 0.8s poi scorre indietro in 1.5s
      const t = setTimeout(() => {
        if (textRef.current) {
          textRef.current.style.transition = `transform 1.5s ease-in-out`;
          textRef.current.style.transform = "translateX(0)";
        }
      }, 800);
      return () => clearTimeout(t);
    }
  }, [done]);

  const skip = () => {
    setTypedText(latestPlain);
    setDone(true);
  };

  if (!latest) return null;
  return (
    <div onClick={skip} style={{
      flexShrink:0, height:"44px",
      display:"flex", alignItems:"stretch",
      background:"#030308",
      borderTop:`1px solid ${color}44`,
      overflow:"hidden",
      boxShadow:`0 -4px 16px #00000066`,
      cursor:"pointer",
    }}>
      {/* Badge NPC fisso */}
      <div style={{
        flexShrink:0, width:"42px",
        display:"flex", alignItems:"center", justifyContent:"center",
        borderRight:`1px solid ${color}22`,
        background:`${color}08`,
        fontSize:"18px", lineHeight:1,
      }}>🧓</div>
      {/* Area testo — overflow hidden, il testo si sposta via transform */}
      <div ref={wrapRef} style={{
        flex:1, overflow:"hidden", position:"relative", display:"flex", alignItems:"center",
        maskImage:"linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)",
        WebkitMaskImage:"linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)",
      }}>
        <div ref={textRef} style={{
          whiteSpace:"nowrap",
          color: color+"cc", fontSize:"12px", fontStyle:"italic",
          textShadow:`0 0 8px ${color}33`,
          letterSpacing:"0.3px",
          willChange:"transform",
          // transition viene impostata solo dopo la fine (vedi useEffect[done])
          transition:"none",
        }}>
          {typedText}
          {!done && (
            <span style={{color, animation:"dialogueCursor 0.5s step-start infinite"}}>▌</span>
          )}
        </div>
      </div>
    </div>
  );
}

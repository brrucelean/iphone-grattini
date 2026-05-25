import { useState, useEffect } from "react";
import { C } from "../data/theme.js";
import { AudioEngine } from "../audio.js";
import { S } from "../utils/styles.js";
import { fmtMoney } from "../utils/money.js";
import { Tooltip } from "./Tooltip.jsx";
import { NewsTicker } from "./NewsTicker.jsx";

// ─── StatusChip: pill riutilizzabile per status effects dell'HUD ───
// Style unificato: gradient sottile + border colorato + neon glow.
// varianti:
//  - normal: chip standard
//  - danger: border più marcato + pulse animation
//  - active: più glow + textShadow (per effetti attivi tipo cappello)
function StatusChip({ color, children, danger = false, active = false, onClick, pulse = false, pulseSpeed = "1s", style = {} }) {
  return (
    <span onClick={onClick} style={{
      display:"inline-flex", alignItems:"center", gap:"3px",
      background: `linear-gradient(180deg, ${color}1c, ${color}06)`,
      border: `1px solid ${color}${danger ? "cc" : "77"}`,
      color, fontSize:"11px", fontWeight: active ? "bold" : "normal",
      padding:"2px 7px", letterSpacing:"0.5px",
      boxShadow: active
        ? `0 0 8px ${color}aa, inset 0 0 6px ${color}18`
        : danger
          ? `0 0 6px ${color}88, inset 0 0 4px ${color}14`
          : `inset 0 0 6px ${color}10`,
      textShadow: active ? `0 0 6px ${color}cc` : "none",
      cursor: onClick ? "pointer" : "default",
      animation: pulse ? `pulse ${pulseSpeed} infinite` : "none",
      userSelect:"none",
      ...style,
    }}>{children}</span>
  );
}

export function HUD({ player, onOpenInventory, inventoryOpen = false, moneyBling = 0, currentBiome = 0 }) {
  const aliveNails = player.nails.filter(n => n.state !== "morta").length;
  const [vol, setVol] = useState(AudioEngine.getVolume());
  // ── Responsive: traccia larghezza viewport per nascondere elementi non-critici
  //   quando il canvas 16:9 diventa stretto (es. schermi piccoli / finestre ridotte)
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1600);
  useEffect(() => {
    const onR = () => setVw(window.innerWidth);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
  const compact = vw < 900;   // sotto 900px nascondi ticker
  const ultraCompact = vw < 700; // sotto 700px restringe il volume slider
  const handleVol = (e) => {
    const v = parseFloat(e.target.value);
    setVol(v);
    AudioEngine.setVolume(v);
  };
  const muted = vol === 0;
  // Divider Vintage fra gruppi del HUD
  const Sep = () => (
    <span style={{color:C.dim+"66", fontSize:"10px", userSelect:"none", margin:"0 2px"}}>│</span>
  );
  return (
    <div style={{...S.panel, display:"flex", justifyContent:"space-between", alignItems:"center",
      flexWrap:"wrap", gap:"6px", padding:"8px 12px", background:"#0d0d18", borderColor:C.dim,
      maxWidth:"calc(100% - 16px)", width:"calc(100% - 16px)", margin:"4px 8px",
      boxSizing:"border-box", overflow:"hidden", minWidth:0,
      position:"relative",
      boxShadow:`0 0 10px ${C.gold}12, inset 0 0 16px #00000088`,
    }}>
      {/* ── Corner brackets Vintage (discreti) ── */}
      {["tl","tr","bl","br"].map(pos => {
        const [v,h] = pos.split("");
        return (
          <span key={pos} style={{
            position:"absolute",
            [v==="t"?"top":"bottom"]:"-2px",
            [h==="l"?"left":"right"]:"-2px",
            width:"10px", height:"10px",
            borderTop: v==="t" ? `1px solid ${C.gold}88` : "none",
            borderBottom: v==="b" ? `1px solid ${C.gold}88` : "none",
            borderLeft: h==="l" ? `1px solid ${C.gold}88` : "none",
            borderRight: h==="r" ? `1px solid ${C.gold}88` : "none",
            boxShadow:`0 0 4px ${C.gold}66`,
            pointerEvents:"none",
          }}/>
        );
      })}
      {/* ── SINISTRA: soldi + grattini ── */}
      <div style={{display:"flex", alignItems:"center", gap:"8px", flexShrink:0, minWidth:0}}>
        <Tooltip text={`🤑 i tuoi SUDATISSIMI soldi!! spendili bene o piangi`}>
          <span key={moneyBling} style={{
            display:"inline-flex", alignItems:"center", gap:"4px",
            background:`linear-gradient(180deg, ${C.gold}22, ${C.gold}08)`,
            border:`1px solid ${C.gold}aa`,
            color:C.gold, fontWeight:"bold",
            padding:"2px 8px",
            letterSpacing:"1px",
            boxShadow:`0 0 8px ${C.gold}55, inset 0 0 6px ${C.gold}14`,
            textShadow:`0 0 6px ${C.gold}88`,
            cursor:"default",
            animation: moneyBling > 0 ? "moneyBling 0.6s ease-out" : "none",
          }}>💰 €{fmtMoney(player.money)}</span>
        </Tooltip>
        <Tooltip text={`🎫 grattini tuoi — comprati al tabaccaio`}>
          <span style={{
            display:"inline-flex", alignItems:"center", gap:"3px",
            color:C.cyan, cursor:"default",
            border:`1px solid ${C.cyan}66`,
            padding:"2px 7px",
            boxShadow:`inset 0 0 6px ${C.cyan}10`,
          }}>🎫 <b>{player.scratchCards.filter(c => c.owned).length}</b></span>
        </Tooltip>
      </div>
      {/* ── STATUS CHIPS: pill style uniforme via StatusChip ── */}
      {player.items.includes("cappelloSbirro") && (
        <Tooltip text={
          player.cappelloSbirroWorn
            ? "🎩 INDOSSATO — poliziotto ti saluta, spacciatore SCAPPA! Clicca per toglierlo."
            : "🎩 In borsa — non ti protegge! Clicca per indossarlo."
        }>
          <StatusChip
            color={player.cappelloSbirroWorn ? C.gold : C.dim}
            active={player.cappelloSbirroWorn}
            onClick={onOpenInventory}
          >
            🎩{player.cappelloSbirroWorn ? "▲ ON" : "▼ off"}
          </StatusChip>
        </Tooltip>
      )}
      {player.clipViraleActive && (
        <Tooltip text="🎬 CLIP VIRALE ATTIVA! La prossima vincita sarà RIPRESA e x2!">
          <StatusChip color={C.gold} active pulse pulseSpeed="1s">
            🎬 x2
          </StatusChip>
        </Tooltip>
      )}
      {player.equippedGrattatore && (
        <Tooltip text={`${player.equippedGrattatore.name} equipaggiato — ancora ${player.equippedGrattatore.usesLeft} usi rimasti!`}>
          <StatusChip color={C.cyan}>
            {player.equippedGrattatore.emoji} <b>{player.equippedGrattatore.usesLeft}</b>
          </StatusChip>
        </Tooltip>
      )}
      {player.fortune > 0 && (() => {
        const effective = Math.min(player.fortune, 5);
        const bonus = effective * 6;
        const capped = player.fortune > 5;
        return (
          <Tooltip text={`🍀 FORTUNA +${player.fortune} — +${bonus}% probabilità vincita${capped ? " (cap a +5)" : ""} · ${player.fortuneTurns} turni rimasti`}>
            <StatusChip color={C.green} active>
              🍀 +{player.fortune}
              <span style={{fontSize:"8px", opacity:0.65, marginLeft:"2px"}}>({player.fortuneTurns}t)</span>
            </StatusChip>
          </Tooltip>
        );
      })()}
      {player.tumore && (
        <Tooltip text={`💀 TUMORE AI POLMONI — -5 Fortuna permanente. Troppo fumo.`}>
          <StatusChip color={C.red} danger pulse pulseSpeed="1.5s">
            💀 −5F
          </StatusChip>
        </Tooltip>
      )}
      {player.skills?.includes("ambidestri") && (
        <Tooltip text={`🙌 DOPPIA MANO — seconda mano con 5 dita arancioni (meno allenate)`}>
          <StatusChip color={C.magenta} active>
            🙌 DOPPIA
          </StatusChip>
        </Tooltip>
      )}
      {player.grattaMania && (
        <Tooltip text={`⚡ GRATTAMANIA ATTIVA — Premi x2 su tutto! MA ogni cella grattata danneggia 1 unghia random!`}>
          <StatusChip color={C.red} danger pulse pulseSpeed="0.6s">
            ⚡ GRATTAMANIA ☠
          </StatusChip>
        </Tooltip>
      )}
      {player.relics?.length > 0 && player.relics.map((r, i) => (
        <Tooltip key={i} text={`${r.emoji} ${r.name}\n${r.desc}\n(Reliquia permanente)`}>
          <StatusChip color={C.magenta} active>
            {r.emoji}
          </StatusChip>
        </Tooltip>
      ))}
      {/* ── CENTRO: news ticker (nascosto quando lo spazio manca) ── */}
      {!compact && <NewsTicker currentBiome={currentBiome} />}
      {/* ── DESTRA: vite + volume ── */}
      <div style={{display:"flex", alignItems:"center", gap:"8px", flexShrink:0, minWidth:0, flexWrap:"wrap", justifyContent:"flex-end"}}>
        <Tooltip text={`💀 unghie ancora vive su 5 — se arrivano a 0 sei MORTO poverino`}>
          <span style={{
            display:"inline-flex", alignItems:"center", gap:"5px",
            border:`1px solid ${aliveNails <= 1 ? C.red : aliveNails <= 2 ? C.orange : C.green}88`,
            padding:"2px 7px", cursor:"default",
            background: aliveNails <= 1 ? "#1a0005" : "transparent",
            boxShadow: aliveNails <= 1 ? `0 0 6px ${C.red}66, inset 0 0 4px ${C.red}22` : "none",
            animation: aliveNails <= 1 ? "pulse 1s infinite" : "none",
          }}>
            <span style={{color:C.dim, fontSize:"9px", letterSpacing:"1px"}}>VITE</span>
            {/* Pip bar */}
            <span style={{display:"inline-flex", gap:"2px"}}>
              {[0,1,2,3,4].map(i => {
                const filled = i < aliveNails;
                const col = aliveNails <= 1 ? C.red : aliveNails <= 2 ? C.orange : C.green;
                return (
                  <span key={i} style={{
                    display:"inline-block", width:"6px", height:"9px",
                    background: filled ? col : "#111",
                    border: `1px solid ${filled ? col+"cc" : "#2a2a2a"}`,
                    boxShadow: filled ? `0 0 3px ${col}88` : "none",
                  }}/>
                );
              })}
            </span>
            <span style={{color: aliveNails <= 1 ? C.red : aliveNails <= 2 ? C.orange : C.green, fontSize:"10px", fontWeight:"bold"}}>
              {aliveNails}/5
            </span>
          </span>
        </Tooltip>
        <Tooltip text={`🔊 volume musicale — alzalo e GODITI l'8-bit bro`}>
          <span style={{display:"flex", alignItems:"center", gap:"4px"}}>
            <span
              style={{cursor:"pointer", fontSize:"14px", userSelect:"none"}}
              onClick={() => { const v = muted ? 0.7 : 0; setVol(v); AudioEngine.setVolume(v); }}
            >{muted ? "🔇" : vol < 0.4 ? "🔈" : "🔊"}</span>
            <input
              type="range" min="0" max="1" step="0.05" value={vol}
              onChange={handleVol}
              style={{
                width: ultraCompact ? "36px" : "60px", height:"4px", cursor:"pointer", accentColor: C.gold,
                background:"transparent",
              }}
            />
          </span>
        </Tooltip>
        {onOpenInventory && (() => {
          const tot = (player?.items?.length||0) + (player?.grattatori?.length||0);
          const chipCol = inventoryOpen ? C.magenta : (tot > 0 ? C.magenta : C.dim);
          return (
            <Tooltip text={inventoryOpen ? "" : "cosa hai nello zaino? forse niente, forse oro"}>
              <StatusChip
                color={chipCol}
                active={inventoryOpen}
                onClick={onOpenInventory}
                style={{opacity: inventoryOpen || tot > 0 ? 1 : 0.7}}
              >
                🎒 <b>{tot}</b>
              </StatusChip>
            </Tooltip>
          );
        })()}
      </div>
    </div>
  );
}

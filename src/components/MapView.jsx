import { useMemo, useRef, useEffect } from "react";
import { C, FONT } from "../data/theme.js";
import { NODE_ICONS, NODE_TOOLTIPS } from "../data/map.js";
import { BIOMES, BIOME_MODIFIERS } from "../data/biomes.js";
import { Tooltip } from "./Tooltip.jsx";
import { AudioEngine } from "../audio.js";
import { Haptics } from "../utils/haptics.js";

// ─── COSTANTI LAYOUT ─────────────────────────────────────────────
const ROW_H = 72;   // ridotto da 110 → più righe visibili contemporaneamente
const NW    = 72;   // larghezza nodo
const NH    = 54;   // altezza nodo

const DANGER_TYPES = new Set(["ladro","spacciatore","miniboss","poliziotto"]);
const SAFE_TYPES   = new Set(["locanda","tabaccaio","mendicante","sacerdote","chirurgo","maestroTe"]);

const LEGEND = [
  { col:"#ff4444", label:"PERICOLO" },
  { col:"#ffdd00", label:"NEUTRO"   },
  { col:"#44dd88", label:"SICURO"   },
  { col:"#cc99ff", label:"SEGRETO"  },
  { col:"#ff6600", label:"ELITE"    },
];

export function MapView({ map, currentRow, visitedNodes, onSelectNode, reachableNodes, currentBiome = 0, playerFortuna = 0 }) {
  const scrollRef = useRef(null);

  // ── Auto-scroll centrato sulla riga corrente ──────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Centra la riga corrente nel viewport
    const targetY = Math.max(0, currentRow * ROW_H - el.clientHeight / 2 + ROW_H / 2);
    const fromRow = Math.round(el.scrollTop / ROW_H);
    const rowDist = Math.abs(fromRow - currentRow);
    const ticks   = Math.min(rowDist, 5);
    for (let i = 0; i < ticks; i++) setTimeout(() => AudioEngine.mapTick(), i * 60 + 20);
    el.scrollTo({ top: targetY, behavior: "smooth" });
  }, [currentRow, map]);

  const vw      = typeof window !== "undefined" ? window.innerWidth : 393;
  const W       = Math.min(780, vw - 8);
  const totalH  = map.rows.length * ROW_H;

  const nodePos = useMemo(() => {
    const pos = {};
    const usableW = Math.max(NW, W - NW);
    map.rows.forEach((row, rIdx) => {
      row.forEach(node => {
        pos[node.id] = {
          cx: NW / 2 + node.x * usableW,
          cy: rIdx * ROW_H + ROW_H / 2,
        };
      });
    });
    return pos;
  }, [map, W]);

  const edges = useMemo(() => {
    const list = [];
    Object.entries(map.connections).forEach(([fromId, toIds]) => {
      toIds.forEach(toId => {
        const fromNode = map.rows.flat().find(n => n.id === fromId);
        const toNode   = map.rows.flat().find(n => n.id === toId);
        const rowDiff  = toNode ? (toNode.row - (fromNode?.row ?? 0)) : 1;
        list.push({ fromId, toId, isShortcut: rowDiff > 1 });
      });
    });
    return list;
  }, [map]);

  const edgeColor = (toId, isActive, isPast, isShortcut) => {
    if (isPast)    return "#cc9900";
    if (!isActive) return "#1a1a2e";
    if (isShortcut) return C.magenta;
    const n = map.rows.flat().find(n => n.id === toId);
    if (!n) return `${C.gold}88`;
    if (DANGER_TYPES.has(n.type)) return `${C.red}bb`;
    if (SAFE_TYPES.has(n.type))   return `#44dd88bb`;
    if (n.type === "boss")         return `${C.red}dd`;
    if (n.type === "evento")       return `${C.magenta}99`;
    return `${C.gold}99`;
  };

  const biomeColor = BIOMES[currentBiome]?.color || C.cyan;
  const biomeName  = BIOMES[currentBiome]?.name  || "Tabacchitalia Nord";
  const biomeBoss  = BIOMES[currentBiome]?.boss  || "Il Broker";
  const totalRows  = map.rows.length;
  const progressRow = Math.min(currentRow + 1, totalRows);
  const progressPct = (progressRow / totalRows) * 100;
  const BIOME_GLYPH = ["🏭","🎰","🍕","🏮"];
  const biomeGlyph  = BIOME_GLYPH[currentBiome] || "🏭";
  const mod = BIOME_MODIFIERS[currentBiome];

  return (
    <div style={{
      display:"flex", flexDirection:"column",
      border:`2px solid ${biomeColor}`,
      background:"#05050f",
      position:"relative",
      boxShadow:`0 0 0 1px #000, 0 0 28px ${biomeColor}28`,
      flex:1, minHeight:0, overflow:"hidden",
    }}>

      {/* ── keyframes ── */}
      <style>{`
        @keyframes mapRowPulse {
          0%,100% { background:${biomeColor}18; }
          50%      { background:${biomeColor}2e; }
        }
        @keyframes mapNodeGlow {
          0%,100% { box-shadow:0 0 10px currentColor,0 0 4px currentColor inset; }
          50%      { box-shadow:0 0 22px currentColor,0 0 8px currentColor inset; }
        }
        @keyframes mapBossGlow {
          0%,100% { box-shadow:0 0 18px #ff2244ee,0 0 36px #ff224444,2px 2px 0 #000; }
          50%      { box-shadow:0 0 28px #ff2244ff,0 0 56px #ff224466,2px 2px 0 #000; }
        }
        @keyframes mapTrailFlow {
          0%   { stroke-dashoffset:24; }
          100% { stroke-dashoffset:0; }
        }
        @keyframes mapHeadPulse {
          0%,100% { box-shadow:inset 0 -1px 0 0 ${biomeColor}00; }
          50%      { box-shadow:inset 0 -2px 0 0 ${biomeColor}55; }
        }
        @keyframes progShimmer {
          0%   { background-position:200% 0; }
          100% { background-position:-200% 0; }
        }
        @keyframes mapArrow {
          0%,100% { opacity:1; transform:translateX(0); }
          50%      { opacity:0.6; transform:translateX(4px); }
        }
        .map-node-tap:active { transform:scale(0.92)!important; filter:brightness(1.3)!important; }
      `}</style>

      {/* ══ HEADER COMPATTO ═══════════════════════════════════════ */}
      <div style={{
        flexShrink:0,
        background:`linear-gradient(180deg,${biomeColor}1e 0%,${biomeColor}08 100%)`,
        borderBottom:`2px solid ${biomeColor}77`,
        animation:"mapHeadPulse 3s ease-in-out infinite",
        padding:"7px 10px 6px",
        display:"flex", alignItems:"center", gap:"8px",
      }}>
        {/* Glyph */}
        <span style={{
          fontSize:"24px", flexShrink:0, lineHeight:1,
          filter:`drop-shadow(0 0 6px ${biomeColor}) drop-shadow(0 0 12px ${biomeColor}55)`,
        }}>{biomeGlyph}</span>

        {/* Nome + badge */}
        <div style={{flex:1, minWidth:0}}>
          <div style={{display:"flex", alignItems:"center", gap:"4px", marginBottom:"2px", flexWrap:"wrap"}}>
            <span style={{
              background:biomeColor, color:"#000",
              fontFamily:FONT, fontWeight:"bold",
              fontSize:"7px", letterSpacing:"1.5px",
              padding:"1px 5px",
              boxShadow:`0 0 5px ${biomeColor}`,
            }}>BIOMA {currentBiome+1}/4</span>
            <span style={{
              background:`${biomeColor}1a`, border:`1px solid ${biomeColor}44`,
              color:biomeColor, fontSize:"7px",
              fontFamily:FONT, letterSpacing:"1px", padding:"1px 4px",
            }}>RIGA {progressRow}/{totalRows}</span>
            {mod && (
              <span style={{
                color:biomeColor, fontSize:"9px", opacity:0.75,
                fontFamily:FONT, overflow:"hidden", textOverflow:"ellipsis",
                whiteSpace:"nowrap", maxWidth:"120px",
              }}>{mod.emoji} {mod.label}</span>
            )}
          </div>
          <div style={{
            color:biomeColor, fontFamily:FONT, fontWeight:"bold",
            fontSize:"13px", letterSpacing:"2px",
            textShadow:`0 0 10px ${biomeColor}bb`,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            lineHeight:1.1,
          }}>{biomeName.toUpperCase()}</div>
        </div>

        {/* Boss + progress */}
        <div style={{flexShrink:0, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"3px"}}>
          <div style={{display:"flex", alignItems:"center", gap:"4px"}}>
            <span style={{
              background:`${C.red}bb`, color:"#fff",
              fontFamily:FONT, fontWeight:"bold",
              fontSize:"7px", letterSpacing:"1px",
              padding:"1px 4px",
              boxShadow:`0 0 5px ${C.red}77`,
            }}>BOSS</span>
            <span style={{
              color:`${C.red}cc`, fontSize:"9px",
              fontFamily:FONT, fontWeight:"bold",
              textShadow:`0 0 4px ${C.red}77`,
              letterSpacing:"0.5px", whiteSpace:"nowrap",
            }}>{biomeBoss.toUpperCase()}</span>
          </div>
          {/* Progress bar */}
          <div style={{
            width:"72px", height:"6px",
            background:"#111", border:`1px solid ${biomeColor}44`,
            position:"relative", overflow:"hidden",
          }}>
            <div style={{
              position:"absolute", inset:0, width:`${progressPct}%`,
              background:`linear-gradient(90deg,${biomeColor}77,${biomeColor},${C.red})`,
              backgroundSize:"200% 100%",
              animation:"progShimmer 2.2s linear infinite",
              transition:"width 0.5s",
            }}/>
            <div style={{
              position:"absolute", inset:0,
              backgroundImage:"repeating-linear-gradient(90deg,transparent 0,transparent 3px,rgba(0,0,0,0.3) 3px,rgba(0,0,0,0.3) 4px)",
              pointerEvents:"none",
            }}/>
          </div>
          {/* Legenda inline */}
          <div style={{display:"flex", gap:"5px", flexWrap:"nowrap"}}>
            {LEGEND.map(({col,label}) => (
              <span key={label} style={{
                display:"flex", alignItems:"center", gap:"2px",
                color:col, fontSize:"6px", fontFamily:FONT, letterSpacing:"0.5px", flexShrink:0,
              }}>
                <span style={{display:"inline-block", width:"5px", height:"5px", background:col, boxShadow:`0 0 3px ${col}`}}/>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══ AREA MAPPA SCROLLABILE ════════════════════════════════ */}
      <div
        ref={scrollRef}
        style={{
          flex:1, minHeight:0,
          overflowY:"auto", overflowX:"hidden",
          WebkitOverflowScrolling:"touch",
          position:"relative",
          scrollbarWidth:"thin",
          scrollbarColor:`${biomeColor}33 transparent`,
        }}
      >
        <div style={{
          position:"relative",
          width:"100%", maxWidth:`${W}px`,
          height:`${totalH}px`,
          margin:"0 auto",
        }}>

          {/* ── Righe alternate — sfondo leggero ogni riga pari ── */}
          {map.rows.map((_, rIdx) => (
            <div key={`row-bg-${rIdx}`} style={{
              position:"absolute",
              left:0, right:0,
              top: rIdx * ROW_H,
              height: ROW_H,
              background: rIdx === currentRow
                ? "transparent"  // la riga corrente ha il suo stile
                : rIdx % 2 === 0
                  ? "rgba(255,255,255,0.012)"
                  : "transparent",
              borderBottom: `1px solid rgba(255,255,255,0.025)`,
              pointerEvents:"none",
            }}/>
          ))}

          {/* ── HIGHLIGHT RIGA CORRENTE ─────────────────────────── */}
          <div style={{
            position:"absolute", left:0, right:0,
            top: currentRow * ROW_H, height: ROW_H,
            animation:"mapRowPulse 2s ease-in-out infinite",
            borderTop:`1px solid ${biomeColor}55`,
            borderBottom:`1px solid ${biomeColor}55`,
            pointerEvents:"none", zIndex:0,
          }}/>

          {/* ── Freccia SEI QUI ─────────────────────────────────── */}
          <div style={{
            position:"absolute", left:0,
            top: currentRow * ROW_H + ROW_H / 2 - 9,
            zIndex:10, pointerEvents:"none",
            animation:"mapArrow 1.4s ease-in-out infinite",
          }}>
            <div style={{
              width:0, height:0,
              borderTop:"9px solid transparent",
              borderBottom:"9px solid transparent",
              borderLeft:`12px solid ${biomeColor}`,
              filter:`drop-shadow(0 0 6px ${biomeColor})`,
            }}/>
          </div>

          {/* ── Numeri riga — sinistra verticale ────────────────── */}
          {map.rows.map((_, rIdx) => (
            <div key={`rnum-${rIdx}`} style={{
              position:"absolute",
              left: 14,
              top: rIdx * ROW_H + 2,
              color: rIdx === currentRow ? biomeColor : "#1e1e2e",
              fontSize:"7px", fontFamily:FONT, letterSpacing:"1px",
              fontWeight: rIdx === currentRow ? "bold" : "normal",
              textShadow: rIdx === currentRow ? `0 0 6px ${biomeColor}` : "none",
              pointerEvents:"none", zIndex:1,
            }}>{rIdx + 1}</div>
          ))}

          {/* ── SVG: griglia + connessioni ───────────────────────── */}
          <svg
            style={{position:"absolute", top:0, left:0, width:W, height:totalH, pointerEvents:"none", overflow:"visible"}}
          >
            <defs>
              <pattern id="mgrid" width="36" height="36" patternUnits="userSpaceOnUse">
                <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#ffffff02" strokeWidth="0.5"/>
              </pattern>
              <radialGradient id="mbioglow" cx="50%" cy="30%" r="60%">
                <stop offset="0%"   stopColor={biomeColor} stopOpacity="0.05"/>
                <stop offset="100%" stopColor={biomeColor} stopOpacity="0"/>
              </radialGradient>
              <filter id="mlineglow" x="-60%" y="-40%" width="220%" height="180%">
                <feGaussianBlur stdDeviation="2.5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="mtrailglow" x="-80%" y="-40%" width="260%" height="180%">
                <feGaussianBlur stdDeviation="3.5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#mgrid)"/>
            <rect width="100%" height="100%" fill="url(#mbioglow)"/>

            {/* Connessioni */}
            {edges.map(({ fromId, toId, isShortcut }) => {
              const from = nodePos[fromId];
              const to   = nodePos[toId];
              if (!from || !to) return null;
              const fromVisited = visitedNodes.includes(fromId);
              const toReachable = reachableNodes.includes(toId);
              const isActive    = fromVisited && toReachable;
              const isPast      = fromVisited && visitedNodes.includes(toId);

              if (!isActive && !isPast) return (
                <line key={`${fromId}-${toId}`}
                  x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy}
                  stroke="#aaaacc" strokeWidth="1" strokeOpacity="0.08"
                  strokeDasharray="2 10" strokeLinecap="round"
                />
              );

              const col = edgeColor(toId, isActive, isPast, isShortcut);

              if (isPast) return (
                <g key={`${fromId}-${toId}`}>
                  <line x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy}
                    stroke={col} strokeWidth="6" strokeOpacity="0.18"
                    strokeLinecap="round" filter="url(#mtrailglow)"/>
                  <line x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy}
                    stroke={col} strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy}
                    stroke="#ffee88" strokeWidth="1.5" strokeOpacity="0.4"
                    strokeDasharray="3 18" strokeLinecap="round"
                    style={{animation:"mapTrailFlow 1.5s linear infinite"}}/>
                </g>
              );

              if (isShortcut) {
                const ctrl1x = from.cx - 50, ctrl1y = from.cy + 22;
                const ctrl2x = to.cx   - 50, ctrl2y = to.cy   - 22;
                return (
                  <path key={`${fromId}-${toId}`}
                    d={`M ${from.cx} ${from.cy} C ${ctrl1x} ${ctrl1y} ${ctrl2x} ${ctrl2y} ${to.cx} ${to.cy}`}
                    stroke={col} strokeWidth="2.5" strokeDasharray="5 6"
                    fill="none" strokeLinecap="round" filter="url(#mlineglow)"/>
                );
              }
              return (
                <line key={`${fromId}-${toId}`}
                  x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy}
                  stroke={col} strokeWidth="2.5" strokeDasharray="5 4"
                  strokeLinecap="round" filter="url(#mlineglow)"/>
              );
            })}
          </svg>

          {/* ── NODI ─────────────────────────────────────────────── */}
          {map.rows.map((row, rIdx) => row.map(node => {
            const { cx, cy } = nodePos[node.id];
            const visited   = visitedNodes.includes(node.id);
            const reachable = reachableNodes.includes(node.id);
            const isActive  = reachable && !visited;
            const isBoss    = node.type === "boss";
            const isSecret  = !!node.secret;
            const isElite   = !!node.elite && !visited;
            const secretThreshold = BIOME_MODIFIERS[currentBiome]?.secretFortuneThreshold ?? 2;
            const secretUnlocked  = isSecret && playerFortuna >= secretThreshold;
            const effectivelyHidden = isSecret && !secretUnlocked && !visited;

            const icon = effectivelyHidden ? "🔒" : isSecret ? "🔮" : NODE_ICONS[node.type] || "?";
            const dangerNode = DANGER_TYPES.has(node.type);
            const safeNode   = SAFE_TYPES.has(node.type);

            const borderCol = visited             ? "#2a2016"
              : isBoss                            ? "#ff2244"
              : isElite                           ? C.orange
              : isActive && secretUnlocked        ? "#cc99ff"
              : isActive && dangerNode            ? "#ff4444"
              : isActive && safeNode              ? "#44dd88"
              : isActive                          ? C.gold
              : "#181828";

            const bgCol = visited                  ? "#0e0b06"
              : isBoss                             ? "#380000"
              : isElite                            ? "#271600"
              : isActive && secretUnlocked         ? "#1e0026"
              : isActive && dangerNode             ? "#2a0000"
              : isActive && safeNode               ? "#002a00"
              : isActive                           ? "#090930"
              : "#080812";

            const shadow = !visited && isActive
              ? isBoss          ? `0 0 18px ${C.red}ee,0 0 38px ${C.red}44,2px 2px 0 #000`
              : isElite         ? `0 0 14px ${C.orange}cc,2px 2px 0 #000`
              : secretUnlocked  ? `0 0 14px #cc99ffcc,2px 2px 0 #000`
              : dangerNode      ? `0 0 12px #ff4444cc,2px 2px 0 #000`
              : safeNode        ? `0 0 12px #44dd88cc,2px 2px 0 #000`
              :                   `0 0 12px ${C.gold}cc,2px 2px 0 #000`
              : "none";

            const animation = isBoss && isActive ? "mapBossGlow 1.8s infinite"
              : isActive ? "mapNodeGlow 2.6s ease-in-out infinite"
              : "none";

            const label = node.type === "boss"
              ? (node.bossName || "BOSS")
              : effectivelyHidden ? "???"
              : node.type;

            const tooltip = effectivelyHidden
              ? `🔒 Nodo Segreto — richiede Fortuna ≥ ${secretThreshold}`
              : isSecret ? "🔮 Nodo Segreto — evento raro con ricompense uniche!"
              : (isElite ? "★ ELITE — rischio e premi raddoppiati! " : "")
                + (NODE_TOOLTIPS[node.type] || node.type);

            const labelColor = visited             ? "#2e2818"
              : isBoss                             ? "#ff5577"
              : isActive && dangerNode             ? "#ff7777"
              : isActive && safeNode               ? "#77ffaa"
              : isActive && secretUnlocked         ? "#ccaaff"
              : isActive                           ? C.gold
              : "#202030";

            const borderW = isBoss ? 3 : isElite || isActive ? 2 : 1;

            return (
              <Tooltip key={node.id} text={tooltip}>
                <div
                  className={isActive && !effectivelyHidden ? "map-node-tap" : ""}
                  onClick={() => isActive && !effectivelyHidden ? (AudioEngine.mapTick(), Haptics.tap(), onSelectNode(node, rIdx)) : null}
                  style={{
                    position:"absolute",
                    left: cx - NW/2,
                    top:  cy - NH/2,
                    width: NW, height: NH,
                    display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center",
                    gap:"2px",
                    border:`${borderW}px solid ${borderCol}`,
                    background: bgCol,
                    overflow:"hidden",
                    cursor: isActive && !effectivelyHidden ? "pointer" : "default",
                    opacity: visited ? 0.42 : effectivelyHidden ? 0.4 : 1,
                    zIndex: isBoss ? 3 : isActive ? 2 : 1,
                    boxShadow: shadow,
                    transition:"transform 0.1s, box-shadow 0.15s",
                    animation,
                    userSelect:"none",
                    touchAction:"manipulation",
                    WebkitTapHighlightColor:"transparent",
                    ...(visited ? {
                      backgroundImage:"repeating-linear-gradient(45deg,#0e0b06 0px,#0e0b06 4px,#0a0806 4px,#0a0806 8px)",
                    } : isActive ? {
                      boxShadow: shadow + `, inset 0 0 8px ${borderCol}18`,
                    } : {}),
                  }}
                  onMouseEnter={e => { if(isActive && !effectivelyHidden) e.currentTarget.style.transform="scale(1.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
                  onTouchStart={e => { if(isActive && !effectivelyHidden) e.currentTarget.style.transform="scale(1.07)"; }}
                  onTouchEnd={e   => { e.currentTarget.style.transform="scale(1)"; }}
                >
                  {/* Overlay visitati */}
                  {visited && (
                    <div style={{
                      position:"absolute", inset:0,
                      background:"linear-gradient(135deg,transparent 40%,rgba(0,0,0,0.3) 60%)",
                      pointerEvents:"none",
                    }}/>
                  )}

                  {/* Riflesso top per nodi attivi */}
                  {isActive && !visited && (
                    <div style={{
                      position:"absolute", top:0, left:0, right:0,
                      height:"28%",
                      background:`linear-gradient(180deg,${borderCol}18 0%,transparent 100%)`,
                      pointerEvents:"none",
                    }}/>
                  )}

                  {/* Icona */}
                  <span style={{
                    fontSize: isBoss ? "24px" : "20px",
                    lineHeight:1,
                    filter: visited
                      ? "grayscale(0.9) brightness(0.4)"
                      : isActive
                        ? `drop-shadow(0 0 5px ${borderCol}) drop-shadow(0 0 10px ${borderCol}55)`
                        : "none",
                    position:"relative", zIndex:1,
                  }}>{icon}</span>

                  {/* Label */}
                  <span style={{
                    fontSize: isBoss ? "7.5px" : "7px",
                    color: labelColor,
                    fontFamily:FONT, fontWeight:"bold",
                    textAlign:"center", lineHeight:"1.1",
                    width:`${NW - 6}px`,
                    display:"-webkit-box",
                    WebkitLineClamp:2,
                    WebkitBoxOrient:"vertical",
                    overflow:"hidden",
                    wordBreak:"break-word",
                    textShadow: isActive && !visited ? `0 0 5px ${borderCol}` : "none",
                    position:"relative", zIndex:1,
                    letterSpacing:"0.4px",
                  }}>{label.toUpperCase()}</span>

                  {/* ✓ checkmark visitati */}
                  {visited && (
                    <span style={{
                      position:"absolute", inset:0,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:"18px", color:"#4a3a18", opacity:0.5,
                      pointerEvents:"none", zIndex:2,
                    }}>✓</span>
                  )}

                  {/* Badge ELITE */}
                  {isElite && (
                    <span style={{
                      position:"absolute", top:-7, right:-7,
                      fontSize:"8px", background:C.orange, color:"#000",
                      width:"14px", height:"14px",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontWeight:"bold",
                      boxShadow:`0 0 8px ${C.orange}bb`,
                      zIndex:3,
                    }}>★</span>
                  )}
                </div>
              </Tooltip>
            );
          }))}
        </div>
      </div>
    </div>
  );
}

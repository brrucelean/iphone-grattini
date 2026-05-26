import { useMemo, useRef, useEffect } from "react";
import { C, FONT } from "../data/theme.js";
import { NODE_ICONS, NODE_TOOLTIPS } from "../data/map.js";
import { BIOMES, BIOME_MODIFIERS } from "../data/biomes.js";
import { Tooltip } from "./Tooltip.jsx";

// ─── COSTANTI LAYOUT ─────────────────────────────────────────────
// Nodi fissi grandi → la mappa scrolla verticalmente invece di
// comprimere tutto in viewport. Su iPhone i nodi sono toccabili.
const ROW_H = 90;   // altezza per riga
const NW    = 84;   // larghezza nodo
const NH    = 66;   // altezza nodo

const DANGER_TYPES = new Set(["ladro","spacciatore","miniboss","poliziotto"]);
const SAFE_TYPES   = new Set(["locanda","tabaccaio","mendicante","sacerdote","chirurgo","maestroTe"]);

// Legenda (footer)
const LEGEND = [
  { col:"#ff4444", label:"PERICOLO" },
  { col:"#ffdd00", label:"NEUTRO"   },
  { col:"#44dd88", label:"SICURO"   },
  { col:"#cc99ff", label:"SEGRETO"  },
  { col:"#ff6600", label:"ELITE"    },
];

export function MapView({ map, currentRow, visitedNodes, onSelectNode, reachableNodes, currentBiome = 0, playerFortuna = 0 }) {
  const scrollRef = useRef(null);

  // Auto-scroll sulla riga corrente quando la mappa viene aperta o cambia riga
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const targetY = currentRow * ROW_H - el.clientHeight / 2 + ROW_H / 2;
    el.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
  }, [currentRow]);

  const rowsCount = map.rows.length || 1;
  const totalH    = rowsCount * ROW_H;
  const vw        = typeof window !== "undefined" ? window.innerWidth : 900;
  const W         = Math.min(860, vw - 16);

  // Posizioni pixel nodi (centrate, con margine NW/2 ai bordi così non vengono tagliati)
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

  // Edges con shortcut
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

  // Colore linea
  const edgeColor = (toId, isActive, isPast, isShortcut) => {
    if (isPast)    return C.gold;
    if (!isActive) return "#1e1e2e";
    if (isShortcut) return C.magenta;
    const n = map.rows.flat().find(n => n.id === toId);
    if (!n) return `${C.gold}88`;
    if (DANGER_TYPES.has(n.type)) return `${C.red}bb`;
    if (SAFE_TYPES.has(n.type))   return `#44dd88bb`;
    if (n.type === "boss")         return `${C.red}dd`;
    if (n.type === "evento")       return `${C.magenta}99`;
    return `${C.gold}99`;
  };

  // Info bioma
  const biomeColor = BIOMES[currentBiome]?.color || C.cyan;
  const biomeName  = BIOMES[currentBiome]?.name  || "Tabacchitalia Nord";
  const biomeBoss  = BIOMES[currentBiome]?.boss  || "Il Broker";
  const biomeDesc  = BIOMES[currentBiome]?.desc  || "";
  const totalRows  = map.rows.length;
  const progressRow = Math.min(currentRow + 1, totalRows);
  const progressPct = (progressRow / totalRows) * 100;
  const BIOME_GLYPH = ["🏭","🎰","🍕","🏮"];
  const biomeGlyph  = BIOME_GLYPH[currentBiome] || "🏭";

  return (
    <div style={{
      display:"flex", flexDirection:"column",
      border:`2px solid ${biomeColor}`,
      background:"#05050f",
      position:"relative",
      boxShadow:`4px 4px 0 #000000, 0 0 28px ${biomeColor}44`,
      flex:1, minHeight:0, overflow:"hidden",
    }}>

      {/* ── HEADER COMPATTO — una sola riga ────────────────────── */}
      <div style={{
        flexShrink:0,
        padding:"8px 12px",
        background:`${biomeColor}1a`,
        borderBottom:`2px solid ${biomeColor}`,
        display:"flex", alignItems:"center", gap:"10px",
      }}>
        {/* Icona bioma */}
        <span style={{
          fontSize:"24px", flexShrink:0,
          filter:`drop-shadow(0 0 6px ${biomeColor})`,
        }}>{biomeGlyph}</span>

        {/* Nome bioma + boss */}
        <div style={{flex:1, minWidth:0}}>
          <div style={{
            display:"inline-block",
            background: biomeColor, color:"#000",
            fontFamily:FONT, fontWeight:"bold",
            fontSize:"7px", letterSpacing:"2px",
            padding:"1px 6px", marginBottom:"2px",
          }}>
            BIOMA {currentBiome + 1}/4
          </div>
          <div style={{
            color: biomeColor, fontFamily:FONT, fontWeight:"bold",
            fontSize:"14px", letterSpacing:"2px",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            textShadow:`0 0 10px ${biomeColor}99`,
          }}>
            {biomeName.toUpperCase()}
          </div>
          <div style={{display:"flex", alignItems:"center", gap:"5px", marginTop:"2px"}}>
            <span style={{
              background:C.red, color:"#fff",
              fontFamily:FONT, fontWeight:"bold",
              fontSize:"7px", letterSpacing:"1px",
              padding:"1px 5px",
              boxShadow:`0 0 5px ${C.red}aa`,
            }}>BOSS</span>
            <span style={{color:C.red, fontSize:"10px", fontFamily:FONT, fontWeight:"bold", letterSpacing:"0.5px"}}>
              {biomeBoss.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Progress riga/boss */}
        <div style={{flexShrink:0, textAlign:"right"}}>
          <div style={{
            color:C.dim, fontSize:"9px", fontFamily:FONT,
            letterSpacing:"1px", marginBottom:"4px",
          }}>
            <span style={{color:biomeColor, fontWeight:"bold"}}>{progressRow}</span>
            <span style={{color:"#444"}}>/</span>
            <span>{totalRows}</span>
          </div>
          <div style={{
            width:"72px", height:"7px",
            background:"#111",
            border:`2px solid ${biomeColor}66`,
            position:"relative",
          }}>
            <div style={{
              position:"absolute", inset:0,
              width:`${progressPct}%`,
              background:`linear-gradient(90deg, ${biomeColor}, ${C.red})`,
              boxShadow:`0 0 6px ${biomeColor}`,
              transition:"width 0.5s",
            }}/>
          </div>
          <div style={{
            color:C.red, fontSize:"8px", fontFamily:FONT,
            letterSpacing:"1px", marginTop:"2px",
            textShadow:`0 0 4px ${C.red}99`,
          }}>→ BOSS</div>
        </div>
      </div>

      {/* Modificatore bioma — se presente, una strip sottile */}
      {BIOME_MODIFIERS[currentBiome] && (
        <div style={{
          flexShrink:0,
          display:"flex", alignItems:"center", gap:"5px",
          justifyContent:"center",
          padding:"3px 10px",
          background:`${biomeColor}0c`,
          borderBottom:`1px solid ${biomeColor}44`,
          fontSize:"8px", fontFamily:FONT, letterSpacing:"1px",
          color: biomeColor,
        }}>
          <span style={{fontSize:"11px"}}>{BIOME_MODIFIERS[currentBiome].emoji}</span>
          <strong>{BIOME_MODIFIERS[currentBiome].label}</strong>
          <span style={{opacity:0.55}}>—</span>
          <span style={{opacity:0.7}}>
            {BIOME_MODIFIERS[currentBiome].desc.length > 45
              ? BIOME_MODIFIERS[currentBiome].desc.slice(0, 45) + "…"
              : BIOME_MODIFIERS[currentBiome].desc}
          </span>
        </div>
      )}

      {/* ── MAPPA SCROLLABILE ───────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{
          flex:1, minHeight:0,
          overflowY:"auto", overflowX:"hidden",
          WebkitOverflowScrolling:"touch",
          position:"relative",
        }}
      >
        <div style={{
          position:"relative",
          width:"100%", maxWidth:`${W}px`,
          height:`${totalH}px`,
          margin:"0 auto",
        }}>

          {/* ── HIGHLIGHT RIGA CORRENTE ──────────────────────────── */}
          <div style={{
            position:"absolute",
            left:0, right:0,
            top: currentRow * ROW_H,
            height: ROW_H,
            background:`${biomeColor}10`,
            borderTop:`1px solid ${biomeColor}55`,
            borderBottom:`1px solid ${biomeColor}55`,
            pointerEvents:"none",
            zIndex:0,
          }}/>

          {/* ── GRIGLIA DI SFONDO ────────────────────────────────── */}
          <svg
            style={{position:"absolute", top:0, left:0, width:"100%", height:"100%", pointerEvents:"none"}}
            aria-hidden
          >
            <defs>
              <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff05" strokeWidth="0.5"/>
              </pattern>
              <radialGradient id="biomeGlowMap" cx="50%" cy="40%" r="55%">
                <stop offset="0%"   stopColor={biomeColor} stopOpacity="0.06"/>
                <stop offset="100%" stopColor={biomeColor} stopOpacity="0"/>
              </radialGradient>
              <filter id="lineglow" x="-50%" y="-20%" width="200%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#mapgrid)"/>
            <rect width="100%" height="100%" fill="url(#biomeGlowMap)"/>
          </svg>

          {/* ── LINEE DI CONNESSIONE ─────────────────────────────── */}
          <svg
            style={{position:"absolute", top:0, left:0, width:W, height:totalH, pointerEvents:"none", overflow:"visible"}}
          >
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
                  stroke="#aaaacc" strokeWidth="1.5" strokeOpacity="0.18"
                  strokeDasharray="3 8" strokeLinecap="round"
                />
              );

              const sw   = isPast ? 4 : 3;
              const dash = isPast ? "none" : isShortcut ? "5 6" : "7 5";
              const col  = edgeColor(toId, isActive, isPast, isShortcut);

              if (isPast) return (
                <line key={`${fromId}-${toId}`}
                  x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy}
                  stroke={col} strokeWidth={sw}
                  strokeLinecap="round"
                  filter="url(#lineglow)"
                />
              );

              if (isShortcut) {
                const ctrl1x = from.cx - 50, ctrl1y = from.cy + 25;
                const ctrl2x = to.cx   - 50, ctrl2y = to.cy   - 25;
                return (
                  <path key={`${fromId}-${toId}`}
                    d={`M ${from.cx} ${from.cy} C ${ctrl1x} ${ctrl1y} ${ctrl2x} ${ctrl2y} ${to.cx} ${to.cy}`}
                    stroke={col} strokeWidth={sw} strokeDasharray={dash}
                    fill="none" strokeLinecap="round" filter="url(#lineglow)"
                  />
                );
              }
              return (
                <line key={`${fromId}-${toId}`}
                  x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy}
                  stroke={col} strokeWidth={sw} strokeDasharray={dash}
                  strokeLinecap="round"
                />
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

            // Bordo — più spesso se cliccabile
            const borderWidth = isBoss ? 3 : isElite || (isActive && secretUnlocked) ? 3 : isActive ? 2 : 1;
            const borderCol   = visited             ? "#1a1a28"
              : isBoss                              ? "#ff2244"
              : isElite                             ? C.orange
              : isActive && secretUnlocked          ? "#cc99ff"
              : isActive && dangerNode              ? "#ff4444"
              : isActive && safeNode                ? "#44dd88"
              : isActive                            ? C.gold
              : "#252538";

            // Sfondo — vivido per nodi attivi, quasi-nero altrimenti
            const bgCol = visited                   ? "#0a0a0a"
              : isBoss                              ? "#3a0000"
              : isElite                             ? "#2a1800"
              : isActive && secretUnlocked          ? "#200028"
              : isActive && dangerNode              ? "#2e0000"
              : isActive && safeNode                ? "#002e00"
              : isActive                            ? "#0c0c30"
              : "#0a0a12";

            const shadow = isActive
              ? isBoss
                ? `0 0 24px ${C.red}ee, 0 0 48px ${C.red}66, 3px 3px 0 #000`
                : isElite
                  ? `0 0 18px ${C.orange}dd, 3px 3px 0 #000`
                  : secretUnlocked
                    ? `0 0 18px #cc99ffdd, 3px 3px 0 #000`
                    : dangerNode
                      ? `0 0 16px #ff4444dd, 3px 3px 0 #000`
                      : safeNode
                        ? `0 0 16px #44dd88dd, 3px 3px 0 #000`
                        : `0 0 16px ${C.gold}dd, 3px 3px 0 #000`
              : "none";

            const animation = isBoss && isActive ? "bossGlow 1.8s infinite"
              : isActive ? "slotGlow 2s infinite"
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

            // Etichetta nodo — tipo formattato
            const labelColor = visited             ? C.dim
              : isBoss                             ? "#ff6688"
              : isActive && dangerNode             ? "#ff8888"
              : isActive && safeNode               ? "#88ffaa"
              : isActive && secretUnlocked         ? "#ddaaff"
              : isActive                           ? C.gold
              : "#444460";

            return (
              <Tooltip key={node.id} text={tooltip}>
                <div
                  onClick={() => isActive && !effectivelyHidden ? onSelectNode(node, rIdx) : null}
                  style={{
                    position:"absolute",
                    left: cx - NW/2, top: cy - NH/2,
                    width: NW, height: NH,
                    display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center",
                    gap:"2px",
                    border: `${borderWidth}px solid ${borderCol}`,
                    background: bgCol,
                    borderRadius:"0",
                    overflow:"hidden",
                    cursor: isActive && !effectivelyHidden ? "pointer" : "default",
                    opacity: visited ? 0.35 : effectivelyHidden ? 0.5 : 1,
                    zIndex: isBoss ? 3 : isActive ? 2 : 1,
                    boxShadow: shadow,
                    transition:"transform 0.1s, box-shadow 0.2s",
                    animation,
                    userSelect:"none",
                  }}
                  onMouseEnter={e => { if(isActive && !effectivelyHidden) e.currentTarget.style.transform="scale(1.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
                  // Touch feedback
                  onTouchStart={e => { if(isActive && !effectivelyHidden) e.currentTarget.style.transform="scale(1.08)"; }}
                  onTouchEnd={e   => { e.currentTarget.style.transform="scale(1)"; }}
                >
                  {/* Emoji icona — più grande */}
                  <span style={{
                    fontSize: isBoss ? "28px" : "22px",
                    lineHeight:1,
                    filter: isActive ? `drop-shadow(0 0 5px ${borderCol})` : "none",
                  }}>
                    {icon}
                  </span>

                  {/* Etichetta tipo — 2 righe max, font 7px per evitare troncatura su iOS */}
                  <span style={{
                    fontSize: isBoss ? "9px" : "7px",
                    color: labelColor,
                    fontFamily:FONT, fontWeight:"bold",
                    textAlign:"center", lineHeight:"1.2",
                    width:`${NW - 4}px`,
                    display:"-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient:"vertical",
                    overflow:"hidden",
                    wordBreak:"break-word",
                    WebkitTextSizeAdjust:"none",
                    textSizeAdjust:"none",
                    textShadow: isActive ? `0 0 5px ${borderCol}` : "none",
                  }}>
                    {label.toUpperCase()}
                  </span>

                  {/* Badge ELITE */}
                  {isElite && (
                    <span style={{
                      position:"absolute", top:-7, right:-7,
                      fontSize:"9px", background:C.orange, color:"#000",
                      width:"16px", height:"16px",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontWeight:"bold",
                      boxShadow:`0 0 8px ${C.orange}cc`,
                    }}>★</span>
                  )}
                </div>
              </Tooltip>
            );
          }))}
        </div>
      </div>

      {/* ── LEGENDA FOOTER — strip sottile ─────────────────────── */}
      <div style={{
        flexShrink:0,
        display:"flex", alignItems:"center", gap:"10px",
        justifyContent:"center", flexWrap:"wrap",
        padding:"5px 10px",
        borderTop:`1px solid ${C.dim}44`,
        background:"#080810",
      }}>
        {LEGEND.map(({ col, label }) => (
          <span key={label} style={{
            display:"flex", alignItems:"center", gap:"3px",
            color: col, fontSize:"8px", fontFamily:FONT, letterSpacing:"1px",
          }}>
            <span style={{
              display:"inline-block", width:"7px", height:"7px",
              background: col,
              boxShadow:`0 0 4px ${col}`,
            }}/>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

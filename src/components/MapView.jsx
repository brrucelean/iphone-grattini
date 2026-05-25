import { useMemo } from "react";
import { C, FONT } from "../data/theme.js";
import { NODE_ICONS, NODE_TOOLTIPS } from "../data/map.js";
import { BIOMES, BIOME_MODIFIERS } from "../data/biomes.js";
import { Tooltip } from "./Tooltip.jsx";

export function MapView({ map, currentRow, visitedNodes, onSelectNode, reachableNodes, currentBiome = 0, playerFortuna = 0 }) {
  // ── Canvas responsivo: ROW_H scala con numero righe per NON scrollare ──
  // Stima spazio disponibile per il canvas: viewport - header(150) - hud(50) - padding(40)
  // Con 11 righe e viewport 900px: rowH ≈ (900-240)/11 ≈ 60. Clamp [48, 72].
  const rowsCount = map.rows.length || 1;
  const availH = Math.max(360, (typeof window !== "undefined" ? window.innerHeight : 900) - 240);
  const ROW_H = Math.max(50, Math.min(64, Math.floor(availH / rowsCount)));
  const W = 860;   // larghezza canvas — compatta, nodi vicini e ordinati (panel è wrapper 1100)
  const NW = 72, NH = 52;
  const totalH = rowsCount * ROW_H;

  // Glitter particles — stabili (non ricalcolate a ogni render)
  const glitter = useMemo(() => {
    const COLORS = ["#ffd700","#00e5ff","#ff44aa","#ffffff","#bb88ff","#44ff99","#ffaa00"];
    const ANIMS = ["glitA","glitB","glitC","glitD","glitE","glitF"];
    return Array.from({length: 80}, (_, i) => ({
      x: ((i * 73.7 + 11) % 97) + 1.5,
      y: ((i * 47.3 + 29) % 95) + 1.5,
      r: 0.7 + (i % 5) * 0.45,
      color: COLORS[i % COLORS.length],
      delay: (i * 0.23) % 5,
      dur: 2.0 + (i % 7) * 0.5,
      anim: ANIMS[i % ANIMS.length],
    }));
  }, []);

  // Posizioni pixel centrate per ogni nodo
  const nodePos = {};
  map.rows.forEach((row, rIdx) => {
    row.forEach(node => {
      nodePos[node.id] = { cx: node.x * W, cy: rIdx * ROW_H + ROW_H / 2 };
    });
  });

  // Legenda: edge normale vs shortcut (span > 1 riga)
  const edges = [];
  Object.entries(map.connections).forEach(([fromId, toIds]) => {
    toIds.forEach(toId => {
      const fromNode = map.rows.flat().find(n => n.id === fromId);
      const toNode   = map.rows.flat().find(n => n.id === toId);
      const rowDiff = toNode ? (toNode.row - (fromNode?.row ?? 0)) : 1;
      edges.push({ fromId, toId, isShortcut: rowDiff > 1 });
    });
  });

  const DANGER_TYPES = new Set(["ladro","spacciatore","miniboss","poliziotto"]);
  const SAFE_TYPES   = new Set(["locanda","tabaccaio","mendicante","sacerdote","chirurgo","maestroTe"]);

  // Colore edge per tipo di destinazione
  const edgeColor = (toId, isActive, isPast, isShortcut) => {
    if (isPast) return C.gold;
    if (!isActive) return "#1e1e2e";
    if (isShortcut) return C.magenta;
    const toNode = map.rows.flat().find(n => n.id === toId);
    if (!toNode) return `${C.gold}88`;
    if (DANGER_TYPES.has(toNode.type)) return `${C.red}aa`;
    if (SAFE_TYPES.has(toNode.type)) return `${C.green}aa`;
    if (toNode.type === "boss") return `${C.red}cc`;
    if (toNode.type === "evento") return `${C.magenta}88`;
    if (toNode.type === "zaino") return `${C.gold}88`;
    return `${C.gold}88`;
  };

  const biomeColor = BIOMES[currentBiome]?.color || C.cyan;
  const biomeName = BIOMES[currentBiome]?.name || "Tabacchitalia Nord";
  const biomeBoss = BIOMES[currentBiome]?.boss || "Il Broker";
  const biomeDesc = BIOMES[currentBiome]?.desc || "";
  const totalRows = map.rows.length;
  const progressRow = Math.min(currentRow + 1, totalRows);
  const progressPct = (progressRow / totalRows) * 100;

  // Emoji simbolo per bioma (ASCII-emblem per fascia superiore)
  const BIOME_GLYPH = ["🏭", "🎰", "🍕", "🏮"];
  const biomeGlyph = BIOME_GLYPH[currentBiome] || "🏭";

  // Chips legenda — colori allineati a quelli effettivi dei nodi (vedi borderCol più sotto)
  const LEGEND_CHIPS = [
    { icon:"◈", label:"PERICOLO", color:"#ff4444" }, // = nodo danger attivo
    { icon:"◈", label:"NEUTRO",   color:C.gold    }, // = nodo evento/streamer/anziana/ecc
    { icon:"◈", label:"SICURO",   color:"#44dd88" }, // = nodo safe attivo
    { icon:"🔮", label:"SEGRETO",  color:"#cc99ff" }, // = nodo segreto sbloccato
    { icon:"★", label:"ELITE",    color:C.orange },  // = nodo elite
  ];

  // Corner brackets — elemento Vintage ricorrente
  const cornerBrackets = (color, size = 12, inset = -2, borderW = 2, shadow = true) => {
    const common = {
      position:"absolute", width:`${size}px`, height:`${size}px`,
      borderColor: color, borderStyle:"solid",
      filter: shadow ? `drop-shadow(0 0 4px ${color}aa)` : "none",
      pointerEvents:"none",
    };
    return (
      <>
        <div style={{...common, top:inset,    left:inset,    borderWidth:`${borderW}px 0 0 ${borderW}px`}}/>
        <div style={{...common, top:inset,    right:inset,   borderWidth:`${borderW}px ${borderW}px 0 0`}}/>
        <div style={{...common, bottom:inset, left:inset,    borderWidth:`0 0 ${borderW}px ${borderW}px`}}/>
        <div style={{...common, bottom:inset, right:inset,   borderWidth:`0 ${borderW}px ${borderW}px 0`}}/>
      </>
    );
  };

  return (
    <div style={{
      margin:"6px auto",
      overflow:"hidden",
      border:`2px solid ${biomeColor}`,
      borderRadius:"0",
      background:"#05050f",
      position:"relative",
      boxShadow:`0 0 24px ${biomeColor}33, inset 0 0 40px ${biomeColor}11`,
    }}>
      {cornerBrackets(biomeColor, 14, -1, 2, true)}
      {/* ── HEADER — pattern Vintage con stemma bioma + chips legenda + progress ── */}
      <div style={{
        position:"sticky", top:0, zIndex:10,
        background:`linear-gradient(180deg, ${biomeColor}14, #08081899)`,
        backdropFilter:"blur(8px)",
        borderBottom:`1px solid ${biomeColor}66`,
        padding:"8px 14px 6px",
      }}>
        {/* Riga top: stemma + titolo + boss */}
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", marginBottom:"6px", position:"relative", overflow:"hidden"}}>
          {/* Foil shimmer sul titolo */}
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none",
            background:`linear-gradient(110deg, transparent 30%, ${biomeColor}22 48%, ${biomeColor}55 50%, ${biomeColor}22 52%, transparent 70%)`,
            backgroundSize:"220% 100%",
            animation:"variantShimmer 4s linear infinite",
            mixBlendMode:"screen",
          }}/>
          <div style={{display:"flex", alignItems:"center", gap:"10px", position:"relative", zIndex:2}}>
            {/* Stemma bioma con corner brackets */}
            <div style={{
              width:"42px", height:"42px", flexShrink:0, position:"relative",
              border:`2px solid ${biomeColor}`,
              background:`radial-gradient(circle, ${biomeColor}33, ${biomeColor}08)`,
              boxShadow:`0 0 12px ${biomeColor}88, inset 0 0 8px ${biomeColor}44`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"22px",
              filter:`drop-shadow(0 0 6px ${biomeColor})`,
            }}>
              {cornerBrackets(biomeColor, 6, -3, 1.5, false)}
              <span>{biomeGlyph}</span>
            </div>
            <div>
              {/* Solid badge ★ BIOMA N/4 ★ */}
              <div style={{
                display:"inline-block",
                background: biomeColor,
                color:"#000",
                fontFamily:FONT, fontWeight:"bold",
                fontSize:"8px", letterSpacing:"2px",
                padding:"2px 7px",
                boxShadow:`0 0 8px ${biomeColor}aa`,
                marginBottom:"3px",
              }}>
                ★ BIOMA {currentBiome + 1}/4 ★
              </div>
              {/* Titolo neon */}
              <div style={{color: biomeColor, fontFamily:FONT, fontWeight:"bold", fontSize:"16px", letterSpacing:"3px", textShadow:`0 0 10px ${biomeColor}99, 0 0 20px ${biomeColor}44`, lineHeight:1}}>
                ⬡ {biomeName.toUpperCase()} ⬡
              </div>
              {/* Boss badge rosso solido */}
              <div style={{marginTop:"4px", display:"flex", alignItems:"center", gap:"6px"}}>
                <span style={{
                  display:"inline-block",
                  background: C.red,
                  color:"#fff",
                  fontFamily:FONT, fontWeight:"bold",
                  fontSize:"7px", letterSpacing:"1.5px",
                  padding:"1px 6px",
                  boxShadow:`0 0 6px ${C.red}aa`,
                }}>
                  ★ BOSS ★
                </span>
                <span style={{color:C.red, fontSize:"9px", fontWeight:"bold", letterSpacing:"1px", textShadow:`0 0 4px ${C.red}88`}}>
                  {biomeBoss.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          {/* Progress row → boss con corner brackets */}
          <div style={{position:"relative", zIndex:2, textAlign:"right", flexShrink:0, padding:"4px 8px"}}>
            {cornerBrackets(biomeColor, 7, 0, 1.5, false)}
            <div style={{color:C.dim, fontSize:"8px", letterSpacing:"2px", marginBottom:"3px"}}>
              RIGA <span style={{color:biomeColor, fontWeight:"bold"}}>{progressRow}</span>/{totalRows}
            </div>
            <div style={{width:"120px", height:"6px", background:"#1a1a22", border:`1px solid ${biomeColor}66`, position:"relative"}}>
              <div style={{
                height:"100%", width:`${progressPct}%`,
                background:`linear-gradient(90deg, ${biomeColor}, ${C.red})`,
                boxShadow:`0 0 6px ${biomeColor}aa`,
                transition:"width 0.4s",
              }}/>
            </div>
            <div style={{color:C.red, fontSize:"8px", letterSpacing:"2px", marginTop:"3px", opacity:0.9, fontWeight:"bold"}}>
              → BOSS
            </div>
          </div>
        </div>
        {/* Descrizione bioma — blockquote ❝ ❞ */}
        {biomeDesc && (
          <div style={{
            position:"relative", zIndex:2,
            color:`${biomeColor}cc`, fontSize:"9px", fontStyle:"italic",
            letterSpacing:"1px", textAlign:"center",
            marginBottom:"6px", padding:"0 16px",
            textShadow:`0 0 4px ${biomeColor}44`,
            fontFamily:FONT,
          }}>
            ❝ {biomeDesc} ❞
          </div>
        )}
        {/* Modificatore bioma attivo */}
        {BIOME_MODIFIERS[currentBiome] && (
          <Tooltip text={BIOME_MODIFIERS[currentBiome].desc}>
            <div style={{
              position:"relative", zIndex:2,
              display:"inline-flex", alignItems:"center", gap:"5px",
              margin:"0 auto 8px auto",
              padding:"3px 10px",
              background: `${biomeColor}10`,
              border: `1px solid ${biomeColor}66`,
              fontSize:"8px", letterSpacing:"1.5px",
              color: biomeColor,
              textShadow:`0 0 4px ${biomeColor}88`,
              cursor:"help",
            }}>
              <span style={{fontSize:"11px"}}>{BIOME_MODIFIERS[currentBiome].emoji}</span>
              <strong>{BIOME_MODIFIERS[currentBiome].label}</strong>
              <span style={{opacity:0.6}}>· {BIOME_MODIFIERS[currentBiome].desc.length > 50 ? BIOME_MODIFIERS[currentBiome].desc.slice(0, 50) + "…" : BIOME_MODIFIERS[currentBiome].desc}</span>
            </div>
          </Tooltip>
        )}
        {/* Chips legenda con header ★ LEGENDA ★ */}
        <div style={{position:"relative", zIndex:2, display:"flex", alignItems:"center", gap:"8px", justifyContent:"center", flexWrap:"wrap"}}>
          <span style={{
            display:"inline-block",
            background: "#000",
            color: biomeColor,
            border:`1px solid ${biomeColor}88`,
            fontFamily:FONT, fontWeight:"bold",
            fontSize:"7px", letterSpacing:"2px",
            padding:"2px 6px",
            textShadow:`0 0 4px ${biomeColor}88`,
          }}>
            ★ LEGENDA ★
          </span>
          {LEGEND_CHIPS.map(chip => (
            <span key={chip.label} style={{
              display:"inline-flex", alignItems:"center", gap:"3px",
              padding:"2px 7px",
              background: `${chip.color}14`,
              border:`1px solid ${chip.color}66`,
              color: chip.color,
              fontSize:"8px", letterSpacing:"1.5px", fontWeight:"bold",
              fontFamily: FONT,
              textShadow:`0 0 4px ${chip.color}88`,
            }}>
              <span>{chip.icon}</span><span>{chip.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── CANVAS ── (responsive: se il pannello è più stretto di W, scala proporzionalmente) */}
      <div style={{
        position:"relative",
        width:`${W}px`, maxWidth:"100%",
        height:`${totalH}px`,
        margin:"0 auto",
        overflow:"hidden",
      }}>

        {/* SFONDO GLITTER ANIMATO */}
        <svg style={{position:"absolute", top:0, left:0, width:"100%", height:"100%", pointerEvents:"none"}} aria-hidden>
          {/* Griglia di sfondo sottile */}
          <defs>
            <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff06" strokeWidth="0.5"/>
            </pattern>
            <filter id="lineglow" x="-50%" y="-20%" width="200%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="nodeglow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Glow orb di sfondo per ogni bioma */}
            <radialGradient id="biomeGlow" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor={biomeColor} stopOpacity="0.06"/>
              <stop offset="100%" stopColor={biomeColor} stopOpacity="0"/>
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapgrid)"/>
          <rect width="100%" height="100%" fill="url(#biomeGlow)"/>

          {/* Glitter particles */}
          {glitter.map((g, i) => (
            <circle key={i}
              cx={`${g.x}%`} cy={`${g.y}%`} r={g.r}
              fill={g.color}
              style={{
                animation:`${g.anim} ${g.dur}s ${g.delay}s infinite ease-in-out`,
                opacity:0,
              }}
            />
          ))}
        </svg>

        {/* ── LINEE DI CONNESSIONE ── */}
        <svg style={{position:"absolute", top:0, left:0, width:W, height:totalH, pointerEvents:"none", overflow:"visible"}}>
          <defs>
            {/* Gradient per ogni tipo di percorso */}
            <linearGradient id="edgePast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.gold} stopOpacity="0.9"/>
              <stop offset="100%" stopColor={C.gold} stopOpacity="0.4"/>
            </linearGradient>
            <linearGradient id="edgeDanger" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={C.red} stopOpacity="0.7"/>
              <stop offset="100%" stopColor="#ff8800" stopOpacity="0.4"/>
            </linearGradient>
            <linearGradient id="edgeSafe" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={C.green} stopOpacity="0.7"/>
              <stop offset="100%" stopColor={C.cyan} stopOpacity="0.4"/>
            </linearGradient>
            <linearGradient id="edgeNeutral" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={C.gold} stopOpacity="0.5"/>
              <stop offset="100%" stopColor={C.gold} stopOpacity="0.2"/>
            </linearGradient>
            <linearGradient id="edgeShortcut" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={C.magenta} stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#aa44ff" stopOpacity="0.4"/>
            </linearGradient>
          </defs>

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
                stroke="#ffffff" strokeWidth="1" strokeOpacity="0.12"
                strokeDasharray="3 7" strokeLinecap="round"
              />
            );

            const sw   = isPast ? 2.5 : 2;
            const dash = isPast ? "none" : isShortcut ? "4 6" : "6 5";
            const col  = edgeColor(toId, isActive, isPast, isShortcut);

            if (isShortcut) {
              const ctrl1x = from.cx - 40, ctrl1y = from.cy + 20;
              const ctrl2x = to.cx - 40,   ctrl2y = to.cy   - 20;
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

        {/* ── NODI ── */}
        {map.rows.map((row, rIdx) => row.map(node => {
          const { cx, cy } = nodePos[node.id];
          const visited   = visitedNodes.includes(node.id);
          const reachable = reachableNodes.includes(node.id);
          const isActive  = reachable && !visited;
          const isBoss    = node.type === "boss";
          const isSecret  = !!node.secret;
          const isElite   = !!node.elite && !visited;
          // Modificatore bioma 3 (Cinese, Lanterne Rosse): soglia segreto abbassata
          const secretThreshold = BIOME_MODIFIERS[currentBiome]?.secretFortuneThreshold ?? 2;
          const secretUnlocked = isSecret && playerFortuna >= secretThreshold;
          const effectivelyHidden = isSecret && !secretUnlocked && !visited;

          const icon = effectivelyHidden ? "🔒" : isSecret ? "🔮" : NODE_ICONS[node.type] || "?";
          const dangerNode = DANGER_TYPES.has(node.type);
          const safeNode   = SAFE_TYPES.has(node.type);

          // Colori nodo (vedi LEGEND_CHIPS — devono restare allineati)
          const borderWidth = isBoss || isElite || (isActive && secretUnlocked) ? 2 : isActive ? 1.5 : 1;
          const borderCol = visited     ? "#1a1a28"
            : isBoss      ? "#ff2244"
            : isElite     ? C.orange
            : isActive && secretUnlocked ? "#cc99ff"     // 🔮 segreto sbloccato → viola
            : isActive && dangerNode ? "#ff4444"
            : isActive && safeNode   ? "#44dd88"
            : isActive    ? C.gold
            : "#252538";

          const bgCol = visited        ? "#080808"
            : isBoss               ? "#1a0000"
            : isElite              ? "#1a0e00"
            : isActive && secretUnlocked ? "#150a1a"     // 🔮 sfondo viola scuro
            : isActive && dangerNode ? "#180000"
            : isActive && safeNode   ? "#001800"
            : isActive             ? "#0a0a14"
            : "#0a0a0a";

          const shadow = "none";

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
                  border: `${borderWidth}px solid ${borderCol}`,
                  background: bgCol,
                  borderRadius:"0",
                  cursor: isActive && !effectivelyHidden ? "pointer" : "default",
                  opacity: visited ? 0.28 : effectivelyHidden ? 0.5 : 1,
                  zIndex: isBoss ? 3 : isActive ? 2 : 1,
                  boxShadow: shadow,
                  transition:"transform 0.12s, box-shadow 0.2s",
                  animation,
                  backdropFilter: isActive ? "blur(2px)" : "none",
                }}
                onMouseEnter={e => { if(isActive && !effectivelyHidden) e.currentTarget.style.transform="scale(1.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
              >
                <span style={{fontSize: isBoss ? "24px" : "18px", lineHeight:1, filter: isActive ? "drop-shadow(0 0 4px currentColor)" : "none"}}>{icon}</span>

                {/* Badge Elite */}
                {isElite && (
                  <span style={{position:"absolute", top:-6, right:-6, fontSize:"9px", background:C.orange, color:"#000", borderRadius:"0", width:"14px", height:"14px", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold", boxShadow:`0 0 6px ${C.orange}cc, 0 0 12px ${C.orange}55`}}>★</span>
                )}

                <span style={{
                  fontSize: isBoss ? "9px" : "8px",
                  color: visited ? C.dim
                    : isBoss ? "#ff4466"
                    : isActive && dangerNode ? "#ff6666"
                    : isActive && safeNode   ? "#66ee99"
                    : isActive ? C.gold
                    : "#444460",
                  textAlign:"center", lineHeight:"1.1", marginTop:"2px",
                  maxWidth:`${NW - 4}px`, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
                  fontFamily:FONT, letterSpacing:"0.5px",
                  textShadow: isActive ? "0 0 6px currentColor" : "none",
                }}>
                  {label}
                </span>
              </div>
            </Tooltip>
          );
        }))}
      </div>
    </div>
  );
}

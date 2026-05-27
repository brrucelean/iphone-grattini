// ─── DEBUG FLAGS — URL params (prod-safe: nessun param = tutto off) ──────────
// ?biome=0  →  salta a bioma 0     (0-3)
// ?combat=1 →  entra in combattimento debug
// ?combat=boss → entra in combattimento boss
// ?mode=1   →  DEBUG_MODE (tutti gli oggetti visibili)
// ?row=5    →  salta alla riga 5 della mappa
const _p = typeof window !== "undefined"
  ? new URLSearchParams(window.location.search)
  : new URLSearchParams();

export const DEBUG_MODE   = _p.has("mode");
export const DEBUG_COMBAT = _p.has("combat")
  ? (_p.get("combat") === "boss" ? "boss" : true)
  : false;
export const DEBUG_BIOME  = _p.has("biome") ? Number(_p.get("biome")) : null;
export const DEBUG_ROW    = _p.has("row")   ? Number(_p.get("row"))   : null;

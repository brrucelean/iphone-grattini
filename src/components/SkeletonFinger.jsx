// ─── SKELETON FINGER — pixel art per game over ────────────────
// Griglia 16×30, P=7 → 112×210px
// Rappresenta un dito scheletrico: osso vuoto, unghia cariata, sangue secco
export function SkeletonFinger({ style = {} }) {
  const P = 7;
  const GW = 16, GH = 30;
  const G = Array.from({length: GH}, () => Array(GW).fill(null));

  const BK = "#111111"; // outline nero
  const BN = "#d4c4a0"; // osso chiaro
  const BS = "#9a8868"; // osso ombra
  const BD = "#1a1208"; // vuoto interno osseo
  const RL = "#440a0a"; // sangue secco
  const RD = "#2a0808"; // sangue scurissimo
  const NG = "#3a3020"; // unghia cariata

  // — Unghia cariata (rows 0-2, cols 5-10) —
  for (let x = 5; x <= 10; x++) G[0][x] = BK;
  for (let x = 5; x <= 10; x++) G[1][x] = NG;
  G[1][5] = BK; G[1][10] = BK;
  for (let x = 5; x <= 10; x++) G[2][x] = NG;
  G[2][5] = BK; G[2][10] = BK;
  G[2][7] = RD; G[2][8] = RD; // screpolatura

  // — Prima falange (rows 3-9, cols 5-10) — osso tubolare cavo
  for (let y = 3; y <= 9; y++) {
    G[y][5] = BK; G[y][10] = BK;
    G[y][6] = BN; G[y][9] = BN;  // pareti ossee
    G[y][7] = BD; G[y][8] = BD;  // vuoto midollare
  }
  G[3][6] = BN; G[3][7] = BN; G[3][8] = BN; G[3][9] = BN; // setto superiore
  G[9][6] = BS; G[9][7] = BS; G[9][8] = BS; G[9][9] = BS; // setto inferiore

  // — Goccia sangue secco sul dito —
  G[4][10] = RL; G[5][10] = RL; G[5][11] = RD;
  G[6][11] = RL;

  // — Giunto 1 / nocca (rows 10-11, cols 4-11) — espansione nodale —
  for (let x = 4; x <= 11; x++) G[10][x] = BK;
  G[11][4] = BK; G[11][11] = BK;
  for (let x = 5; x <= 10; x++) G[11][x] = BS; // piatto articolare
  G[11][7] = BN; G[11][8] = BN;

  // — Seconda falange (rows 12-19, cols 5-10) —
  for (let y = 12; y <= 19; y++) {
    G[y][5] = BK; G[y][10] = BK;
    G[y][6] = BN; G[y][9] = BN;
    G[y][7] = BD; G[y][8] = BD;
  }
  G[12][6] = BS; G[12][7] = BS; G[12][8] = BS; G[12][9] = BS;
  G[19][6] = BS; G[19][7] = BS; G[19][8] = BS; G[19][9] = BS;

  // — Crepa diagonale nella falange —
  G[14][6] = BK; G[15][7] = BK; G[16][8] = BK;

  // — Giunto 2 (rows 20-21, cols 3-12) —
  for (let x = 3; x <= 12; x++) G[20][x] = BK;
  G[21][3] = BK; G[21][12] = BK;
  for (let x = 4; x <= 11; x++) G[21][x] = BS;
  G[21][7] = BN; G[21][8] = BN;

  // — Base falange (rows 22-26, cols 4-11) — più larga —
  for (let y = 22; y <= 26; y++) {
    G[y][4] = BK; G[y][11] = BK;
    G[y][5] = BN; G[y][10] = BN;
    for (let x = 6; x <= 9; x++) G[y][x] = BD;
  }
  G[22][5] = BS; G[22][6] = BS; G[22][7] = BS; G[22][8] = BS; G[22][9] = BS; G[22][10] = BS;

  // — Taglio / fondo sanguinolento (rows 27-29) — bordo frastagliato
  const cutRow = [[5,RL],[6,RD],[7,RL],[8,RD],[9,RL],[10,RD],[4,RL],[11,RL]];
  cutRow.forEach(([x, col]) => G[27][x] = col);
  [[5,RD],[6,RL],[9,RD],[10,RL]].forEach(([x,col]) => G[28][x] = col);
  [[6,RD],[9,RL]].forEach(([x,col]) => G[29][x] = col);

  // Costruisci rects SVG
  const rects = G.flatMap((row, y) =>
    row.map((fill, x) =>
      fill ? `<rect x="${x*P}" y="${y*P}" width="${P}" height="${P}" fill="${fill}"/>` : ""
    )
  ).join("");

  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${GW*P}" height="${GH*P}" viewBox="0 0 ${GW*P} ${GH*P}" shape-rendering="crispEdges">${rects}</svg>`;
  const src = `data:image/svg+xml,${encodeURIComponent(svgStr)}`;

  return (
    <img
      src={src}
      alt="scheletro unghia"
      style={{
        imageRendering: "pixelated",
        display: "block",
        margin: "0 auto",
        filter: "drop-shadow(0 0 12px #44000a88)",
        ...style,
      }}
    />
  );
}

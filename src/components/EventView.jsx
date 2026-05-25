import { useState, useEffect, useRef } from "react";
import { C, FONT } from "../data/theme.js";
import { NPC_ART, SPR_BIG, SPR_COLOR, NPC_PALETTE, VECCHIO_DIALOGHI } from "../data/art.js";
import { MACELLAIO_IMPLANTS, GRATTATORE_DEFS } from "../data/items.js";
import { S } from "../utils/styles.js";
import { Btn } from "./Btn.jsx";
import { Tooltip } from "./Tooltip.jsx";

// ─── Vintage corner brackets (come MapView/ScratchCardView) ────────────
function cornerBrackets(color, size = 12, inset = -2, borderW = 2, shadow = null) {
  const sh = shadow || `0 0 6px ${color}66`;
  const base = {
    position:"absolute", width:`${size}px`, height:`${size}px`,
    borderColor: color, boxShadow: sh, pointerEvents:"none",
  };
  return {
    tl: {...base, top:inset, left:inset, borderTop:`${borderW}px solid ${color}`, borderLeft:`${borderW}px solid ${color}`},
    tr: {...base, top:inset, right:inset, borderTop:`${borderW}px solid ${color}`, borderRight:`${borderW}px solid ${color}`},
    bl: {...base, bottom:inset, left:inset, borderBottom:`${borderW}px solid ${color}`, borderLeft:`${borderW}px solid ${color}`},
    br: {...base, bottom:inset, right:inset, borderBottom:`${borderW}px solid ${color}`, borderRight:`${borderW}px solid ${color}`},
  };
}

export function EventView({ node, player, onChoice }) {
  // Variante evento: ogni variante ha testo E scelte coerenti
  const eventoVariant = useRef((() => {
    const r = Math.random();
    if (r < 0.34) return "lettore";
    if (r < 0.67) return "moneta";
    return "voce";
  })());
  const events = {
    ladro: {
      title: "Ladro di Dita",
      art: NPC_ART.ladro,
      text: player.cappelloSbirroWorn
        ? "\"CAZZO UNO SBIRRO! Scusa capo, non ti avevo riconosciuto!\" 💨 Sparisce in un lampo."
        : "\"Fermo lì, bello. Le tue cose o le tue unghie — scegli in fretta, che ho fretta pure io.\"",
      choices: player.cappelloSbirroWorn
        ? [{ label: "🎩 Il cappello funziona! (si consuma)", action: "cappelloVsLadro" }]
        : [
            ...(player.equippedGrattatore?.silent ? [{ label: "🎸 Passa inosservato (silenzioso)", action: "silentBypass" }] : []),
            { label: "Combatti!", action: "fight" },
            { label: "Cedi un oggetto", action: "giveItem", condition: player.items.length > 0 },
            { label: "Scappa! (50%)", action: "flee" },
          ],
    },
    spacciatore: (() => {
      // Sprint 4: se hai fatto la spia col Poliziotto, lo spacciatore lo sa e ti attacca
      if (player.snitchedOn) {
        return {
          title: "Lo Spacciatore — SA TUTTO",
          art: NPC_ART.spacciatore,
          text: "\"TU... TU SEI IL RATTO! Mi hai venduto ai gendarmi?! Ora ti strappo le unghie una a una.\"",
          choices: [
            { label: "⚔ Combatti! (ti ha scoperto)", action: "fight" },
            { label: "🏃 Prova a scappare (50%)", action: "flee" },
          ],
        };
      }
      return {
        title: "Lo Spacciatore",
        art: NPC_ART.spacciatore,
        text: player.cappelloSbirroWorn
          ? "\"Psst... ho roba buo— CAZZO UNO SBIRRO!! AIUTOOOOO!\" 💨 Sparisce in tre secondi. Non lascia nemmeno la ricevuta."
          : player.bluffsBought > 0
            ? `"Rieccoti, fratello. L'ultima volta... vabbè, sfiga eh. Stavolta è ROBA VERA, parola. Fidati.${player.bluffsBought >= 2 ? " (Lo hai già sentito.)" : ""}"`
            : "\"Psst. Aspetta. Ho roba buona. Sigarette particolari, grattini con la vincita già dentro... fidati.\"",
        choices: player.cappelloSbirroWorn
          ? [{ label: "🎩 Correre fa bene, amico. (cappello si consuma)", action: "cappelloVsLadro" }]
          : [
              { label: `Sigaretta con Erba (€8)`, action: "buyHerb", condition: player.money >= 8 },
              { label: `Gratta Contrabbando (€25)`, action: "buyContra", condition: player.money >= 25 },
              { label: `🎫 Gratta VINCENTE GARANTITO (€15) — "fidati"`, action: "buyFalsoVincente", condition: player.money >= 15,
                tooltip: "Lo Spacciatore giura che vince. Qualcosa ti dice di non fidarti al 100%." },
              { label: "No grazie", action: "leave" },
            ],
      };
    })(),
    chirurgo: {
      title: "Il Chirurgo Oscuro",
      art: NPC_ART.chirurgo,
      text: "\"Le unghie sono la finestra dell'anima... e le tue fanno schifo. Posso sistemarle. Intervento rapido, dolore relativo.\"",
      choices: [
        { label: "Unghia di Plastica (€10)", action: "implant_plastica", condition: player.money >= 10 },
        { label: "Unghia di Ferro (€25)", action: "implant_ferro", condition: player.money >= 25 },
        { label: "Unghia d'Oro (€50)", action: "implant_oro", condition: player.money >= 50 },
        { label: "Vattene!", action: "leave" },
      ],
    },
    mendicante: {
      title: "Mendicante Mistico",
      art: NPC_ART.mendicante,
      text: player.money < 5
        ? "\"I soldi non ti servono per avere ciò che ti serve. Le unghie parlano, figliolo... e le tue mi dicono molto.\""
        : "\"Ho attraversato tre mercatini delle pulci e un sogno profetico per trovare questi grattatori. Ora sono tuoi — se li meriti.\"",
      choices: [
        { label: `🔘 Bottone Magico (€5)`, action: "buyGrat_bottone", condition: player.money >= 5, tooltip: GRATTATORE_DEFS.bottone.desc },
        { label: `🔩 Bullone Sacro (€7)`, action: "buyGrat_bullone", condition: player.money >= 7, tooltip: GRATTATORE_DEFS.bullone.desc },
        { label: `💿 Disco Rotto (€18)`, action: "buyGrat_discoRotto", condition: player.money >= 18, tooltip: GRATTATORE_DEFS.discoRotto.desc },
        { label: `🦴 Offri 1 unghia → Bottone Magico gratis`, action: "barattoGrat_bottone",
          condition: player.nails.filter(n => n.state !== "morta").length > 1, tooltip: GRATTATORE_DEFS.bottone.desc },
        { label: "Non mi interessa", action: "leave" },
      ],
    },
    zaino: {
      title: "Zaino Abbandonato",
      art: NPC_ART.zaino,
      text: "\"...\" Lo zaino non parla. Ma qualcosa dentro si muove. Forse. Lo apri?",
      choices: [
        { label: "Apri lo zaino!", action: "openBag" },
        { label: "Lascialo stare", action: "leave" },
      ],
    },
    evento: (() => {
      // Il Vecchio: appare come "evento" se ha ancora visite rimaste
      const visits = player.vecchioVisits || 0;
      if (visits < 3 && node._isVecchio) {
        const d = VECCHIO_DIALOGHI[visits];
        return { ...d, art: NPC_ART.vecchio, _isVecchio: true };
      }
      const v = eventoVariant.current;
      const TESTI = {
        lettore: "\"Le unghie non mentono, ragazzo. Le tue... vedo cose. Grandi o terribili, non so ancora.\"",
        moneta:  "\"Ehi! Quella moneta è mia! ...no aspetta, è tua. Forse. Raccoglila e vedi cosa succede.\"",
        voce:    "\"...mi senti? Sono qui. Non girartiʼ — ascolta e basta.\"",
      };
      const SCELTE = {
        lettore: [
          { label: "⭐ Accetta la lettura (gratis) — rischio/ricompensa casuale", action: "acceptEvent" },
          { label: `💰 Paga €10 per una lettura certa — +FORTUNA garantita`, action: "acceptEventPaid", condition: player.money >= 10 },
          { label: `🦴 Offri un'unghia — il vecchio vuole qualcosa di vivo`, action: "acceptEventNail", condition: player.nails.filter(n=>n.state!=="morta").length > 1 },
          { label: "Ignoralo e vai", action: "leave" },
        ],
        moneta: [
          { label: "🪙 Raccoglila e affidati al caso — portafortuna o maledizione?", action: "acceptEvent" },
          { label: `💰 Paghi €10 a un passante per farla \"leggere\" — +FORTUNA garantita`, action: "acceptEventPaid", condition: player.money >= 10 },
          { label: `🦴 Scambia la moneta con un'unghia — rituale misterioso`, action: "acceptEventNail", condition: player.nails.filter(n=>n.state!=="morta").length > 1 },
          { label: "Lasciala per terra", action: "leave" },
        ],
        voce: [
          { label: "👂 Ascolta la voce — cosa vuole dirti?", action: "acceptEvent" },
          { label: `💰 Offri €10 nell'aria — \"accetta il mio dono\" (fortuna garantita)`, action: "acceptEventPaid", condition: player.money >= 10 },
          { label: `🦴 Sacrifica un'unghia — la voce chiede sangue`, action: "acceptEventNail", condition: player.nails.filter(n=>n.state!=="morta").length > 1 },
          { label: "Ignora e scappa", action: "leave" },
        ],
      };
      return {
        title: "Evento Misterioso",
        art: NPC_ART.evento,
        text: TESTI[v],
        choices: SCELTE[v],
      };
    })(),
    miniboss: {
      title: "Mini Boss del Tabacchino",
      art: NPC_ART.miniboss,
      text: "\"Ehi tu! Pensavi di passare senza fermarti?! Sfidami a grattare — se sei così bravo. Chi vince si prende un'unghia dell'altro. Regole semplici.\"",
      choices: [
        { label: "⚔ Accetta la sfida!", action: "fight" },
        { label: "Rifiuta e scappa", action: "leave" },
      ],
    },
    poliziotto: {
      title: "🚔 Poliziotto della Lotteria",
      art: NPC_ART.poliziotto,
      text: player.giornalettoRead
        ? "\"Ma che... COSA HA IN TASCA?! Un GIORNALETTO?! Atti osceni in luogo pubblico! Multa raddoppiata e che vergogna, a lei!\""
        : player.snitchedOn
        ? "\"Bravo, informatore. Ma non ti ho detto ancora basta. Documenti?\""
        : "\"Alt! Documenti! Cosa ci fa con tutti questi grattini? Lei non mi sembra un pensionato... né un tipo onesto.\"",
      choices: [
        { label: "🎩 Mostra il Cappello Sbirro", action: "useCappello", condition: player.cappelloSbirroWorn },
        { label: player.giornalettoRead ? "Paga la multa DOPPIA (€40)" : "Paga la multa (€20)", action: "pagaMulta", condition: player.money >= (player.giornalettoRead ? 40 : 20) },
        { label: "🦴 Offri un'unghia invece di €20", action: "multaNail", condition: player.money < 20 && player.nails.filter(n=>n.state!=="morta").length > 1 },
        // Sprint 4: Snitch — denuncia lo spacciatore per €30. Ti mette in pace col poliziotto,
        // ma lo spacciatore scopre e ti attacca alla prossima visita.
        { label: "🕵️ Fai la spia sullo spacciatore (+€30, addio sconti)", action: "snitchSpacciatore", condition: !player.snitchedOn,
          tooltip: "Guadagni €30 + passi senza multa. Ma lo spacciatore ti vedrà come un ratto." },
        { label: "🏃 Prova a scappare (20%)", action: "fintotonto" },
        { label: "😰 Non ho i soldi... (manganellata)", action: "manganellata", condition: player.money < 20 && !player.cappelloSbirroWorn },
      ],
    },
    anziana: (() => {
      const visits = player.anzianaVisits || 0;
      const alive = player.nails.filter(n => n.state !== "morta").length;
      const allMax = player.nails.every(n => n.state === "sana" || n.state === "kawaii" || n.state === "piede");
      if (visits >= 3) {
        return {
          title: "👵 L'Anziana Maledetta",
          art: NPC_ART.anziana,
          text: "\"Ho dato. Ho guarito. Ho pure pianto un po'. Ora basta — le mie mani hanno un limite settimanale. Vattene!\"",
          choices: [
            { label: "Ok nonna, scusa...", action: "leave" },
          ],
        };
      }
      if (allMax) {
        return {
          title: "👵 L'Anziana Maledetta",
          art: NPC_ART.anziana,
          text: "\"Che belle mani... troppo belle. Fanno male solo a guardarle. NON È GIUSTO!\" *STRAPP* Ti strappa 2 unghie per gelosia morbosa!",
          choices: [
            { label: "NOOOO NONNA!", action: "anzianaStrappaGelosia" },
          ],
        };
      }
      if (alive <= 1) {
        return {
          title: "👵 L'Anziana Maledetta",
          art: NPC_ART.anziana,
          text: "\"Madonna santa... guarda in che stato. Vieni qui, figliolo.\" Ti mette in mano un'unghia tolta da chi sa dove. Non chiedi.",
          choices: [
            { label: "Grazie nonnina 🥺", action: "anzianaRegala" },
          ],
        };
      }
      return {
        title: "👵 L'Anziana Maledetta",
        art: NPC_ART.anziana,
        text: `\"Figliolo mio... avvicina quelle mani. Le unghie non mentono mai — e le tue hanno cose da raccontare.\" (Visita ${visits+1}/3)`,
        choices: [
          { label: "Porgi le mani", action: "anzianaTocca" },
          {
            label: "🙏 Chiedi la benedizione dell'Unghia Sacra (€40)",
            action: "anzianaSacra",
            condition: !player.anzianaSacraGiven && player.money >= 40 && player.nails.some(n => n.state !== "morta"),
            tooltip: "Una volta per run. Impianto sacro sull'unghia attiva: prossima grattata = vincita x5 GARANTITA.",
          },
          { label: "No grazie nonna", action: "leave" },
        ],
      };
    })(),
    sacerdote: {
      title: "⛪ Il Sacerdote della Fortuna",
      art: NPC_ART.sacerdote,
      text: "\"Figliolo... la Provvidenza sorride a chi dona senza calcolo. Ogni centesimo che offri torna moltiplicato — in modi che la matematica non spiega.\"",
      choices: [
        { label: "Dona €5 (Fortuna +1, 3 turni)", action: "dona5", condition: player.money >= 5 },
        { label: "Dona €15 (Fortuna +2, 5 turni)", action: "dona15", condition: player.money >= 15 },
        { label: "Dona €30 (Fortuna +3, 8 turni)", action: "dona30", condition: player.money >= 30 },
        { label: "Non sono credente", action: "leave" },
      ],
    },
    bambino: (() => {
      const TIER_PRICE = { 1:3, 2:10, 3:25, 4:65 };
      const grattedCards = player.grattedCards || [];
      const hasGrattate = grattedCards.length > 0;
      const totalValue = grattedCards.reduce((sum, c) => {
        const base = TIER_PRICE[c.tier] || 3;
        return sum + (c.isWinner ? base * 2 : base);
      }, 0);
      return {
        title: "👦 Il Bambino Collezionista",
        art: NPC_ART.bambino,
        text: hasGrattate
          ? `"OHHH! Quelli già grattati valgono ORO per me! ${grattedCards.length} pezzi — circa €${totalValue}. Hai idea di quanto siano rari questi?!"`
          : player.scratchCards.length > 0
            ? '"Psst! Ho grattini di SERIE LIMITATA — fuori produzione da anni. Scambiamo? Dai dai dai!"'
            : '"Niente grattini? Niente affare. Torna quando hai qualcosa di interessante, uffa."',
        choices: [
          ...(hasGrattate ? [
            { label: `💰 Vendi tutti i grattini usati (~€${totalValue})`, action: "bambinoVendiTutte" },
            { label: `💰 Vendi "${grattedCards[0]?.name}" (1 carta)`, action: "bambinoVendiUna" },
          ] : []),
          ...(player.scratchCards.length > 0 ? [
            { label: "🔄 Scambia 1 grattino → 1 grattino raro", action: "bambinoSwap1" },
            { label: "🔄 Scambia 2 grattini → 1 grattino LEGGENDARIO", action: "bambinoSwap2", condition: player.scratchCards.length >= 2 },
          ] : []),
          { label: "💰 Compra grattino raro (€30)", action: "bambinoBuy", condition: player.money >= 30 },
          { label: !hasGrattate && player.scratchCards.length === 0 ? "Ciao piccolo, torno dopo" : "No grazie piccolo", action: "leave" },
        ],
      };
    })(),
    streamer: (() => {
      const cards = player.scratchCards || [];
      return {
        title: "📱 Streamer Scratch",
        art: NPC_ART.streamer,
        text: cards.length > 0
          ? "\"OHH GUYS!! Questo tizio sta per GRATTARE IN LIVE!! 🔴 Chat impazzisce! Scegli una carta — se vinci è x1.5 e diventiamo VIRALI!\""
          : "\"Volevo fare un video ma non hai nemmeno UN grattino?! 😤 Content zero. Boring. Vattene prima che mi fai perdere follower.\"",
        choices: [
          ...(cards.length > 0 ? cards.map((c, i) => ({
            label: `📱 Gratta "${c.name}" (€${c.cost}) in live`,
            action: `streamerLive_${i}`,
          })) : []),
          { label: "❌ Rifiuta — preferisco la privacy", action: "streamerSkip" },
        ],
      };
    })(),
    macellaio: (() => {
      const alive = player.nails.filter(n => n.state !== "morta");
      const activeNailObj = player.nails[player.activeNail];
      const hasImplant = activeNailObj?.implant && MACELLAIO_IMPLANTS.some(x => x.id === activeNailObj.implant);
      return {
        title: "🔪 Il Chirurgo Macellaio",
        art: NPC_ART.macellaio,
        text: alive.length === 0
          ? '"Niente da operare. Anzi, non so neanche come sei ancora vivo. Vattene."'
          : hasImplant
          ? `"Mani già operative. Non tocco il lavoro altrui — codice deontologico. O almeno quello che ne rimane."`
          : '"Impianti d\'ultima generazione. Non chiedere la laurea — chiediti se puoi permetterti di NON farlo. ⚠️ 25% chance di... complicazioni."',
        choices: alive.length === 0 || hasImplant
          ? [{ label: "Capito... arrivederci", action: "leave" }]
          : [
            ...MACELLAIO_IMPLANTS.map(impl => ({
              label: `${impl.emoji} ${impl.name} (€${impl.cost}) — ${impl.rarity}`,
              action: `macellaio_${impl.id}`,
              condition: player.money >= impl.cost,
              tooltip: impl.desc + " · ⚠️ 25% fallimento → unghia morta!",
            })),
            { label: "Troppo rischioso, scappo", action: "leave" },
          ],
      };
    })(),
    stregone: {
      title: "🧙 Lo Stregone della Doppia Mano",
      art: NPC_ART.stregone,
      text: player.skills?.includes("ambidestri")
        ? (player.nails?.some(n => n.state === "piede")
          ? "\"Vedo che hai trovato IL PIEDE... 🦶 Non lavartelo MAI. Il suo potere è nel disgusto.\""
          : "\"Già conosci il segreto delle mani... 🙌 Ma conosci quello dei PIEDI? Per €100 ti rivelo l'unghia più disgustosa — e più potente — che esista.\"")
        : "\"Psst... ti vedo. Hai il dono grezzo. Posso risvegliarti la mano sinistra... 5 dita in più con cui grattare. Certo, partiranno graffiata — non sono allenate come la destra. Il mio prezzo è €200.\"",
      choices: player.skills?.includes("ambidestri")
        ? (player.nails?.some(n => n.state === "piede")
          ? [{ label: "Grazie maestro 🙏", action: "leave" }]
          : [
            { label: "🦶 L'Unghia del Piede (€100)", action: "unghiaPiede", condition: player.money >= 100 },
            { label: "No grazie, passo", action: "leave" },
          ])
        : [
          { label: "🙌 Impara la Doppia Mano (€200)", action: "learnAmbidestri", condition: player.money >= 200 },
          { label: "Troppo caro, addio", action: "leave" },
        ],
    },
    maestroTe: {
      title: "🍵 Il Maestro del Tè",
      art: `  ╭──╮\n  │茶│\n  │~ │\n  ╰┬─╯\n  /│\\\n   🍵`,
      text: "\"欢迎, benvenuto. Il tè cura il corpo e l'anima. Scegli la tua miscela — ogni tazza ha un prezzo e un destino.\"",
      choices: [
        { label: "🍵 Tè Verde (€5) — Cura 1 unghia + Fortune +1", action: "teVerde", condition: player.money >= 5 },
        { label: "🍵 Tè del Drago (€15) — Cura 2 unghie + Fortune +2 per 5 turni", action: "teDrago", condition: player.money >= 15 },
        { label: "🍵 Tè d'Oro Imperiale (€40) — Cura TUTTE + smalto su unghia attiva", action: "teOro", condition: player.money >= 40 },
        { label: "🐲 Parlami del Drago (gratis)", action: "dragoLore" },
        { label: "Non ho sete, grazie", action: "leave" },
      ],
    },
    guantaio: (() => {
      const hasGuanto = (player.grattatori || []).some(g => g.id === "guantoBoss");
      return {
        title: "🧤 Il Guantaio",
        text: hasGuanto
          ? "\"Hai già il mio pezzo migliore. Usalo bene contro il boss — non ne faccio altri fino al prossimo bioma.\""
          : "\"Signore... le mani sono strumenti. E gli strumenti vanno protetti. Ho un pezzo raro — il GUANTO DA BOSS. Fatto con pelle di unghia marcia ingrassata. SOLO CONTRO IL BOSS: copre TUTTE le dita per l'intera fight. A fine battaglia si sgretola — e tu passi al bioma successivo.\"",
        choices: hasGuanto
          ? [{ label: "Grazie, torno dopo aver grattato", action: "leave" }]
          : [
              { label: "🧤 Compra il Guanto da BOSS (€60)", action: "buyGuantoBoss", condition: player.money >= 60, tooltip: GRATTATORE_DEFS.guantoBoss.desc },
              { label: "🦴 Baratto: 1 unghia + €20 → Guanto da BOSS", action: "barattoGuantoBoss", condition: player.money >= 20 && player.nails.filter(n => n.state !== "morta").length > 1 },
              { label: "Troppo caro, passo", action: "leave" },
            ],
      };
    })(),
  };

  const ev = events[node.type] || events.evento;
  const bigArt = SPR_BIG[node.type];
  const pal = NPC_PALETTE[node.type] || [C.text, C.dim, C.gold];

  // Typing effect
  const [typedChars, setTypedChars] = useState(0);
  const fullText = ev.text;
  const typingDone = typedChars >= fullText.length;
  useEffect(() => {
    setTypedChars(0);
  }, [node.type]);
  useEffect(() => {
    if (typedChars >= fullText.length) return;
    const t = setTimeout(() => setTypedChars(c => c + 1), 22);
    return () => clearTimeout(t);
  }, [typedChars, fullText]);

  // Blink animation for portrait
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 2500 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  // Undertale-style talk sound — short beep per character
  const talkSoundRef = useRef(null);
  useEffect(() => {
    if (typedChars >= fullText.length) return;
    if (typedChars % 2 !== 0) return; // ogni 2 caratteri
    const ch = fullText[typedChars];
    if (ch === " " || ch === "\n") return;
    try {
      const ctx = talkSoundRef.current || new (window.AudioContext || window.webkitAudioContext)();
      talkSoundRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // Pitch varia per NPC
      const basePitch = node.type === "mendicante" ? 140 : node.type === "spacciatore" ? 180
        : node.type === "bambino" ? 320 : node.type === "anziana" ? 160
        : node.type === "boss" ? 100 : 220;
      osc.frequency.value = basePitch + (ch.charCodeAt(0) % 8) * 15;
      osc.type = "square";
      gain.gain.value = 0.06;
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }, [typedChars]);

  // ─── Vintage brackets: outer panel (pal[0]), portrait (pal[2]), dialog (pal[1]) ───
  const panelCorners = cornerBrackets(pal[0], 14, -3, 2, `0 0 8px ${pal[0]}88`);
  const portraitCorners = cornerBrackets(pal[2], 9, -2, 1, `0 0 4px ${pal[2]}66`);
  const dialogCorners = cornerBrackets(pal[1], 9, -2, 1, `0 0 4px ${pal[1]}66`);

  return (
    <div style={{
      ...S.panel, maxWidth:"900px", margin:"10px auto", padding:"18px 20px",
      position:"relative",
      boxShadow:`0 0 18px ${pal[0]}33, inset 0 0 24px #00000088`,
    }}>
      {/* Corner brackets outer panel */}
      <span style={panelCorners.tl} /><span style={panelCorners.tr} />
      <span style={panelCorners.bl} /><span style={panelCorners.br} />

      {/* ─── Vintage title bar: solid badge + neon title ─── */}
      <div style={{textAlign:"center", marginBottom:"14px"}}>
        <div style={{
          display:"inline-block", background:pal[0], color:"#000",
          padding:"3px 14px", fontSize:"10px", fontWeight:"bold",
          letterSpacing:"3px", fontFamily:FONT,
          boxShadow:`0 0 8px ${pal[0]}88`,
          marginBottom:"6px",
        }}>
          ★ EVENTO ★
        </div>
        <div style={{
          color:pal[0], fontSize:"16px", fontWeight:"bold",
          letterSpacing:"2px", fontFamily:FONT,
          textShadow:`0 0 8px ${pal[0]}, 0 0 14px ${pal[0]}66`,
        }}>
          ⬡ {ev.title} ⬡
        </div>
      </div>

      {/* 2-column layout: portrait left, dialog right */}
      <div style={{display:"flex", gap:"16px", alignItems:"flex-start", justifyContent:"center"}}>
        {/* Portrait — multicolore se disponibile */}
        {bigArt && (
          <div style={{flexShrink:0, width:"200px", position:"relative"}}>
            <span style={portraitCorners.tl} /><span style={portraitCorners.tr} />
            <span style={portraitCorners.bl} /><span style={portraitCorners.br} />
            <pre style={{
              ...S.pre, fontSize:"8px", lineHeight:"1.15",
              border:`1px solid ${pal[2]}55`, padding:"8px 8px",
              background:"#000000", whiteSpace:"pre", overflow:"hidden",
              boxShadow:`inset 0 0 18px ${pal[0]}22`,
              margin:0,
            }}>
              {SPR_COLOR[node.type]
                ? SPR_COLOR[node.type].map((row, i) => (
                    <span key={i}>
                      {row.map((seg, j) => {
                        const [text, color] = Array.isArray(seg) ? seg : [seg, pal[0]];
                        const t = blink && (i === 4 || i === 5) ? text.replace(/[•◕⊕∞☠><=;.◉]/g, "─") : text;
                        return <span key={j} style={{color, textShadow:`0 0 6px ${color}44`}}>{t}</span>;
                      })}
                      {"\n"}
                    </span>
                  ))
                : bigArt.map((line, i) => {
                    const t = blink && (i === 4 || i === 5) ? line.replace(/[•◕⊕∞☠><=;.]/g, "─") : line;
                    return <span key={i} style={{color:pal[0], textShadow:`0 0 6px ${pal[0]}44`}}>{t}{"\n"}</span>;
                  })
              }
            </pre>
            {/* Nameplate sotto il ritratto */}
            <div style={{
              marginTop:"6px", textAlign:"center",
              fontSize:"9px", color:pal[2], letterSpacing:"2px",
              fontFamily:FONT, opacity:0.85,
            }}>
              ─ RITRATTO ─
            </div>
          </div>
        )}

        {/* Dialog + choices */}
        <div style={{flex:1, minWidth:0, maxWidth:"480px"}}>
          {/* Dialog blockquote con typing */}
          <div style={{position:"relative", marginBottom:"14px"}}>
            <span style={dialogCorners.tl} /><span style={dialogCorners.tr} />
            <span style={dialogCorners.bl} /><span style={dialogCorners.br} />
            <div style={{
              border:`1px solid ${pal[1]}66`, padding:"12px 14px",
              background:"#000000",
              minHeight:"70px", cursor:"pointer",
              boxShadow:`inset 0 0 16px ${pal[1]}11`,
            }} onClick={() => { if (!typingDone) setTypedChars(fullText.length); }}>
              {/* Apri virgolette ornamentali */}
              <div style={{
                color:pal[1], fontSize:"18px", lineHeight:"0.8",
                opacity:0.7, marginBottom:"2px",
              }}>❝</div>
              <div style={{
                color:C.text, fontSize:"12px", lineHeight:"1.65",
                fontStyle:"italic", padding:"0 6px",
              }}>
                {fullText.slice(0, typedChars)}
                {!typingDone && <span style={{color:pal[0], animation:"blink 0.5s infinite"}}>▌</span>}
              </div>
              {/* Chiudi virgolette quando typing è completo */}
              {typingDone && (
                <div style={{
                  color:pal[1], fontSize:"18px", lineHeight:"0.8",
                  opacity:0.7, textAlign:"right", marginTop:"2px",
                }}>❞</div>
              )}
              {!typingDone && (
                <div style={{color:C.dim, fontSize:"9px", marginTop:"8px", textAlign:"right"}}>
                  [click per completare]
                </div>
              )}
            </div>
          </div>

          {/* Choices — shown only when typing is done */}
          {typingDone && (
            <div>
              <div style={{
                fontSize:"9px", color:pal[2], letterSpacing:"2px",
                fontFamily:FONT, marginBottom:"6px", opacity:0.85,
              }}>
                ─ SCELTE ─
              </div>
              <div style={{display:"flex", flexDirection:"column", gap:"6px"}}>
                {ev.choices.map((ch, i) => (
                  <Tooltip key={i} text={ch.tooltip || ""}>
                    <Btn onClick={() => onChoice(ch.action)}
                      disabled={ch.condition === false}
                      variant={ch.action === "fight" ? "danger" : ch.action === "leave" ? "normal" : "gold"}
                      style={{fontSize:"11px", padding:"6px 10px", width:"100%", textAlign:"left"}}>
                      [{i+1}] {ch.label}
                    </Btn>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

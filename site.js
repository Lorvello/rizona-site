// Rizona Studio · variant "vloeibaar". Gewone paginacode bovenop de Scrollcraft-motor (die blijft
// onveranderd). De voorbeeldposts zijn vooraf geschreven; er wordt niets gegenereerd of geplaatst.
import { createEarth } from "./gl.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fineMQ = matchMedia("(hover: hover) and (pointer: fine)");
const isPhone = () => innerWidth <= 760;
const root = document.documentElement;

window.ScrollCraft.mount(document);

// ------------------------------------------------------------------ balk --
const bar = $("#bar");
const menuBtn = $("#bar-menu");
const sheet = $("#sheet");
function setMenu(open) {
  menuBtn.setAttribute("aria-expanded", String(open));
  sheet.hidden = !open;
  menuBtn.querySelector("use").setAttribute("href", open ? "#i-x" : "#i-menu");
}
menuBtn.addEventListener("click", () => setMenu(sheet.hidden));
sheet.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) { setMenu(false); menuBtn.focus(); } });

// Links binnen de pagina ("Plan een gesprek", het menu) springen in één keer naar hun stuk: het beeld dooft kort uit,
// de pagina staat meteen op de goede plek en komt weer op. Zo scroll je niet door alle bewegende stukken heen.
const veil = document.createElement("div");
veil.className = "veil";
veil.setAttribute("aria-hidden", "true");
document.body.append(veil);
const LAND = { "#werk": () => $("#werk .vid-head"), "#vragen": () => $("#vragen"), "#voor-wie": () => $("#voor-wie") };
function jumpTo(id) {
  const el = (LAND[id] && LAND[id]()) || $(id);
  if (!el) return;
  const pad = id === "#contact" || id === "#top" || id === "#probleem" ? 0 : bar.offsetHeight + 24;
  // "Voor wie" opent de vraag in de vragenlijst.
  if (el.tagName === "DETAILS") el.open = true;
  const go = () => {
    scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + scrollY - pad), behavior: "instant" });
    history.replaceState(null, "", id);
  };
  if (reduce) { go(); return; }
  veil.classList.add("on");
  setTimeout(() => { go(); requestAnimationFrame(() => requestAnimationFrame(() => veil.classList.remove("on"))); }, 260);
}
// De balk laat zien in welk onderdeel je bent.
const spyLinks = $$(".bar-links a");
const spyIO = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  spyLinks.forEach((a) => a.toggleAttribute("aria-current", a.getAttribute("href") === "#" + e.target.id));
}), { rootMargin: "-45% 0px -50% 0px" });
["probleem", "werk", "contact", "vragen"].forEach((id) => { const el = document.getElementById(id); if (el) spyIO.observe(el); });
const heroIO = new IntersectionObserver(([e]) => { if (e.isIntersecting) spyLinks.forEach((a) => a.removeAttribute("aria-current")); }, { rootMargin: "-45% 0px -50% 0px" });
heroIO.observe($("#top"));

// Herozin: het tweede deel wisselt rustig tussen vijf zinnen over wat we doen (alleen claims uit B-0026).
// De woorden lossen op naar boven en de nieuwe komen woord voor woord binnen, eerst cyaan, dan wit.
// Alle zinnen liggen op dezelfde plek, dus de regel springt niet. Stil bij minder beweging en buiten beeld.
const ROT = {
  nl: ["gericht op bereik bij je toekomstige klanten.", "uit de kennis die je al in huis hebt.", "gericht op gesprekken met nieuwe klanten.", "onderbouwd met bronnen uit jouw vak.", "die pas online gaan als jij ja zegt."],
  en: ["aimed at reaching your future clients.", "from the knowledge you already have in-house.", "aimed at conversations with new clients.", "backed by sources from your field.", "that only go live once you say yes."],
};
const rotEl = $("#hero-rot");
if (rotEl && !reduce) {
  const sr = document.createElement("span");
  sr.className = "sr-only";
  sr.textContent = rotEl.textContent;
  const stack = document.createElement("span");
  stack.className = "rot-stack";
  stack.setAttribute("aria-hidden", "true");
  rotEl.replaceChildren(sr, stack);
  const R = { i: 0, lines: [], timer: 0, inView: true };
  const build = () => {
    const list = ROT[document.documentElement.lang === "en" ? "en" : "nl"];
    stack.replaceChildren(...list.map((zin, n) => {
      const line = document.createElement("span");
      line.className = "rot-line" + (n === R.i ? " is-on is-still" : "");
      zin.split(" ").forEach((w, k) => {
        if (k) line.append(" ");
        const span = document.createElement("span");
        span.className = "rw";
        span.style.setProperty("--i", k);
        span.textContent = w;
        line.append(span);
      });
      return line;
    }));
    R.lines = [...stack.children];
  };
  const next = () => {
    const cur = R.lines[R.i];
    R.i = (R.i + 1) % R.lines.length;
    const nxt = R.lines[R.i];
    R.lines.forEach((l) => l.classList.remove("is-out", "is-still"));
    cur.classList.replace("is-on", "is-out");
    nxt.classList.add("is-on");
  };
  const plan = () => {
    clearInterval(R.timer);
    if (R.inView && !document.hidden) R.timer = setInterval(next, 6000);
  };
  build();
  new IntersectionObserver(([e]) => { R.inView = e.isIntersecting; plan(); }).observe(rotEl);
  document.addEventListener("visibilitychange", plan);
  // Taalknop: de zinnen meteen in de nieuwe taal, op dezelfde plek in de rij.
  new MutationObserver(build).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
}
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.classList.contains("skip-link")) return;
  const id = a.getAttribute("href");
  if (id.length < 2 || !$(id)) return;
  e.preventDefault();
  jumpTo(id);
});

// ---------------------------------------------------------------- muis ----
const ptr = { x: innerWidth / 2, y: innerHeight / 2, moved: -1e9 };
addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse" || !fineMQ.matches || reduce) return;
  ptr.x = e.clientX; ptr.y = e.clientY; ptr.moved = performance.now();
}, { passive: true });
document.documentElement.addEventListener("pointerleave", () => { ptr.moved = -1e9; });
const ptrLive = () => performance.now() - ptr.moved < 2200;

// ------------------------------------------------------------- WebGL ------
// Alleen de orb en de draaiende aarde gebruiken WebGL; zonder WebGL staan ze stil als beeld.
const cast = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl") || c.getContext("experimental-webgl")); } catch { return false; } })();
if (!cast) root.classList.add("no-gl");

await document.fonts.ready;

// ----------------------------------------------------------------- hero ---
// De echte orb zweeft boven de aarde van de Live-pagina. Sterren, aarde en orb bewegen elk in hun eigen tempo
// bij scrollen, en leunen een klein beetje mee met de muis.
const heroEl = $(".hero");
const orbBox = $("#hero-orb");
const earth = $("#hero-earth");
const stars = $("#hero-stars");
const heroTitle = $("#hero-title");
const foot = $("#hero-foot");
const H = { lx: 0, ly: 0, layoutKey: "" };
const EARTH_APEX = { x: 760 / 1536, y: 488 / 1024 };

if (cast) {
  import("./orb.js").then(({ createOrbScene }) => {
    try { createOrbScene($("#orb-canvas"), () => orbBox.classList.add("orb-lost")).setPlaying(!reduce); } catch { orbBox.classList.add("orb-lost"); }
  }).catch((err) => { console.warn("[rizona] orb niet geladen", err); orbBox.classList.add("orb-lost"); });
} else {
  orbBox.classList.add("orb-lost");
}

// De aarde draait: wolken en land schuiven langzaam naar rechts (van west naar oost), de gloed blijft staan.
const EARTH_SPIN = 0.4 / 120; // één rondje van de foto in twee minuten
const earthCanvas = $("#hero-earth-gl");
const earthImg = $("#hero-earth img");
let earthGL = null;
if (cast && !reduce) {
  const start = () => {
    try { earthGL = createEarth(earthCanvas, earthImg); if (earthGL) earth.classList.add("is-turning"); } catch (err) { console.warn("[rizona] aarde draait niet", err); }
  };
  if (earthImg.complete && earthImg.naturalWidth) start(); else earthImg.addEventListener("load", start, { once: true });
}

function placeEarth() {
  // De gloed op de horizon van de foto komt net onder de orb te liggen.
  const hr = heroEl.getBoundingClientRect();
  const ob = orbBox.getBoundingClientRect();
  const w = Math.max(innerWidth * (isPhone() ? 2.6 : 1.22), 1100);
  const h = w * 1024 / 1536;
  const apexY = (ob.bottom - hr.top) - ob.height * 0.1;
  earth.style.setProperty("--earth-w", w + "px");
  earth.style.top = (apexY - h * EARTH_APEX.y) + "px";
  earth.style.marginLeft = ((0.5 - EARTH_APEX.x) * w) + "px";
}

function heroFrame(T, dt) {
  const r = heroEl.getBoundingClientRect();
  if (r.bottom <= 0) return;
  const key = [innerWidth, innerHeight].join(",");
  if (key !== H.layoutKey) { H.layoutKey = key; placeEarth(); }
  if (reduce) return;
  const s = Math.max(0, -r.top);
  const k = 1 - Math.pow(0.001, dt);
  const live = ptrLive();
  H.lx = lerp(H.lx, live ? (ptr.x / innerWidth - 0.5) : 0, k * 0.25);
  H.ly = lerp(H.ly, live ? (ptr.y / innerHeight - 0.5) : 0, k * 0.25);
  // Ver weg beweegt trager: sterren 0,3, aarde 0,55, orb 0,85, tekst gewoon mee.
  stars.style.transform = `translate3d(${(H.lx * -6).toFixed(1)}px,${(s * 0.7 + H.ly * -4).toFixed(1)}px,0)`;
  earth.style.setProperty("--earth-y", (s * 0.45 + H.ly * -8).toFixed(1) + "px");
  earth.style.transform = `translate3d(calc(-50% + ${(H.lx * -12).toFixed(1)}px), var(--earth-y), 0)`;
  orbBox.style.transform = `translate3d(${(H.lx * 14).toFixed(1)}px,${(s * 0.15 + H.ly * 8).toFixed(1)}px,0) scale(${(1 - Math.min(s / r.height, 1) * 0.08).toFixed(4)})`;
  if (earthGL) {
    const eb = earth.getBoundingClientRect();
    earthGL.render(eb.width, eb.height, Math.min(devicePixelRatio || 1, 1.25), T * EARTH_SPIN);
  }
  const fade = clamp(s / (r.height * 0.45));
  foot.style.opacity = (1 - smooth(fade)).toFixed(3);
  heroTitle.style.transform = s > 0 ? `translate3d(0,${(s * -0.08).toFixed(1)}px,0)` : "";
}

// ------------------------------------------------------------- jij weet het ---
// "Jouw kennis [vak] op LinkedIn." Bij het scrollen gaat het vak open tot het hele scherm; de woorden schuiven opzij en de zin komt erop.
const zicht = $("#staan");
const zichtStage = $(".zicht-stage");
// De kaartjes draaien als satellieten in een baan om het logo: achter het logo kleiner en zachter, ervoor groter.
const zfCards = $$(".zf-card");
const ORBIT_START = [-2.55, -0.75, 0.95, 2.45];
function zichtFrame(T) {
  const r = zicht.getBoundingClientRect();
  const vh = innerHeight, vw = innerWidth;
  if (r.bottom < 0 || r.top > vh) return;
  let g = 1, c = 1;
  if (!reduce) {
    const p = clamp(-r.top / Math.max(1, r.height - vh));
    g = smooth(clamp((p - 0.22) / 0.52));
    c = smooth(clamp((p - 0.74) / 0.2));
  }
  zichtStage.style.setProperty("--g", g.toFixed(4));
  zichtStage.style.setProperty("--c", c.toFixed(4));
  const phone = isPhone();
  const rx = (phone ? 0.3 : 0.29) * vw, ry = (phone ? 0.3 : 0.21) * vh, cy = phone ? -0.05 * vh : 0;
  const spread = 0.45 + g * 0.55;
  // Pas als de woorden weg zijn, komen de kaartjes erbij.
  const fade = clamp((g - 0.55) * 3);
  // Op de telefoon drie kleinere kaartjes (zonder het concept), gelijk verdeeld over de baan.
  const shown = phone ? [0, 1, 3] : [0, 1, 2, 3];
  zfCards.forEach((el, i) => {
    const k = shown.indexOf(i);
    el.style.display = k < 0 ? "none" : "";
    if (k < 0) return;
    const start = phone ? -2.4 + k * (Math.PI * 2 / 3) : ORBIT_START[i];
    const a = start + (reduce ? 0 : T * 0.11);
    const wob = 1 + (reduce ? 0 : 0.05 * Math.sin(T * 0.6 + i * 1.7));
    const x = Math.cos(a) * rx * spread * wob;
    const y = Math.sin(a) * ry * spread * wob + cy;
    const depth = Math.sin(a); // -1 achter het logo, 1 ervoor
    const s = (0.84 + 0.16 * (depth + 1) / 2) * (phone ? 0.8 : 1);
    el.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
    el.style.opacity = (fade * (0.55 + 0.45 * (depth + 1) / 2)).toFixed(3);
    el.style.zIndex = depth > 0 ? "8" : "2";
  });
}

// ------------------------------------------------------------- probleem ---
// Het stuk staat vast. Je scroll kiest het pijnpunt; links licht het op, rechts staat het beeld erbij en blijft staan.
const pain = $("#probleem");
const painItems = $$("#pain-list li");
const painScenes = $$(".ps-scene");
const painPunch = $("#pain-punch");
const painWords = $$("#pain-punch .pp-w");
let painOn = -1;
function painFrame() {
  const r = pain.getBoundingClientRect();
  const vh = innerHeight;
  if (r.bottom < 0 || r.top > vh) return;
  const p = clamp(-r.top / Math.max(1, r.height - vh));
  // Drie pijnpunten in de eerste 75 procent, daarna komt de zin onder de lijst en licht hij woord voor woord op.
  const i = Math.min(painScenes.length - 1, Math.floor(clamp(p / 0.75) * painScenes.length));
  const pp = smooth((p - 0.75) / 0.06);
  painPunch.style.setProperty("--pp", pp.toFixed(3));
  painWords.forEach((w, j) => w.style.setProperty("--wk", (reduce ? (pp > 0.5 ? 1 : 0) : smooth((p - 0.77 - j * 0.03) / 0.05)).toFixed(3)));
  painPunch.style.setProperty("--pk", (reduce ? (pp > 0.5 ? 1 : 0) : smooth((p - 0.9) / 0.06)).toFixed(3));
  if (i === painOn) return;
  painOn = i;
  painItems.forEach((li, j) => li.classList.toggle("on", j === i));
  painScenes.forEach((el, j) => el.classList.toggle("on", j === i));
}

// ------------------------------------------------------------- zo werkt het ---
// Zoals op mathewgroen.com/werkwijze: in de kaart speelt een stil voorbeeld zolang de kaart goed in beeld is, en het
// stopt als je wegscrolt. Een klik opent de echte video groot, met geluid en eigen knoppen (ook volledig scherm), met
// de hoofdknop eronder. Bij minder beweging speelt het voorbeeld niet; dan staat er een stilstaand beeld.
const werk = $("#werk");
const vid = $("#vid");
const vidFrame = $("#vid-frame");
const vidTilt = $("#vid-tilt");
const vModal = $("#vid-modal");
const vmVideo = $("#vm-video");
const VID_SRC = vid.getAttribute("src");
let vModalOpen = false;
let vidSeen = false;
const vidGo = () => { const p = vid.play(); if (p) p.catch(() => {}); };
vid.addEventListener("playing", () => vidFrame.classList.add("is-playing"));
vid.addEventListener("pause", () => vidFrame.classList.remove("is-playing"));
if (!reduce) {
  new IntersectionObserver(([e]) => {
    vidSeen = e.isIntersecting;
    if (vidSeen && !vModalOpen) vidGo(); else vid.pause();
  }, { threshold: 0.6 }).observe(vidFrame);
}
document.addEventListener("visibilitychange", () => { if (document.hidden) vid.pause(); else if (vidSeen && !vModalOpen && !reduce) vidGo(); });
function openVideo() {
  vModalOpen = true;
  vid.pause();
  if (!vmVideo.getAttribute("src")) vmVideo.setAttribute("src", VID_SRC);
  vModal.hidden = false;
  root.classList.add("vm-open");
  requestAnimationFrame(() => vModal.classList.add("is-open"));
  vmVideo.currentTime = 0;
  const p = vmVideo.play(); if (p) p.catch(() => {});
  $(".vm-close", vModal).focus();
}
function closeVideo() {
  if (!vModalOpen) return;
  vModalOpen = false;
  vmVideo.pause();
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  vModal.classList.remove("is-open");
  root.classList.remove("vm-open");
  setTimeout(() => { if (!vModalOpen) vModal.hidden = true; }, reduce ? 0 : 260);
  vidFrame.focus({ preventScroll: true });
  if (vidSeen && !reduce) vidGo();
}
vidFrame.addEventListener("click", openVideo);
vModal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeVideo(); });
addEventListener("keydown", (e) => {
  if (!vModalOpen) return;
  if (e.key === "Escape") { e.preventDefault(); closeVideo(); }
  if (e.key === "Tab") {
    // De focus blijft in de speler.
    const f = $$("button, a, video", vModal).filter((el) => el.offsetParent);
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  }
});
// Bij het scrollen komt de video naar je toe, zoals op mathewgroen.com: hij ligt eerst achterover (40 graden) en is
// kleiner. Hij staat al rechtop op volle grootte als het stuk op zijn plek staat (de kop net onder de balk, zoals na
// een klik in het menu), zodat je niet langs de video hoeft te scrollen om hem af te zien.
const vidStage = $("#werk .vid-stage");
const vidHead = $("#werk .vid-head");
const VR = { p: -1 };
function vidReveal() {
  if (reduce) return;
  const r = vidStage.getBoundingClientRect();
  const vh = innerHeight;
  if (r.bottom < -vh * 0.2 || r.top > vh * 1.3) return;
  const start = vh * 1.05;
  const end = bar.offsetHeight + 24 + (r.top - vidHead.getBoundingClientRect().top) + vh * 0.08;
  const target = clamp((start - r.top) / Math.max(1, start - end));
  VR.p = VR.p < 0 ? target : lerp(VR.p, target, 0.18);
  if (Math.abs(VR.p - target) < 0.0005) VR.p = target;
  const tilt = isPhone() ? 26 : 40;
  vidTilt.style.transform = `perspective(1400px) scale(${(0.72 + 0.28 * VR.p).toFixed(4)}) rotateX(${(tilt * (1 - VR.p)).toFixed(3)}deg)`;
}
// De kaart kantelt zacht naar de muis, zoals bij Mathew (alleen met een muis, niet bij minder beweging).
if (fineMQ.matches && !reduce) {
  vidTilt.addEventListener("pointermove", (e) => {
    const r = vidTilt.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    vidTilt.style.setProperty("--ry", (x * 6).toFixed(2) + "deg");
    vidTilt.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg");
  });
  vidTilt.addEventListener("pointerleave", () => { vidTilt.style.setProperty("--ry", "0deg"); vidTilt.style.setProperty("--rx", "0deg"); });
}

// ----------------------------------------------------------- wat we doen --
const drawIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("drawn"); drawIO.unobserve(e.target); } });
}, { threshold: 0.45 });
$$(".illus").forEach((el) => (reduce ? el.classList.add("drawn") : drawIO.observe(el)));

// ------------------------------------------------------------ de naam ---
// In de vragen: open "Wie zijn jullie" en "Rizona" valt uiteen in rise en zone.
const naamQ = $("#naam-q");
naamQ.addEventListener("toggle", () => {
  naamQ.classList.remove("play");
  if (!naamQ.open) return;
  if (reduce) { naamQ.classList.add("play"); return; }
  void naamQ.offsetWidth;
  requestAnimationFrame(() => requestAnimationFrame(() => naamQ.classList.add("play")));
});

// ------------------------------------------------------------- de aarde onderaan ---
// Dezelfde aarde als bovenaan, met een markering waar wij staan.
const slot = $("#contact");
const slotEarth = $("#slot-earth");
const globe = $("#slot-globe");
const pin = $("#pin");
const pinCard = $("#pin-card");
const SL = { layoutKey: "", lx: 0, t: 0, stem: 74 };
// Onderaan draait de aarde ook, maar heen en terug, zodat het puntje op Nederland blijft en met het land meeschuift.
const slotCanvas = $("#slot-earth-gl");
const slotImg = $("#slot-globe img");
const PIN = { r: 2801.9, th: -0.01303 }; // Nederland op de foto, rond het middelpunt van de planeet
const SLOT_SWING = 0.016, SLOT_PERIOD = 44;
let slotGL = null;
if (cast && !reduce) {
  const start = () => {
    try { slotGL = createEarth(slotCanvas, slotImg); if (slotGL) globe.classList.add("is-turning"); } catch (err) { console.warn("[rizona] aarde onderaan draait niet", err); }
  };
  if (slotImg.complete && slotImg.naturalWidth) start(); else slotImg.addEventListener("load", start, { once: true });
}
function pinAt(shift) {
  const th = PIN.th + shift;
  return { x: (760 + PIN.r * Math.sin(th)) / 1536, y: (3370 - PIN.r * Math.cos(th)) / 1024 };
}
function placeGlobe() {
  const sb = slot.getBoundingClientRect();
  const grid = $(".oc-under").getBoundingClientRect();
  const phone = isPhone();
  // De horizon komt een stuk onder het formulier; de foto bedekt het hele stuk, zodat de lucht er al bovenin is.
  const horizon = (grid.bottom - sb.top) + (phone ? 90 : 120);
  const w = Math.max(innerWidth * (phone ? 2.8 : 1.35), (sb.height * 1.15) * 1536 / 1024, 1100);
  const h = w * 1024 / 1536;
  globe.style.setProperty("--gw", w + "px");
  globe.style.setProperty("--gy", (horizon - h * (488 / 1024)) + "px");
  globe.style.marginLeft = ((0.5 - 760 / 1536) * w) + "px";
  // Meten vanaf de ruststand van het puntje.
  const rest = pinAt(0);
  pin.style.left = (rest.x * 100).toFixed(3) + "%";
  pin.style.top = (rest.y * 100).toFixed(3) + "%";
  requestAnimationFrame(() => {
    const pb = pin.getBoundingClientRect();
    const s2 = slot.getBoundingClientRect();
    const cw = pinCard.offsetWidth, ch = pinCard.offsetHeight;
    // De kaart staat links van het puntje; als de aarde naar rechts draait, rekt de lijn mee.
    let cx = pb.left - s2.left - 84 - cw, cy = pb.top - s2.top - ch / 2;
    if (phone) { cx = Math.max(16, Math.min(s2.width - cw - 16, pb.left - s2.left - cw / 2)); cy = pb.top - s2.top + 30; }
    cx = Math.max(16, cx);
    pinCard.style.setProperty("--cx", cx + "px");
    pinCard.style.setProperty("--cy", cy + "px");
    SL.stem = phone ? 0 : Math.max(0, pb.left - s2.left - cx - cw - 10);
    SL.gw = globe.offsetWidth;
    pin.style.setProperty("--stem", SL.stem + "px");
  });
}
const seenIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { slot.classList.add("is-seen"); seenIO.disconnect(); } });
}, { threshold: 0.35 });
seenIO.observe(slotEarth);
function slotFrame(dt) {
  const sb = slot.getBoundingClientRect();
  if (sb.bottom < 0 || sb.top > innerHeight) return;
  const key = [innerWidth, innerHeight].join(",");
  if (key !== SL.layoutKey) { SL.layoutKey = key; placeGlobe(); }
  if (reduce) return;
  const k = 1 - Math.pow(0.001, dt);
  SL.lx = lerp(SL.lx, ptrLive() ? (ptr.x / innerWidth - 0.5) : 0, k * 0.25);
  const eb = slotEarth.getBoundingClientRect();
  const rel = clamp((innerHeight - eb.top) / (innerHeight + eb.height));
  globe.style.setProperty("--gp", ((0.5 - rel) * 60).toFixed(1) + "px");
  globe.style.transform = `translate3d(calc(-50% + ${(SL.lx * -10).toFixed(1)}px), var(--gp), 0)`;
  pinCard.style.transform = `translate3d(${(SL.lx * -10).toFixed(1)}px,${((0.5 - rel) * 60).toFixed(1)}px,0)`;
  if (slotGL) {
    SL.t += dt;
    const shift = SLOT_SWING * (1 - Math.cos((SL.t / SLOT_PERIOD) * Math.PI * 2));
    slotGL.render(globe.offsetWidth, globe.offsetHeight, Math.min(devicePixelRatio || 1, 1.25), shift);
    const p = pinAt(shift), p0 = pinAt(0);
    pin.style.left = (p.x * 100).toFixed(3) + "%";
    pin.style.top = (p.y * 100).toFixed(3) + "%";
    if (SL.stem) pin.style.setProperty("--stem", (SL.stem + (p.x - p0.x) * (SL.gw || globe.offsetWidth)).toFixed(1) + "px");
  }
}

// ------------------------------------------------------------ gesprek plannen ---
// "Plan een gesprek" opent de agenda van Cal.com in een venster op de site: de bezoeker kiest zelf een dag en tijd.
// Laadt Cal.com niet (blokkering, geen netwerk), dan opent de link de boekingspagina in een nieuw tabblad.
// Het laadstuk hieronder is de standaardcode van Cal.com. Het mailadres kan nog steeds gekopieerd worden.
(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "gesprek", { origin: "https://app.cal.com" });
Cal.ns.gesprek("ui", { theme: "dark", hideEventTypeDetails: false, layout: "month_view" });
$$("[data-plan]").forEach((a) => a.addEventListener("click", (e) => {
  if (!window.Cal.instance) return;
  e.preventDefault();
  Cal.ns.gesprek("modal", { calLink: "jamierizonastudio/kennismakingsgesprek", config: { layout: "month_view", theme: "dark" } });
}));
$$(".copy-mail").forEach((btn) => btn.addEventListener("click", async () => {
  const label = btn.querySelector("span");
  const en = root.lang === "en";
  try { await navigator.clipboard.writeText("hello@rizonastudio.com"); label.textContent = en ? "Copied" : "Gekopieerd"; }
  catch { label.textContent = "hello@rizonastudio.com"; }
  setTimeout(() => (label.textContent = en ? "Copy email address" : "Kopieer e-mailadres"), 2400);
}));

// ---------------------------------------------------------- diepe ruimte ---
// De achtergrond achter het probleem en de video, in plaats van zwart. Bij het probleem: sterren en een koele nevel,
// met de ring rond het beeld. Bij de video verdwijnen de sterren en staat de video op een donker podium: een zachte
// gloed erachter en de ring eromheen. Voor het contactblok komen de sterren terug.
const deep = $("#deep");
const deepStars = $("#deep-stars");
const deepOrbits = $("#deep-orbits");
function deepFrame() {
  const vh = innerHeight, vw = innerWidth;
  const pr = pain.getBoundingClientRect(), wr = werk.getBoundingClientRect(), sr = slot.getBoundingClientRect();
  // De achtergrond komt pas op als het LinkedIn-stuk helemaal weg is (dan staat het probleem vast), zodat er geen rand
  // tussen de twee te zien is. Hij verdwijnt weer voor het contactblok, dat zijn eigen sterren en aarde heeft.
  const dp = Math.min(smooth((-pr.top + vh * 0.02) / (vh * 0.45)), smooth((sr.top - vh * 0.3) / (vh * 0.6)));
  deep.style.opacity = dp.toFixed(3);
  if (dp <= 0) return;
  // Het podium komt op als de video in beeld komt en gaat weer weg aan het eind.
  const hIn = smooth((vh * 1.05 - wr.top) / (vh * 0.7));
  const h = Math.min(hIn, smooth((wr.bottom - vh * 0.55) / (vh * 0.5)));
  deep.style.setProperty("--na", (1 - h).toFixed(3));
  deep.style.setProperty("--nb", h.toFixed(3));
  // De sterren schuiven een klein beetje mee met de scroll (diepte), binnen hun eigen marge.
  const span = pr.height + wr.height;
  deepStars.style.transform = `translate3d(0,${(-clamp((vh - pr.top) / span) * 90).toFixed(1)}px,0)`;
  const phone = isPhone();
  const vf = vidFrame.getBoundingClientRect();
  const bx = vf.left + vf.width / 2, by = clamp(vf.top + vf.height / 2, -vh * 0.2, vh * 1.2);
  deep.style.setProperty("--vx", bx.toFixed(0) + "px");
  deep.style.setProperty("--vy", by.toFixed(0) + "px");
  // De ring: eerst rond het beeld van het probleem, bij de video rond de video, iets breder dan de video zelf.
  const pv = $(".pain-vis").getBoundingClientRect();
  const ax = phone ? vw / 2 : pv.left + pv.width / 2, ay = vh * 0.52;
  const ox = lerp(ax, bx, hIn), oy = lerp(ay, by, hIn);
  const sc = lerp(phone ? 0.55 : 1, (vf.width * (phone ? 1.5 : 1.32)) / 1120, hIn);
  deepOrbits.style.transform = `translate3d(${ox.toFixed(1)}px,${oy.toFixed(1)}px,0) scale(${sc.toFixed(3)})`;
}

// -------------------------------------------------------------- Orbit-cirkel ---
// Bij Contact start de cirkel vanzelf zodra hij goed in beeld komt: de bogen tekenen zich, daarna komt de
// uitnodiging op. Eén keer per bezoek, los van de scrollsnelheid. Bij minder beweging staat hij meteen af.
const oc = $("#oc");
const ocUnder = $(".oc-under");
const OC = { t0: 0, done: false };
const span01 = (x, a, b) => clamp((x - a) / (b - a));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
function ocSet(a, t, u) {
  const set = (k, v) => oc.style.setProperty(k, v.toFixed(4));
  set("--p", a); set("--a", a); set("--t", t);
  ocUnder.style.setProperty("--t", u.toFixed(4));
}
if (reduce) { ocSet(1, 1, 1); OC.done = true; } else ocSet(0, 0, 0);
function ocFrame() {
  if (OC.done) return;
  if (!OC.t0) {
    const r = oc.getBoundingClientRect();
    if (r.top + r.height * 0.5 > innerHeight * 0.9 || r.bottom < 0) return;
    OC.t0 = performance.now();
  }
  const s = (performance.now() - OC.t0) / 1000;
  ocSet(easeOut(span01(s, 0, 1.4)), smooth(span01(s, 0.5, 1.3)), smooth(span01(s, 0.85, 1.6)));
  if (s > 1.6) OC.done = true;
}

// ---------------------------------------------------------------- lus -----
function relayout() {
  requestAnimationFrame(() => { H.layoutKey = ""; SL.layoutKey = ""; });
}
relayout();
let rt = 0;
addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(relayout, 120); });

let last = performance.now();
let T = reduce ? 14 : 3;
function frame(now) {
  const dt = Math.min(0.06, Math.max(0.001, (now - last) / 1000));
  last = now;
  if (!reduce) T += dt;
  bar.classList.toggle("is-glass", scrollY > 24);
  heroFrame(T, dt);
  zichtFrame(T);
  painFrame();
  deepFrame();
  vidReveal();
  ocFrame();
  slotFrame(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
root.classList.add("is-ready");

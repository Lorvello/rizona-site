// Controle van de Rizona-site na een aanpassing, voordat (of nadat) je pusht.
//
//   npm i -D playwright-core            (eenmalig, in een map naar keuze)
//   node tools/controle.mjs http://127.0.0.1:8000/
//   node tools/controle.mjs https://rizonastudio.com/
//
// Gebruikt Google Chrome; een ander pad zet je in de omgevingsvariabele CHROME.
// Per schermmaat: geen fouten in de console, geen kapotte bestanden, niets breder dan het scherm,
// de video speelt in beeld, de herozin wisselt, en /privacy/ laadt.
import { chromium } from "playwright-core";

const base = (process.argv[2] || "http://127.0.0.1:8000/").replace(/\/?$/, "/");
const chrome = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const maten = [[1512, 945], [1050, 760], [390, 844]];

const browser = await chromium.launch({ executablePath: chrome, headless: true });
let ok = true;
for (const [w, h] of maten) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 760, hasTouch: w < 760 })).newPage();
  const fouten = [], kapot = [];
  page.on("pageerror", (e) => fouten.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") fouten.push(m.text()); });
  page.on("response", (r) => { if (r.status() >= 400) kapot.push(`${r.status()} ${r.url()}`); });

  await page.goto(`${base}?v=${Date.now()}`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  const teBreed = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  const zin1 = await page.evaluate(() => document.querySelector(".rot-line.is-on")?.textContent || "");
  await page.waitForTimeout(6800);
  const zin2 = await page.evaluate(() => document.querySelector(".rot-line.is-on")?.textContent || "");
  await page.evaluate(() => scrollTo({ top: document.querySelector("#werk").offsetTop, behavior: "instant" }));
  await page.waitForTimeout(1500);
  const video = await page.evaluate(() => { const v = document.querySelector("#vid"); return !!v && !v.paused; });
  const priv = await page.goto(`${base}privacy/`, { waitUntil: "load" });

  const goed = !fouten.length && !kapot.length && !teBreed && zin1 && zin1 !== zin2 && video && priv.ok();
  ok &&= goed;
  console.log(`${goed ? "OK  " : "FOUT"} ${w}x${h}`, JSON.stringify({ teBreed, zinWisselt: !!zin1 && zin1 !== zin2, video, privacy: priv.status(), kapot, fouten }));
}
await browser.close();
process.exit(ok ? 0 : 1);

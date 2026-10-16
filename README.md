# rizona-site: overdracht en gereedschap

Deze tak (`overdracht`) staat **niet** online. De website zelf staat op de tak **`gh-pages`**, en die zet GitHub Pages live op https://rizonastudio.com.

| Bestand | Waarvoor |
|---|---|
| [OVERDRACHT-LUCIANO.md](OVERDRACHT-LUCIANO.md) | Wat er op 15 oktober 2026 is gebeurd, welke adressen waar naartoe wijzen en wat er nog open staat. |
| [KEUZES.md](KEUZES.md) | Waarom de site is zoals hij is: opbouw, tekstregels (claimlijst), stijl, beweging en talen. |
| [tools/controle.mjs](tools/controle.mjs) | Controle na een aanpassing: geen fouten, geen kapotte bestanden, video speelt, herozin wisselt, privacy laadt. |
| [tools/naar-live.sh](tools/naar-live.sh) | Alleen voor Jamies werkkopie op zijn laptop: zet die schoon klaar en pusht naar `gh-pages`. |

## Iets aanpassen aan de site

1. Haal de site binnen:
   ```bash
   git clone -b gh-pages https://github.com/Lorvello/rizona-site.git
   ```
2. Pas aan. Alle tekst staat in `index.html`. Werk je Nederlandse tekst bij, pas dan ook de Engelse regel in `i18n.js` aan.
3. Bekijk het lokaal: `python3 -m http.server 8000` in de map, en open http://127.0.0.1:8000.
4. Draai de controle (vanuit een checkout van deze tak, met `npm i -D playwright-core`):
   ```bash
   node tools/controle.mjs http://127.0.0.1:8000/
   ```
5. Commit en push naar `gh-pages`. Binnen een paar minuten staat het live. Ververs https://rizonastudio.com om het te zien, en draai daarna nog eens `node tools/controle.mjs https://rizonastudio.com/`.

Teksten op de site volgen de claimlijst (B-0026): zie KEUZES.md.

## Laat altijd staan op gh-pages

- `CNAME` (rizonastudio.com), anders verliest GitHub Pages het domein.
- `privacy/`: de drie LinkedIn-apps linken naar `https://rizonastudio.com/privacy` en `/privacy/`.
- `.nojekyll`.

## Wat staat waar op gh-pages

| Bestand | Inhoud |
|---|---|
| `index.html` | De hele pagina en alle Nederlandse tekst |
| `site.css` | De opmaak |
| `site.js` | De beweging: hero, LinkedIn-stuk, probleem, video, cirkel, en de wisselende herozin (`ROT`) |
| `gl.js`, `orb.js` | De aarde en de Orbit-orb (WebGL, three.js) |
| `i18n.js` | De Engelse vertaling voor de NL/EN-knop |
| `legal.css`, `privacy/index.html` | De privacyverklaring |
| `assets/` | Lettertypen, logo, beelden, de video en de motoren (Scrollcraft, three.js) |

Op Jamies laptop staat de werkkopie (`rizona-redesign/scrollcraft/builds/rizona-opbouw`), met alle tussenversies (33 tot en met 67) en het volledige verslag per ronde. Die staan bewust niet in deze openbare repo.

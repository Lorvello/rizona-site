# Overdracht: de nieuwe website van Rizona Studio

Voor Luciano, en voor iedereen die later aan de site werkt. Stand van 16 oktober 2026.

## Wat er is gebeurd

Op 15 oktober 2026 is de nieuwe homepage live gegaan op **https://rizonastudio.com**. Mathew gaf akkoord. Jamie bouwde de site met Claude.

- De site staat in deze repo, `Lorvello/rizona-site`, op de tak **`gh-pages`**. GitHub Pages zet die tak online. Een push op `gh-pages` staat dus binnen een paar minuten live.
- De oude site (de sculptuurpagina "Jullie kennis. Eindelijk gezien.") is vervangen. Hij staat nog in de geschiedenis van `gh-pages`, tot en met commit `cb2a963`.
- Jamie (`JamieTahiri`) heeft sinds 15 oktober schrijfrecht op deze repo.

## Welke adressen waar naartoe wijzen

| Adres | Wijst naar | Opmerking |
|---|---|---|
| `rizonastudio.com` en `www` | GitHub Pages van deze repo | A-records 185.199.108.153 tot en met .111.153; `www` is een CNAME naar `lorvello.github.io`. Certificaat via GitHub, wordt vanzelf vernieuwd. |
| `orbit.rizonastudio.com` | De Orbit-app op Netlify (`sensational-longma-ade543`) | Sinds 12 oktober; daarvoor stond de app op het hoofddomein. |
| Mail (`@rizonastudio.com`) | Hostinger (MX `mx1`/`mx2.hostinger.com`) | Niet aangeraakt. |

De DNS staat bij Hostinger.

## Wat jij (Luciano) moet weten of doen

1. **Jouw citaat staat op de site.** Onder "In de praktijk" staat bij Brand Evolves: *"Wij werven klanten via e-mail. Orbit houdt bij wat er in onze markt speelt en kijkt hoe onze posts het doen. Daar komen concepten uit in onze woorden, en ik zeg pas ja als het klopt."*
   - Klopt dit voor jou? Zo niet, pas het aan in `index.html`.
   - Let op: "houdt bij wat er in onze markt speelt" klinkt als onderzoek dat altijd doorloopt. Volgens de claimlijst (B-0026) mogen we dat pas zeggen als dat onderzoek echt doorlopend draait. Maak er zo nodig iets van als "Orbit zoekt bronnen in onze markt".
2. **De app op orbit.rizonastudio.com is nog niet helemaal ingesteld:**
   - `isRizonaStudioHostname` in `src/lib/admin-workspace.ts` (productrepo, `origin/main`) kent alleen `rizonastudio.com` en `www.rizonastudio.com`, en nog niet `orbit.rizonastudio.com`. De beheer-startpagina herkent het nieuwe adres dus niet.
   - In Supabase Auth moeten de Site URL en de redirect `https://orbit.rizonastudio.com/**` erin staan. Dat is hier niet gecontroleerd, want daarvoor is het dashboard nodig.
   - Controleer ook `APP_BASE_URL` en `app_base_url` in de LinkedIn-credentialtabellen. Die kunnen nog naar het netlify.app-adres wijzen.
3. **De privacyverklaring moet blijven staan.** `/privacy/` in deze repo is dezelfde tekst als eerst (versie 3, met bewaartermijnen voor LinkedIn-data). De drie LinkedIn-apps linken ernaar: Rizona Studio en Rizona Studio Pages naar `https://rizonastudio.com/privacy`, Rizona Studio Data naar `https://rizonastudio.com/privacy/`. Gooi die map dus nooit weg.
4. **De contactknop opent een mail naar `hello@rizonastudio.com`.** Of die mailbox bestaat, is niet gecontroleerd. Stuur er één testmail naartoe.

## Nog open voor het team

- **Video bij "Zo werkt het"** (Mathews video, 44 seconden, Engels). Daarin staan twee zinnen die buiten de claimlijst vallen: "Orbit runs your LinkedIn" en "Orbit gets you there". Ook de meetmomenten in de video kloppen niet met het product. Mathew vervangt hem: zet een nieuwe `assets/video/orbit-video.mp4` neer, en zo nodig een nieuwe `poster.jpg`.
- **Engelse tekst** (de NL/EN-knop, `i18n.js`) is vertaald maar nog niet nagelezen.
- **Doelgroeptekst** ("Voor wie is Rizona Studio?" bij Vragen) is bewust breed gehouden tot het team een doelgroep kiest (B-0162/B-0169).

## Iets aanpassen

Zie `README.md` op deze tak. Kort gezegd: pas de bestanden op `gh-pages` aan, bekijk het lokaal, draai de controle en push. Binnen een paar minuten staat het live.

# Waarom de site is zoals hij is

De keuzes achter de homepage van rizonastudio.com, zodat wie hem later aanpast weet wat er bewust zo staat. Het ontwerp kwam tot stand in 67 rondes, van 12 tot en met 15 oktober 2026, met feedback van Jamie en Mathew en ideeën van Luciano's Azaria-site.

## 1. Het doel

Een bezoeker die ons niet kent, moet binnen een paar seconden snappen dat het over **LinkedIn-posts, bereik en klanten** gaat. Er is één hoofdactie: **Plan een gesprek**. Die knop opent een mail naar hello@rizonastudio.com. In dat gesprek laten we Orbit zien.

## 2. De opbouw, van boven naar beneden

1. **Hero:** de kop "LinkedIn-posts uit wat jij al weet.", met de echte Orbit-orb boven de aarde. Eronder staat "Wij schrijven je LinkedIn-posts," met een wisselende tweede regel (zie 3), en de glazen knop "Bekijk hoe het werkt", die naar de video springt.
2. **LinkedIn-stuk:** "Van jouw kennis … naar hun feed." zoomt in op het LinkedIn-logo, met kaartjes eromheen: een kennismaking, je post, een beslisser die je profiel bekijkt en een bericht. Op groot scherm staat "Wij maken het zichtbaar." linksboven, als kop boven het beeld (Mathews wens). Op de telefoon staat die zin onderaan.
3. **Het probleem:** drie pijnpunten met elk één beeld, en daarna "Het ligt aan de aanpak."
4. **Zo werkt het:** Mathews video, als kaart zoals op mathewgroen.com. In beeld speelt hij stil; met een klik gaat hij groot open, met geluid.
5. **In de praktijk:** "Hoe bedrijven dit toepassen." Twee kaarten, voor Brand Evolves en mathewgroen.com.
6. **Contact:** een cirkel met bogen boven de aarde, met "Orbit staat klaar · Zie Orbit in actie." en de amber knop. De cirkel speelt vanzelf af zodra hij in beeld komt.
7. **Vragen** en de **voettekst**, met KvK-nummer, adres en privacyverklaring.

## 3. Tekstregels

- **Alleen claims uit de claimlijst** (B-0026, `wiki/business/GOEDGEKEURDE_CLAIMS.md` in de kennisrepo). Dus:
  - geen groeibelofte zoals "meer bereik" of "meer klanten"; "gericht op" mag wel, dat is een mikpunt;
  - geen verzonnen klanten, cijfers of reviews;
  - niet "automatisch", niet "wij posten voor je" en niet "dagelijks onderzoek".
- **De wisselende regel in de hero** staat elke 6 seconden en wisselt tussen vijf zinnen. Elke zin hoort bij een toegestane claim:
  1. gericht op bereik bij je toekomstige klanten.
  2. uit de kennis die je al in huis hebt.
  3. gericht op gesprekken met nieuwe klanten.
  4. onderbouwd met bronnen uit jouw vak.
  5. die pas online gaan als jij ja zegt.

  Een zin toevoegen of wijzigen doe je in `site.js` (`ROT.nl` en `ROT.en`). Laat elke zin zin 1 van de kop afmaken: "Wij schrijven je LinkedIn-posts, …".
- **Een kop moet zeggen waar het over gaat.** Slimme tegenstellingen zonder onderwerp, zoals "Jij runt je bedrijf. Wij schrijven je posts.", zijn afgewezen.
- **Voorbeeldlabels:** bij beelden met cijfers staat "Voorbeeld, geen echte cijfers." (bij Het probleem). De kaartjes in het LinkedIn-stuk gaan over "jij" en hebben geen cijfers, dus die hebben geen label.
- **In de praktijk:** de citaten gaan over de eigen bedrijven van twee oprichters en zijn door hen goedgekeurd. Daarom staat eronder "Luciano en Mathew zijn ook de mensen achter Rizona." Een verborgen band bij een aanbeveling is misleidend, dus die regel blijft staan tot er echte klanten op de site komen. **Nooit nep-reviews:** die zijn in Nederland verboden en Google verwijdert ze.

## 4. Stijl

- **Donkere glaswereld** (B-0115), dezelfde als in de Orbit-app. Cyaan en blauw zijn de lichtkleuren; amber is alleen voor de hoofdknop.
- **Logo:** de losse blauwe R met "Rizona Studio" ernaast (`assets/brand/`).
- **Balk bovenaan:** plat over de hele breedte, net als op Luciano's Azaria-site. Eronder loopt een dun, lichtblauw lijntje met de gloed van de aarde, dat net voor de randen stopt. In de balk staan Het probleem · Zo werkt het · In de praktijk · Vragen · NL / EN, en rechts "Plan een gesprek". Een pagina "Over ons" komt later.
- **Voettekst:** dezelfde stijl als de balk (plat, met het blauwe lijntje erboven), met de kolommen Pagina, Contact en Juridisch.

## 5. Beweging

- Alles draait op de Scrollcraft-motor (`assets/vendor/scrollcraft.js`). De aarde en de orb zijn echte WebGL (`gl.js`, `orb.js`, three.js).
- **Bij minder beweging** (de instelling in het besturingssysteem) staat alles stil en blijft alles leesbaar: geen wissel, geen inzoomen, de cirkel staat meteen af.
- De video speelt alleen als hij in beeld is. Links binnen de pagina springen met een kort doek, zodat je niet door de bewegende stukken scrolt.

## 6. Talen

Nederlands is de standaard. De NL/EN-knop zet elke tekst om via een woordenlijst in `i18n.js`. Wie Nederlandse tekst toevoegt of wijzigt, past daar ook de Engelse regel aan; anders blijft die zin in het Engels-scherm Nederlands. De Engelse tekst is nog niet nagelezen.

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
const compact = window.matchMedia("(max-width: 860px)");
const exampleAct = document.querySelector(".example");
if (reduced.matches || compact.matches) {
  exampleAct.dataset.scAct = "flow";
}
const engine = window.ScrollCraft.mount(document);
const sources = {
  vraag: {
    label: "een klantvraag",
    source:
      "“Klanten vragen ons: is één training genoeg? In ons traject oefenen teams ook tussen de sessies, met situaties uit hun eigen werk.”",
    attribution: "Fictief voorbeeld van een opleider",
    posts: {
      inzicht: [
        "Een goede training eindigt niet als iedereen naar huis gaat.",
        "“Is één training genoeg?” Die vraag krijgen we vaak.",
        "Daarom laten we teams tussen de sessies oefenen met situaties uit hun eigen werk. Wat ging er goed? Waar liep je vast?",
        "Die ervaringen nemen we mee naar de volgende sessie. Zo krijgt een inzicht de kans om een gewoonte te worden.",
      ],
      praktisch: [
        "Plan de eerste oefening voordat de training voorbij is.",
        "Kies aan het einde van een sessie één situatie waarin je het geleerde wilt gebruiken.",
        "Spreek af wanneer je het probeert. Schrijf daarna op wat werkte en wat lastig bleef.",
        "Dat is precies het materiaal dat we in onze volgende sessie bespreken. Klein beginnen maakt de volgende stap concreet.",
      ],
      gesprek: [
        "Wat bleef er over van jouw laatste training?",
        "Niet de slides. Niet het certificaat. Maar iets wat je de week erna echt anders deed.",
        "In ons traject oefenen teams tussen de sessies met hun eigen werksituaties. Wat ze tegenkomen, wordt de inhoud van het volgende gesprek.",
        "Wat helpt jou om een goed inzicht ook echt in je werk te gebruiken?",
      ],
    },
  },
  les: {
    label: "een praktijkles",
    source:
      "“In een project bleven besluiten hangen. We zetten bij elk open punt wie de beslissing neemt en wanneer. Toen konden we gericht verder.”",
    attribution: "Fictief voorbeeld van een adviseur",
    posts: {
      inzicht: [
        "Een open punt heeft een eigenaar nodig.",
        "In een project dat we begeleidden, bleven dezelfde onderwerpen terugkomen. Er werd wel over gesproken, maar er kwam geen besluit.",
        "We maakten twee dingen expliciet: wie neemt de beslissing en wanneer?",
        "Vanaf dat moment konden we gericht opvolgen. De oplossing begon bij duidelijkheid over de volgende stap.",
      ],
      praktisch: [
        "Sluit een overleg af met twee namen op papier.",
        "Wie werkt het open punt uit? En wie neemt daarna het besluit?",
        "Zet er meteen een datum bij. Zo weet iedereen welke stap van hen wordt verwacht.",
        "Dit hielp ons bij een project waarin besluiten bleven hangen. Een kleine afspraak die je in je volgende overleg kunt proberen.",
      ],
      gesprek: [
        "Welk besluit schuift bij jullie steeds een week op?",
        "We kwamen het tegen in een project: een open punt dat iedere vergadering weer op de agenda stond.",
        "We legden vast wie de beslissing neemt en op welke datum. Daarmee werd duidelijk waar de volgende stap lag.",
        "Hoe zorgen jullie ervoor dat een open punt ook echt wordt afgesloten?",
      ],
    },
  },
  visie: {
    label: "een eigen visie",
    source:
      "“Wij beginnen een automatiseringsproject met de vraag waarom een handeling bestaat. Soms hoeft die handeling helemaal niet meer.”",
    attribution: "Fictief voorbeeld van een automatiseringsbureau",
    posts: {
      inzicht: [
        "Soms is schrappen de beste automatisering.",
        "Een terugkerende handeling valt al snel op als kans om tijd te besparen.",
        "Wij beginnen een stap eerder: waarom doen we dit eigenlijk nog? Wie gebruikt de uitkomst?",
        "Als niemand er iets mee doet, hoeft er misschien geen systeem voor gebouwd te worden. Die vraag stellen we vóór we gaan bouwen.",
      ],
      praktisch: [
        "Stel deze vraag voordat je iets automatiseert.",
        "“Wat gebeurt er als we deze handeling niet meer doen?”",
        "Vraag het aan degene die de uitkomst gebruikt. Is die uitkomst nog nodig? Is er al een andere manier om eraan te komen?",
        "Wij gebruiken dat gesprek om eerst het proces te begrijpen. Pas daarna kiezen we wat we gaan bouwen.",
      ],
      gesprek: [
        "Welke handeling doen jullie vooral omdat het altijd zo ging?",
        "Wij komen ze tegen wanneer we een automatiseringsproject starten. Een overzicht, een controle, een extra overdracht.",
        "Onze eerste vraag is waarom die stap bestaat. Soms is er een goede reden. Soms is die reden inmiddels verdwenen.",
        "Welke stap in jouw werk zou je graag eens opnieuw bekijken?",
      ],
    },
  },
};
const angleLabels = {
  inzicht: "inzicht",
  praktisch: "praktische tip",
  gesprek: "gespreksstarter",
};
const params = new URLSearchParams(location.search);
let source = Object.hasOwn(sources, params.get("bron"))
  ? params.get("bron")
  : "vraag";
let angle = Object.hasOwn(angleLabels, params.get("hoek"))
  ? params.get("hoek")
  : "inzicht";
const status = document.getElementById("interaction-status");
const select = document.getElementById("angle");
let statusTimer;
function announce(message) {
  clearTimeout(statusTimer);
  status.textContent = "";
  statusTimer = setTimeout(() => {
    status.textContent = message;
  }, 60);
}
function postText() {
  return sources[source].posts[angle].join("\n\n");
}
function render({ updateURL = true, announceChange = false } = {}) {
  const data = sources[source];
  const lines = data.posts[angle];
  document.getElementById("source-text").textContent = data.source;
  document.querySelector(".note-footer span").textContent = data.attribution;
  const fragment = document.createDocumentFragment();
  lines.forEach((text, index) => {
    const el = document.createElement(index ? "p" : "h3");
    if (!index) el.id = "post-title";
    el.textContent = text;
    fragment.append(el);
  });
  document.getElementById("post-content").replaceChildren(fragment);
  document.querySelectorAll("[data-source]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.source === source),
    );
  });
  select.value = angle;
  document.getElementById("selected-summary").textContent =
    "Jouw selectie: " + data.label + " als " + angleLabels[angle] + ".";
  if (updateURL) {
    const url = new URL(location.href);
    url.searchParams.set("bron", source);
    url.searchParams.set("hoek", angle);
    history.replaceState(null, "", url);
  }
  if (announceChange)
    announce(
      "Voorbeeld veranderd: " + data.label + " als " + angleLabels[angle] + ".",
    );
  engine.layout();
}
document.querySelectorAll("[data-source]").forEach((button) => {
  button.addEventListener("click", () => {
    source = button.dataset.source;
    render({ announceChange: true });
  });
});
select.addEventListener("change", () => {
  angle = select.value;
  render({ announceChange: true });
});
window.addEventListener("popstate", () => {
  const query = new URLSearchParams(location.search);
  source = Object.hasOwn(sources, query.get("bron"))
    ? query.get("bron")
    : "vraag";
  angle = Object.hasOwn(angleLabels, query.get("hoek"))
    ? query.get("hoek")
    : "inzicht";
  render({ updateURL: false });
});
document
  .getElementById("copy-post")
  .addEventListener("click", async (event) => {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(postText());
      button.firstChild.textContent = "Post gekopieerd ";
      announce("De voorbeeldpost staat op je klembord.");
    } catch {
      button.firstChild.textContent = "Kopiëren lukt niet ";
      announce(
        "Je browser blokkeert het klembord. Selecteer de tekst of gebruik Download jouw voorbeeld onderaan de pagina.",
      );
    }
    setTimeout(() => {
      button.firstChild.textContent = "Kopieer deze post ";
    }, 2800);
  });
document.getElementById("download-example").addEventListener("click", () => {
  const text =
    "JOUW LINKEDIN-VOORBEELD\nWebsiteconcept · fictief, vooraf geschreven voorbeeld\n\nBRON\n" +
    sources[source].source +
    "\n\nINVALSHOEK\n" +
    angleLabels[angle] +
    "\n\nVOORBEELDPOST\n" +
    postText() +
    "\n\nVÓÓR GEBRUIK\nMaak dit voorbeeld eigen. Gebruik uitsluitend ervaringen en feiten die voor jou kloppen.\n";
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "linkedin-voorbeeld-" + source + "-" + angle + ".txt";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  announce("Jouw gekozen voorbeeld wordt gedownload.");
});
render({ updateURL: false });
// Reduced motion and mobile remain in document flow even after viewport changes.
function updateLayoutMode() {
  const isFlow = reduced.matches || compact.matches;
  exampleAct.style.height = isFlow ? "auto" : "";
  engine.layout();
}
compact.addEventListener("change", () => location.reload());
reduced.addEventListener("change", () => {
  // The engine reads this preference at mount. A reload applies it consistently.
  location.reload();
});
if (!reduced.matches && !params.has("no3d")) {
  import("./sculpture.js")
    .then((module) => module.createSculpture(engine))
    .catch(() => {
      document.querySelector(".sculpture-wrap").classList.add("is-fallback");
    });
} else {
  document.querySelector(".sculpture-wrap").classList.add("is-fallback");
  document.documentElement.dataset.scene = "poster";
}

// Test instrumentation reads the actual painted transform, not scroll progress.
let verifyFrame = 0;
function reportPaintedState() {
  verifyFrame = 0;
  const matrix = new DOMMatrixReadOnly(
    getComputedStyle(document.querySelector(".post")).transform,
  );
  const stage = document.querySelector(".example-stage");
  stage.dataset.scVerifyState = [
    matrix.m42.toFixed(1),
    matrix.m11.toFixed(3),
    matrix.m12.toFixed(3),
  ].join(",");
}
addEventListener(
  "scroll",
  () => {
    if (!verifyFrame) verifyFrame = requestAnimationFrame(reportPaintedState);
  },
  { passive: true },
);
reportPaintedState();

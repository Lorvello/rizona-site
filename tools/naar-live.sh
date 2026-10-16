#!/bin/zsh
# Zet de werkkopie rizona-opbouw live op rizonastudio.com (Lorvello/rizona-site, tak gh-pages).
#   ./naar-live.sh klaarzetten              -> maakt rizona-live/ schoon opnieuw (geen versiewisselaar, geen testbestanden)
#   ./naar-live.sh publiceren "Wat er veranderde"   -> klaarzetten + commit + push naar gh-pages (= meteen live)
set -euo pipefail
HIER=${0:A:h}
BRON=$HIER/rizona-opbouw
LIVE=$HIER/rizona-live
REPO=Lorvello/rizona-site

klaarzetten() {
  rm -rf "$LIVE" && mkdir -p "$LIVE/assets/agents" "$LIVE/assets/live" "$LIVE/privacy"
  cp "$BRON"/{index.html,site.css,site.js,gl.js,orb.js,i18n.js,legal.css} "$LIVE/"
  cp "$BRON/privacy/index.html" "$LIVE/privacy/"
  cp -R "$BRON"/assets/{vendor,fonts,brand,video} "$LIVE/assets/"
  cp "$BRON/assets/mark.svg" "$LIVE/assets/"
  cp "$BRON/assets/agents/orbit-orb.webp" "$LIVE/assets/agents/"
  cp "$BRON/assets/live/regiekern-horizon.jpg" "$LIVE/assets/live/"
  # versiewisselaar en versienummer eruit
  sed -i '' -e '/<script src="\.\/versies\.js" defer><\/script>/d' -e 's/ data-versie="[0-9]*"//' "$LIVE/index.html"
  printf 'rizonastudio.com' > "$LIVE/CNAME"; touch "$LIVE/.nojekyll"
  if grep -q 'versies.js' "$LIVE/index.html"; then echo "FOUT: versiewisselaar staat er nog in" >&2; exit 1; fi
  echo "Klaar: $LIVE"
}

publiceren() {
  local bericht=$1
  klaarzetten
  local W; W=$(mktemp -d)/rizona-site
  git clone -q --depth 5 --branch gh-pages "https://github.com/$REPO.git" "$W"
  rsync -a --delete --exclude .git --exclude .gitignore --exclude README.md "$LIVE"/ "$W"/
  cd "$W"
  git add -A
  if git diff --cached --quiet; then echo "Niets veranderd; niets gepubliceerd."; return 0; fi
  git status --short
  git commit -q -F - <<MSG
$bericht

MJL-Person: Jamie
MJL-Device: jamie-laptop
MJL-Client: claude-code

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
MSG
  git push -q origin gh-pages
  echo "Gepusht: $(git rev-parse --short HEAD). GitHub Pages bouwt nu; binnen een paar minuten live."
}

case ${1:-} in
  klaarzetten) klaarzetten ;;
  publiceren) [[ -n ${2:-} ]] || { echo 'Gebruik: ./naar-live.sh publiceren "Wat er veranderde"' >&2; exit 1; }; publiceren "$2" ;;
  *) echo 'Gebruik: ./naar-live.sh klaarzetten | publiceren "Wat er veranderde"' >&2; exit 1 ;;
esac

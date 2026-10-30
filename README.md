# Clubins Website

Statischer One-Pager für Clubins — dunkler Editorial-Look, deutsche Copy, kein Build-Step.
Live unter: https://clubins.github.io/website-hack/

Clubins misst Lautstärke, Auslastung und Umgebung in Bars und Clubs und macht daraus
betriebsfähige Entscheidungsdaten (Sensorik → Ingest → Dashboard). Diese Seite ist die
öffentliche Landingpage dafür — gebaut nach dem Blueprint „Clubins Website — Spec“.

## Projektzweck

- Ein One-Pager (`index.html`) mit Anker-Navigation (Produkt · Vorteile · Preise · Über uns)
  plus `impressum.html` und `datenschutz.html` als klar markierte Platzhalter.
- Reines HTML/CSS/vanilla JS — kein Framework, kein Build-Step, keine Cookies, keine Tracker.
- Fonts (Playfair Display, Inter) sind als WOFF2 im Repo self-hosted; keine externen Requests.

## Lokale Vorschau

Kein Build nötig — einfach einen statischen Server starten:

```sh
python3 -m http.server 8000
```

Danach im Browser öffnen: http://localhost:8000

## Deployment

Automatisch: jeder Push auf `main` löst den GitHub-Actions-Workflow
`.github/workflows/deploy.yml` aus, der den Repo-Stand 1:1 auf GitHub Pages deployt
(`workflow_dispatch` erlaubt zusätzlich manuelle Runs). Es gibt keinen Build-Schritt —
was im Repo liegt, ist live.

## Platzhalter-Konvention

Demo-Inhalte und offene Rechtstexte sind im Code markiert und bewusst ersatzbereit:

- `TODO(CONTENT)` — Demo-Inhalte aus den Mockups (Venue-Namen, Zitate, Kennzahlen),
  die vor dem echten Go-live durch echte Inhalte ersetzt werden.
- `TODO-LEGAL` — Platzhalter in `impressum.html` und `datenschutz.html`;
  die juristischen Texte liefert der Nutzer.

Außerdem: die Pilot-E-Mail-Adresse ist als JS-Konstante `PILOT_EMAIL` in `assets/js/main.js`
hinterlegt (aktuell `pilot@clubins.de`) und wird vor dem Go-live getauscht.

# Clubins Website

Statischer One-Pager für Clubins — dunkler Editorial-Look, deutsche Copy, kein Build-Step.
Ziel-URL: https://clubins.github.io/website-hack/

**Load-bearing assumption:** Die Seite soll qualifizierte Pilotanfragen ermöglichen.
Bestätigen lässt sich das durch tatsächlich eingehende, passende Anfragen; bleibt dies
nach Veröffentlichung aus, sind neben der Seite auch Reichweite, Angebot, Vertrauen und
die Mailto-Hürde zu prüfen. Vor echtem Go-live Empfänger und Anfrageweg testen.

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

## Wartung und Grenzen

- `index.html`: elf Bereiche in Blueprint-Reihenfolge, einschließlich Navigation und Footer.
  „Über uns“ ist in den Zitat-Bereich integriert; „Preise“ führt zum Pilotprogramm.
- `assets/css/style.css`: Blueprint-Tokens, responsive Layouts (Burger unter 900 px),
  sichtbare Tastatur-Fokusse und `prefers-reduced-motion`.
- `assets/js/main.js`: progressive Navigation, einmalige Scroll-Reveals, reine Funktion
  `buildPilotMailto` und Formular. Keine Speicherung, kein Backend. Ohne JavaScript bleiben
  Texte/Anker zugänglich; der Formular-Submit bleibt deaktiviert.
- Demo-Zahlen, fiktive Venues und Beispielstimmen sind zusätzlich sichtbar gekennzeichnet.
  Das generierte Gründerporträt ist ein Symbolbild, kein tatsächliches Teammitglied.
- Social-Icons sind bewusst nicht verlinkte Platzhalter, bis echte Profile vorliegen.
- Alle Website-Ressourcen sind relativ referenziert; auch OG-Bildpfad gemäß Blueprint.
  Manche Social-Crawler erwarten absolute OG-Bild-URLs; deren Linkvorschau ist nicht garantiert.
- Rechtsseiten sind ausdrücklich unvollständige Entwürfe und per `noindex` markiert.
  Technische Veröffentlichung ist keine rechtliche Go-live-Freigabe.

## Quellen der Assets

Die neun WebP-Fotos stammen aus dem Bild-Task dieses Projekts (generierte Illustrationen):

| Datei                 | Projektdatei |
| --------------------- | ------------ |
| hero-crowd.webp       | fl_4OV9EaBp  |
| founder-portrait.webp | fl_BMkWwvxW  |
| sensor-product.webp   | fl_jJXpZ7p1  |
| montage.webp          | fl_jyhPGzDR  |
| bar-detail.webp       | fl_UxpDxEXe  |
| crowd-cta.webp        | fl_JH5eZH9U  |
| avatar-1.webp         | fl_UzmDfvIC  |
| avatar-2.webp         | fl_asj9YE3f  |
| avatar-3.webp         | fl_5H8bhqvi  |

Schriftdateien: lokale Latin-WOFF2 aus den installierten Fontsource-Paketen
`@fontsource/inter` (400/500/600 normal) und `@fontsource/playfair-display`
(400 normal/italic). Die SIL-OFL-Lizenzen liegen unter `assets/fonts/`.
Es gibt keine Font-Anfrage an einen Drittanbieter zur Laufzeit.

## QA vor Merge

Die dependency-freien Regressionstests laufen lokal mit `node --test tests/site.test.cjs`
und auf Pull Requests über `.github/workflows/check.yml`. Geprüft werden Mailto-Encoding,
relative Ressourcen/Anker, Demo-/Rechtsmarker und lokale Font-Dateien. Der Workflow
verändert das Deployment nicht und führt keinen Build-Schritt ein.

Lokal starten und in einem zweiten Terminal prüfen:

```sh
npx lighthouse http://localhost:8000 --only-categories=accessibility --preset=desktop
# Erwartung: keine Treffer (grep-Exitcode 1):
grep -rE 'fonts.googleapis|googletagmanager|cdn\.' index.html assets
```

Browser-Prüfungen: 375/768/1440 px ohne horizontales Scrollen; Menü öffnen/schließen,
Escape, Anker und Tab-Fokus; Formular-Pflichtfelder, E-Mail-Validierung und Mailto-Übergabe;
Rechtsseiten; alle Ressourcen auch unter dem Pfadpräfix `/website-hack/`.
Mailto benötigt ein eingerichtetes E-Mail-Programm. Die Website behauptet nie, eine
Nachricht versendet zu haben. Lighthouse- und Browser-Evidenz werden im PR dokumentiert.

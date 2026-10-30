const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

// Boot without a DOM so the pure functions can be tested independently.
const context = vm.createContext({
  document: {
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
  },
  window: { matchMedia: () => ({ matches: true }) },
});
vm.runInContext(read("assets/js/main.js"), context);

test("mailto encodes umlauts, ampersands, plus signs and trims fields", () => {
  const input = {
    club: "  Bühne & Bar? #1  ",
    name: " Änne + Team ",
    email: "a+pilot@example.test",
  };
  const url = new URL(context.buildPilotMailto(input));
  assert.equal(url.protocol, "mailto:");
  assert.equal(url.pathname, "pilot@clubins.de");
  assert.equal(
    url.searchParams.get("subject"),
    "Pilot-Anfrage: Bühne & Bar? #1",
  );
  assert.equal(
    url.searchParams.get("body"),
    "Club/Venue: Bühne & Bar? #1\nAnsprechpartner: Änne + Team\nE-Mail: a+pilot@example.test",
  );
  assert.deepEqual([...url.searchParams.keys()], ["subject", "body"]);
});

test("user input cannot introduce another mailto query parameter", () => {
  const url = new URL(
    context.buildPilotMailto({
      club: "Club&bcc=other@example.test",
      name: "Name",
      email: "test@example.test",
    }),
  );
  assert.equal(url.searchParams.has("bcc"), false);
});

test("language-switch links carry the current section anchor exactly once", () => {
  assert.equal(context.withAnchor("en/", "#produkt"), "en/#produkt");
  assert.equal(context.withAnchor("../", ""), "../");
  assert.equal(context.withAnchor("en/#produkt", "#preise"), "en/#produkt");
});

// Language mirrors: German at the root, English under en/.
const pages = {
  de: ["index.html", "impressum.html", "datenschutz.html"],
  en: ["en/index.html", "en/legal.html", "en/privacy.html"],
};
const legalPages = [
  "impressum.html",
  "datenschutz.html",
  "en/legal.html",
  "en/privacy.html",
];

test("all pages use their declared language, unique IDs, existing relative resources and anchors", () => {
  for (const [lang, files] of Object.entries(pages))
    for (const file of files) {
      const html = read(file);
      assert.match(html, new RegExp(`<html lang="${lang}">`));
      assert.match(html, /name="description"/);
      const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
      assert.equal(new Set(ids).size, ids.length, `${file}: duplicate id`);
      for (const [, target] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
        assert.ok(
          !/^(?:\/|[a-z]+:)/i.test(target),
          `${file}: non-relative ${target}`,
        );
        if (target.startsWith("#"))
          assert.ok(
            ids.includes(target.slice(1)),
            `${file}: missing anchor ${target}`,
          );
        else
          assert.ok(
            fs.existsSync(path.resolve(root, path.dirname(file), target)),
            `${file}: missing ${target}`,
          );
      }
      assert.ok(!/lorem ipsum/i.test(html));
    }
});

test("blueprint sections, labels and legal markers remain present in both languages", () => {
  const german = read("index.html");
  const english = read("en/index.html");
  for (const html of [german, english])
    assert.equal([...html.matchAll(/<section\b/g)].length, 9); // + header and footer = eleven.
  for (const text of [
    "1.284",
    "28.420 €",
    "82 %",
    "TODO(CONTENT)",
    "og:image",
    "pilot-form",
  ])
    assert.ok(german.includes(text));
  for (const text of [
    "1,284",
    "€28,420",
    "82%",
    "TODO(CONTENT)",
    "og:image",
    "pilot-form",
  ])
    assert.ok(english.includes(text));
  for (const file of legalPages) assert.match(read(file), /TODO-LEGAL/);
});

test("english legal placeholders point back to the binding German versions", () => {
  assert.ok(read("en/legal.html").includes('href="../impressum.html"'));
  assert.ok(read("en/privacy.html").includes('href="../datenschutz.html"'));
});

// hreflang pairs: de ↔ en, x-default always the German page.
const hreflangPairs = {
  "index.html": { de: "index.html", en: "en/index.html" },
  "impressum.html": { de: "impressum.html", en: "en/legal.html" },
  "datenschutz.html": { de: "datenschutz.html", en: "en/privacy.html" },
  "en/index.html": { de: "../index.html", en: "index.html" },
  "en/legal.html": { de: "../impressum.html", en: "legal.html" },
  "en/privacy.html": { de: "../datenschutz.html", en: "privacy.html" },
};

test("each page carries the hreflang pair set with x-default pointing at German", () => {
  for (const [file, targets] of Object.entries(hreflangPairs)) {
    const html = read(file);
    for (const [lang, href] of Object.entries(targets))
      assert.ok(
        html.includes(
          `<link rel="alternate" hreflang="${lang}" href="${href}" />`,
        ),
        `${file}: hreflang ${lang} → ${href}`,
      );
    assert.ok(
      html.includes(
        `<link rel="alternate" hreflang="x-default" href="${targets.de}" />`,
      ),
      `${file}: x-default → ${targets.de}`,
    );
  }
});

test("og:locale alternates mirror the page language", () => {
  assert.ok(
    read("index.html").includes('property="og:locale" content="de_DE"'),
  );
  assert.ok(
    read("index.html").includes(
      'property="og:locale:alternate" content="en_US"',
    ),
  );
  assert.ok(
    read("en/index.html").includes('property="og:locale" content="en_US"'),
  );
  assert.ok(
    read("en/index.html").includes(
      'property="og:locale:alternate" content="de_DE"',
    ),
  );
});

// The switcher lives in the pill nav of the one-pagers; legal pages have no nav.
const switchTargets = {
  "index.html": { active: "DE", links: ["./", "en/"] },
  "en/index.html": { active: "EN", links: ["../", "./"] },
};

test("the pill nav switcher marks the active language and only points at existing pages", () => {
  for (const [file, { active, links }] of Object.entries(switchTargets)) {
    const block = /<div class="lang-switch"[\s\S]*?<\/div>/.exec(read(file));
    assert.ok(block, `${file}: language switcher missing`);
    const hrefs = [...block[0].matchAll(/href="([^"]+)"/g)].map(
      (match) => match[1],
    );
    assert.deepEqual(hrefs, links, `${file}: switcher links`);
    for (const href of hrefs) {
      assert.ok(!/^(?:\/|[a-z]+:)/i.test(href), `${file}: non-relative ${href}`);
      assert.ok(
        fs.existsSync(path.resolve(root, path.dirname(file), href)),
        `${file}: switcher target ${href} missing`,
      );
    }
    const activeLink = /<a href="[^"]+" aria-current="true">([A-Z]+)<\/a>/.exec(
      block[0],
    );
    assert.ok(activeLink, `${file}: active language not marked`);
    assert.equal(activeLink[1], active, `${file}: wrong active language`);
  }
  // EN mirrors reference the shared assets, never a copy.
  assert.ok(!fs.existsSync(path.join(root, "en", "assets")));
  for (const file of pages.en)
    assert.match(read(file), /href="\.\.\/assets\//);
});

test("fonts stay local WOFF2 and source contains no tracker or CDN references", () => {
  const css = read("assets/css/style.css");
  const fonts = [...css.matchAll(/url\(["']?([^)'"]+)/g)].map(
    (match) => match[1],
  );
  assert.equal(fonts.length, 5);
  for (const font of fonts) {
    const bytes = fs.readFileSync(path.resolve(root, "assets/css", font));
    assert.equal(bytes.subarray(0, 4).toString(), "wOF2");
  }
  for (const file of [
    "index.html",
    "impressum.html",
    "datenschutz.html",
    "en/index.html",
    "en/legal.html",
    "en/privacy.html",
    "assets/css/style.css",
    "assets/js/main.js",
  ]) {
    assert.doesNotMatch(
      read(file),
      /fonts\.googleapis|googletagmanager|cdn\./i,
    );
  }
});

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

// Boot without a DOM so the pure mailto transformation can be tested independently.
const context = vm.createContext({
  document: { querySelector: () => null, getElementById: () => null },
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

test("all pages use German, unique IDs, existing relative resources and anchors", () => {
  for (const file of ["index.html", "impressum.html", "datenschutz.html"]) {
    const html = read(file);
    assert.match(html, /<html lang="de">/);
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
          fs.existsSync(path.join(root, target)),
          `${file}: missing ${target}`,
        );
    }
    assert.ok(!/lorem ipsum/i.test(html));
  }
});

test("blueprint sections, labels and legal markers remain present", () => {
  const html = read("index.html");
  assert.equal([...html.matchAll(/<section\b/g)].length, 9); // + header and footer = eleven.
  for (const text of [
    "1.284",
    "28.420 €",
    "82 %",
    "TODO(CONTENT)",
    "og:image",
    "pilot-form",
  ])
    assert.ok(html.includes(text));
  for (const file of ["impressum.html", "datenschutz.html"])
    assert.match(read(file), /TODO-LEGAL/);
});

test("fonts stay local WOFF2 and source contains no tracker or CDN references", () => {
  const css = read("assets/css/style.css");
  const fonts = [...css.matchAll(/url\(["']?([^)'\"]+)/g)].map(
    (match) => match[1],
  );
  assert.equal(fonts.length, 5);
  for (const font of fonts) {
    const bytes = fs.readFileSync(path.resolve(root, "assets/css", font));
    assert.equal(bytes.subarray(0, 4).toString(), "wOF2");
  }
  for (const file of [
    "index.html",
    "assets/css/style.css",
    "assets/js/main.js",
  ]) {
    assert.doesNotMatch(
      read(file),
      /fonts\.googleapis|googletagmanager|cdn\./i,
    );
  }
});

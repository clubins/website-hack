"use strict";

const PILOT_EMAIL = "pilot@clubins.de"; // TODO: vor Go-live echte Adresse eintragen.

// UI strings for both language mirrors; German is the root version and the fallback.
const UI_STRINGS = {
  de: {
    menuOpen: "Menü öffnen",
    menuClose: "Menü schließen",
    formIncomplete: "Bitte fülle alle Felder aus; Leerzeichen allein reichen nicht.",
    formHandoff:
      "Dein E-Mail-Programm wird angefragt. Noch nichts versendet. Falls es nicht öffnet, richte ein E-Mail-Programm ein oder schreibe an " +
      PILOT_EMAIL +
      ".",
  },
  en: {
    menuOpen: "Open menu",
    menuClose: "Close menu",
    formIncomplete: "Please fill in every field; whitespace alone is not enough.",
    formHandoff:
      "Your email program will be asked to open. Nothing has been sent yet. If it does not open, set up an email program or write to " +
      PILOT_EMAIL +
      ".",
  },
};
const uiStrings =
  UI_STRINGS[
    (document.documentElement?.lang || "de").slice(0, 2).toLowerCase()
  ] ?? UI_STRINGS.de;

/** Keep user-entered punctuation inside the encoded subject/body, never mail headers. */
function buildPilotMailto({ club, name, email }, recipient = PILOT_EMAIL) {
  const subject = `Pilot-Anfrage: ${club.trim()}`;
  const body = [
    `Club/Venue: ${club.trim()}`,
    `Ansprechpartner: ${name.trim()}`,
    `E-Mail: ${email.trim()}`,
  ].join("\n");
  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function setupNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.getElementById("nav-links");
  const header = document.querySelector(".site-header");
  const mobile = window.matchMedia("(max-width: 899px)");
  if (!toggle || !links || !header) return;

  function setMenu(open, restoreFocus = false) {
    links.hidden = mobile.matches && !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? uiStrings.menuClose : uiStrings.menuOpen);
    if (restoreFocus) toggle.focus();
  }

  toggle.hidden = false;
  setMenu(false);
  toggle.addEventListener("click", () => {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  mobile.addEventListener("change", () => setMenu(false));
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      toggle.getAttribute("aria-expanded") === "true"
    ) {
      setMenu(false, true);
    }
  });
  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !header.contains(event.target))
      setMenu(false);
  });
  header.addEventListener("focusout", (event) => {
    if (
      event.relatedTarget instanceof Node &&
      !header.contains(event.relatedTarget)
    )
      setMenu(false);
  });
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => {
      setMenu(false);
      const target = document.getElementById(
        link.getAttribute("href").slice(1),
      );
      if (!target) return;
      // Native anchors retain browser history; focus follows keyboard navigation too.
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });

  if (!("IntersectionObserver" in window)) return;
  // Scroll-spy marks section links only — language links keep their own aria-current.
  const navLinks = [...links.querySelectorAll("a")].filter(
    (link) => !link.closest(".lang-switch"),
  );
  const observer = new IntersectionObserver(
    (entries) => {
      const active = entries.find((entry) => entry.isIntersecting);
      if (!active) return;
      navLinks.forEach((link) => {
        if (link.hash === `#${active.target.id}`)
          link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-15% 0px -60% 0px", threshold: 0 },
  );
  document
    .querySelectorAll("main > section[id]")
    .forEach((section) => observer.observe(section));
}

function setupReveals() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove("reveal-pending");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08 },
  );
  document.querySelectorAll(".reveal").forEach((element) => {
    element.classList.add("reveal-pending");
    observer.observe(element);
  });
  // A preference change must not leave already-pending content concealed.
  reducedMotion.addEventListener("change", () => {
    if (!reducedMotion.matches) return;
    observer.disconnect();
    document
      .querySelectorAll(".reveal-pending")
      .forEach((element) => element.classList.remove("reveal-pending"));
  });
}

function setupPilotForm() {
  const form = document.getElementById("pilot-form");
  const submit = document.getElementById("pilot-submit");
  const status = document.getElementById("form-status");
  const recipient = document.getElementById("pilot-recipient");
  if (!form || !submit || !status || !recipient) return;
  recipient.textContent = PILOT_EMAIL;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const club = String(data.get("club") ?? "");
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    if (![club, name, email].every((value) => value.trim())) {
      status.textContent = uiStrings.formIncomplete;
      return;
    }
    const mailto = buildPilotMailto({ club, name, email });
    status.textContent = uiStrings.formHandoff;
    window.location.href = mailto;
  });
  submit.disabled = false;
}

/** Carry the current section anchor over to the other language, exactly once. */
function withAnchor(href, hash) {
  return hash && !href.includes("#") ? href + hash : href;
}

function setupLanguageSwitch() {
  document.querySelectorAll(".lang-switch a").forEach((link) => {
    link.addEventListener("click", () => {
      link.setAttribute(
        "href",
        withAnchor(link.getAttribute("href"), window.location?.hash || ""),
      );
    });
  });
}

setupNavigation();
setupReveals();
setupPilotForm();
setupLanguageSwitch();

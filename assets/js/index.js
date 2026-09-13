import {
  LanguageDropdownRenderer
} from "./render.js";

import { DATA } from "content-data";

export function select(el, all = false) {
  el = el.trim();
  if (all) return [...document.querySelectorAll(el)];
  if (el === "window") return window;
  return document.querySelector(el);
}

(function () {
  "use strict";


  /*--------------------------------------------------------------------------- 
    STATE
  ---------------------------------------------------------------------------*/
  let activeLangBtn = null;


  /*--------------------------------------------------------------------------- 
    RESET HASH ON PAGE RELOAD
  ---------------------------------------------------------------------------*/
const navigation = performance.getEntriesByType("navigation")[0];

if (navigation?.type === "reload") {
  // Prevent browser from restoring the previous scroll position
  history.scrollRestoration = "manual";

  // Remove hash
  const url = window.location.pathname + window.location.search;

  window.history.replaceState(null, "", url);

  // Go to top
  window.scrollTo(0, 0);
}
  /*--------------------------------------------------------------------------- 
    RESTORE SCROLL ON PAGE LOAD (NEW PAGE AFTER LANGUAGE SWITCH)
  ---------------------------------------------------------------------------*/
  window.addEventListener("load", () => {

    const savedY = sessionStorage.getItem("scrollY");

    if (savedY !== null) {
      const y = parseInt(savedY, 10);

      const restore = () => window.scrollTo(0, y);

      // prevents layout shift / clamp issues
      requestAnimationFrame(restore);
      setTimeout(restore, 50);
      setTimeout(restore, 150);
      sessionStorage.removeItem("scrollY");
    }
  });

  /*--------------------------------------------------------------------------- 
    INIT
  ---------------------------------------------------------------------------*/
  document.addEventListener("DOMContentLoaded", () => {
    window.addEventListener("mousemove", handleSpotlight);
    window.addEventListener("dragover", handleSpotlight);

    // highlight active nav link
    select(".nav-link-group a", true).forEach((el) => {
      if (el.href === window.location.href) {
        el.classList.add("active");
      }
    });

    // Initialize active button from current page language
    select(".lang-option", true).forEach(btn => {
      if (btn.dataset.lang === document.documentElement.lang) {
        btn.classList.add("active");
        activeLangBtn = btn;
    
        lf.textContent = btn.getElementsByClassName('flag')[0].textContent;
        lc.textContent = btn.dataset.lang.toUpperCase();
      }
    });
  });

  /*--------------------------------------------------------------------------- 
    LANGUAGE SWITCH (CORE FIXED LOGIC)
  ---------------------------------------------------------------------------*/
/* ── LANGUAGE SWITCHER ── */
const ls = document.querySelector(".lang-control");
const lf = document.querySelector(".lang-flag");
const lc = document.querySelector(".lang-code");

// Toggle dropdown
document.querySelector(".lang-trigger").addEventListener("click", e => {
  e.stopPropagation();
  ls.classList.toggle("open");
});

// Close when clicking outside
document.addEventListener("click", () => {
  ls.classList.remove("open");
});
// Handle language selection
document.addEventListener("click", e => {
  const btn = e.target.closest(".lang-option");

  if (!btn || btn === activeLangBtn) return;

  const lang = btn.dataset.lang;
  const flag = btn.getElementsByClassName('flag')[0].textContent

  // Save preference
  localStorage.setItem("prefLang", lang);

  // Save scroll position
  sessionStorage.setItem("scrollY", window.scrollY);

  // Update active button
  activeLangBtn?.classList.remove("active");
  btn.classList.add("active");
  activeLangBtn = btn;

  // Update UI
  lf.textContent = flag;
  lc.textContent = lang.toUpperCase();
  document.documentElement.lang = lang;

  ls.classList.remove("open");

  // Build a language-aware URL that works for both
  // /jortdeboer_web/en/... and /en/... page conventions.
  const pathname = window.location.pathname;
  const base = "/jortdeboer_web/";
  let newPath;

  if (pathname.startsWith(base)) {
    newPath = pathname.replace(/^\/jortdeboer_web\/(en|nl)\//, `${base}${lang}/`);
  } else if (/^\/(en|nl)\//.test(pathname)) {
    newPath = pathname.replace(/^\/(en|nl)\//, `/${lang}/`);
  } else {
    newPath = `${base}${lang}${pathname}`;
  }

  window.location.href = newPath + window.location.hash;
});

  /*--------------------------------------------------------------------------- 
    HELPERS
  ---------------------------------------------------------------------------*/
  window.selecttID = (el) => document.getElementById(el);
  window.selectt = (el, all = false) => {
    el = el.trim();
    if (all) return [...document.querySelectorAll(el)];
    if (el === "window") return window;
    return document.querySelector(el);
  };


  /*--------------------------------------------------------------------------- 
    SPOTLIGHT EFFECT
  ---------------------------------------------------------------------------*/
  function handleSpotlight(e) {

    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;

    document.body.style.setProperty("--mouse-x", `${x}%`);
    document.body.style.setProperty("--mouse-y", `${y}%`);
  }

  new LanguageDropdownRenderer(DATA.languages, select('.lang-dropdown')).run()

})();
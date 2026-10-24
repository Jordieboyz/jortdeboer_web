import { DATA } from "content-data";
import { APP_EVENTS } from "./events.js";
import { 
  select, 
  LanguageDropdownRenderer 
} from "./render.js";


(function () {
  "use strict";

  /*--------------------------------------------------------------------------- 
    + Static Rendered Elements
  ---------------------------------------------------------------------------*/
  new LanguageDropdownRenderer(DATA.languages, select('.lang-dropdown'))

  /*--------------------------------------------------------------------------- 
    + EVENT implementations
  ---------------------------------------------------------------------------*/
  document.addEventListener(APP_EVENTS.OPEN_LANGUAGE_SELECTION, ({ detail })     => { 
    if(detail.langBtn){
      // find corresponding data-entry based on 'language'-attribute
      const [clickedFlag, clickedLang] = detail.langBtn.querySelectorAll('span');
      const lang = DATA.languages.find(l => l.language === clickedLang.textContent).code;

      // Save preference
      localStorage.setItem("prefLang", lang);

      // Save scroll position
      sessionStorage.setItem("scrollY", window.scrollY);

      setLangActive(detail.langBtn)
      updatePageLang(lang)
    }
  });

  /*--------------------------------------------------------------------------- 
    + Page Specific Variables
  ---------------------------------------------------------------------------*/
  let activeLangBtn = null;

  /*--------------------------------------------------------------------------- 
    + On first Load of the page / DOMContentLoaded
  ---------------------------------------------------------------------------*/
  document.addEventListener("DOMContentLoaded", () => {
    // highlight active nav link
    select(".nav-link-group a", true).forEach((el) => {
      if (el.href === window.location.href) {
        el.classList.add("active");
      }
    });

    const selectedLang = DATA.languages.find(l => l.code === document.documentElement.lang);
    select(".lang-option", true).forEach(option => {
      const [flag, lang] = option.querySelectorAll('span');
      if (lang.textContent == selectedLang.language) {
        setLangActive(option);
      }
    });

    window.addEventListener("mousemove", handleSpotlight);
    document.addEventListener("click", (e) => {
      const ls = select(".lang-control");
      e.target.closest(".lang-trigger") ? ls.classList.add("open") : ls.classList.remove("open");
    });
  });

  /*--------------------------------------------------------------------------- 
    + Functions
  ---------------------------------------------------------------------------*/
  /**
   * Allows the user to select another language.
   * @param {string} langBtn the button used to change the language.
   */
  function setLangActive(langBtn){
    activeLangBtn?.classList.remove("active");
    langBtn.classList.add("active");
    activeLangBtn = langBtn;

    select('.lang-trigger span', true)[0].textContent = langBtn.querySelectorAll('span')[0].textContent;
  }

  /**
   * Reloads page on language change.
   * @param {string} newLang The new language that should be loaded.
   */
   function updatePageLang(newLang){
     const pathname = window.location.pathname;
    const languagePath = /^\/(en|nl)(?=\/|$)/;
    const newPath = languagePath.test(pathname)
      ? pathname.replace(languagePath, `/${newLang}`)
      : pathname === "/"
        ? `/${newLang}/home.html`
        : `/${newLang}${pathname}`;

    window.location.href = newPath + window.location.search + window.location.hash;
  }
  /**
   * navigation?.
   * @param {Event} event The event to trigger change in mouseposition.
   */
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

  /**
   * Onload.
   * @param {Event} event The event to trigger change in mouseposition.
   */
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

  /**
   * Handles a spotlight on the cursor position.
   * @param {Event} event The event to trigger change in mouseposition.
   */
  function handleSpotlight(e) {
    document.body.style.setProperty("--mouse-x", 
      `${(e.clientX / window.innerWidth) * 100}%`
    );
    document.body.style.setProperty("--mouse-y", 
      `${(e.clientY / window.innerHeight) * 100}%`
    );
  }

})();
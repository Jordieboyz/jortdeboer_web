(function() {
  "use strict";


  document.addEventListener('DOMContentLoaded', () => {
    // 1. Force scroll position to the top, Using a short timeout ensures this runs after any browser-default fragment scrolling
    setTimeout(function(){
      if (window.location.hash) {
        history.replaceState(null, null, ' '); 
      }
      window.scrollTo(0, 0);
    }, 100) 
  
    // 2. Set up mouse listener for the new spotlight effect
    window.addEventListener('mousemove', handleSpotlight);
    
    // 3. Render Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

  });

  // Easy helper function
  window.getBaseFile = (str) => { return str.split('/').pop().split('#')[0] }
  window.selectID = (el) => { return document.getElementById(el) } 
  window.select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else if (el == 'window' ){
      return window
    } else {
      return document.querySelector(el)
    }
  }
 
  function handleSpotlight(e) {
    const body = document.body;
    
    // Calculate mouse position relative to the viewport in percentage
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;

    // Update CSS variables on the body
    body.style.setProperty('--mouse-x', `${x}%`);
    body.style.setProperty('--mouse-y', `${y}%`);
  }

})()
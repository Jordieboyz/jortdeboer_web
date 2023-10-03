
(function() {
  "use strict";
  

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else if (el == 'window' ){
      return window
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    let elementPos = select(el).offsetLeft
    window.scrollTo({
      left: elementPos,
      behavior: 'smooth'
    })
  }

  const changeActive = (navitem,dest) => {
    const active = select('.active')
    if(active.getAttribute("href") != dest){
      active.classList.replace('active','idle')
      navitem.classList.replace('idle','active')
    }
  }
  /**
   * Scroll with ofset on links with a class name .scrollto
   */
  on('click', '.scrollto', function(e) {
    if (select(this.hash)) {
    
      localStorage.setItem('curr_page_hash', this.hash);

      e.preventDefault()

      let body = select('body')
      if (body.classList.contains('mobile-nav-active')) {
        body.classList.remove('mobile-nav-active')
        let navbarToggle = select('.mobile-nav-toggle')
        navbarToggle.classList.toggle('bi-list')
        navbarToggle.classList.toggle('bi-x')
      }
      changeActive(this, this.hash)
      scrollto(this.hash)
    }
  }, true)
  

  on('load', 'window', () => { 
    const currhash = localStorage.getItem('curr_page_hash')
    select('.scrollto', true).forEach(e => changeActive(e, currhash))
    scrollto(currhash)
  })

  on('resize', 'window', () =>{ scrollto(localStorage.getItem('curr_page_hash'))})

  on('change', '#projects input', function(){
    for (var gi of select('#projects input',true)) {
      if(gi != this){
        gi.checked = false
      }
    }
  }, true)  

  /**
   * Hero type effect
   */
  const typed = select('.typed')
  if (typed) {
    var typed_strings = typed.getAttribute('data-typed-items')
    typed_strings = typed_strings.split(',')
    var typer = new Typed('.typed', {
      strings: [typed_strings[0]],
      loop: false,
      typeSpeed: 20,
    })
  }


  /**
   * Home effects
   */
  const typed_input = select('.style')
  typed_input.onclick = function() {
    var curr = document.getElementsByClassName('current')[0]
    var next = document.getElementsByClassName('next')[0]

    // Enable animation
    curr.style.animationName = (this.checked ? 'fade_in_out2' : 'fade_in_out1')
    curr.style.animationDuration = '1s'

    // set variable on inline style
    document.querySelector(':root').style.setProperty("--color-scheme", (this.checked ? 'rgb(41, 233, 2)' : 'rgb(2, 216, 233)'));


    // Change 'p' content around
    var change = setInterval(function(){
      if(window.getComputedStyle(curr).getPropertyValue('opacity') == 0){
        var tmp = curr.innerHTML
        curr.innerHTML = next.innerHTML
        next.innerHTML = tmp
        clearInterval(change)
      }},100) 
    
    typer.strings = [(this.checked ? typed_strings[1] : typed_strings[0])]
    typer.reset()  
  }



})()
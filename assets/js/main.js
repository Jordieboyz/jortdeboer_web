
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
    updatePlaceholderElement('title')
    updatePlaceholderElement('content')
    scrollto('#home')
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
  on('click', '.style', function(e) {
    
    var curr = document.getElementsByClassName('current')[0]
    var next = document.getElementsByClassName('next')[0]
    let cbx_val = e.target.checked

    changeOnOpacity(curr, ()=>{
          var tmp = curr.innerHTML
          curr.innerHTML = next.innerHTML
          next.innerHTML = tmp
        }, (cbx_val ? 'fade_in_out2' : 'fade_in_out1'), 1000)
    
      // set variable on inline style
    document.querySelector(':root').style.setProperty("--color-scheme", (cbx_val ? 'rgb(41, 233, 2)' : 'rgb(2, 216, 233)'));

    typer.strings = [(cbx_val ? typed_strings[1] : typed_strings[0])]
    typer.reset()  
  })

  
  function changeOnOpacity(el, func_on_change,  animation_name, animation_duration=1000){
    el.style.animationName = animation_name
    el.style.animationDuration = animation_duration + 'ms'

    var change = setInterval(function(){
      if(window.getComputedStyle(el).getPropertyValue('opacity') == 0){
        func_on_change()
        clearInterval(change)
      }
    },100) 
  }

  function updatePlaceholderElement(elname){
    const selected_project = document.getElementById(select('.selected').href.split('#')[1])
    let ph = select('.placeholder')

    if(elname=='title'){
      ph.getElementsByClassName(elname)[0].textContent = selected_project.getAttribute(elname)
    } else {
      ph.getElementsByClassName(elname)[0].innerHTML = selected_project.getElementsByClassName(elname)[0].innerHTML
    }
  }

  
  select('.names a', true).forEach((e) => {

    e.addEventListener('mouseover', (e)=>{ 
      var _this = e.target

      if(_this != select('.selected')){
        const title = document.getElementById(_this.hash.split('#')[1]).getAttribute('title')
        select('.names').lastElementChild.textContent = title
      }
    })

    e.addEventListener('mouseleave', function(){
      select('.names').lastElementChild.textContent = ''
    })


    e.addEventListener('click', function(e){
      e.preventDefault()
      var _this = e.target

      let selected = select('.selected')

      if(_this != selected ){
        if(!locked_animation){
          _this.classList.add('selected')
          selected.classList.remove('selected')
          changeOnOpacity(select('.title'),()=>{updatePlaceholderElement('title')}, 'fade_in_out1', 1000)
          changeOnOpacity(select('.content'),()=>{updatePlaceholderElement('content')}, 'fade_in_out1', 1000)
        }
      } 
    })




  })
  var locked_animation = false
  on("animationstart", '.placeholder .title', function() { locked_animation=true})
  on("animationstart", '.placeholder .content', function() { locked_animation=true})
  on("animationend", '.placeholder .title', function() { locked_animation=false; this.style.animationName = '' })
  on("animationend", '.placeholder .content', function() { locked_animation=false; this.style.animationName = '' })


})()
(function() {
  "use strict";

  const mediaQuery = window.matchMedia('(min-width: 768px)');

  document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Attach Toggle Event Listener
    const toggleButton = document.getElementById('about-me-toggle');
    toggleButton?.addEventListener('click', (e) => {
        e.preventDefault(); // Stop the default link navigation
        toggleBio();
    });

    // 2. Update Nav Logo Visibility upon passing the 'home-title'
    window.addEventListener('scroll', function(){
      select('.nav-logo').classList.toggle('active', select('.home-title').getBoundingClientRect().top < 0);
    });

    // Listen for window size changes
    mediaQuery.addEventListener('change', updateProjectDescriptions);

    SetupSliderTrack()
  });

  // Home type effect
  const typed = select('.typed')
  if (typed) {
    var typed_strings = typed.getAttribute('data-typed-items')
    typed_strings = typed_strings.split(',')
    var typer = new Typed('.typed', {
      strings: typed_strings,
      loop: true,
      typeSpeed: 20,
      backSpeed: 20,
      backDelay: 3000
    })
  }

  // Function that updates all descriptions when screen size changes
  function updateProjectDescriptions() {
    const cards = select('.project-card', true);
    cards.forEach((card, index) => {
      const desc = card.querySelector('.project-description');
      const project = projectsData[index];
      if (desc && project) {
        desc.textContent = mediaQuery.matches
          ? project.shortDescription
          : project.focus;
      }
    });
  }



  function SetupSliderTrack() {
    const sliderTrack = selectID('slider-track');
    if (!sliderTrack) return;

    sliderTrack.innerHTML = '';

    projectsData.forEach(project => {
      sliderTrack.appendChild(createProjectCardHtml(project, false, false, true, true));
      sliderTrack.lastChild.addEventListener('click', (e) => {
        const target = e.target;

        if (!target.closest('.card-footer')) {
          e.preventDefault();
          e.stopPropagation();
        }
      });
    });
    

    // Render Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    selectID('prev-slide')?.addEventListener('click', () => slideProjects(-1));
    selectID('next-slide')?.addEventListener('click', () => slideProjects(1));
    selectID('slider-track')?.addEventListener('scroll', highlightActiveCard);
    window.addEventListener('resize', highlightActiveCard);
  }


  function toggleBio() {
    const bio = selectID('home-bio');
    const button = selectID('about-me-toggle');
    const icon = button.querySelector('[data-lucide]'); 

    if (!bio || !button || !icon) {
      console.error("Toggle elements not found.");
      return;
    }
    bio.classList.toggle('expanded') ? icon.setAttribute('data-lucide', 'chevron-up') : icon.setAttribute('data-lucide', 'chevron-down');
    
    // Re-render the icon after changing the attribute
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }


  /**
   * Calculates the distance to scroll and scrolls the track.
   * @param {number} direction - -1 for previous, 1 for next.
   */
  function slideProjects(direction) {
    const track = selectID('slider-track');
    const cards = track.querySelectorAll('.project-card');
    const currentScroll = track.scrollLeft;
    
    if (!track || cards.length === 0) return;

    // Find the center of the viewport
    const viewportCenter = currentScroll + (track.clientWidth / 2);
    
    let targetCardIndex = -1;
    let minDistance = Infinity;

    // 1. Determine the index of the currently active/centered card
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
      const distance = Math.abs(viewportCenter - cardCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        targetCardIndex = index;
      }
    });

    // 2. Calculate the index of the *next* card based on direction
    let nextIndex = targetCardIndex + direction;
    
    // Clamp index to boundaries
    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex >= cards.length) nextIndex = cards.length - 1;

    // 3. Calculate the required scroll position to center the *next* card
    const nextCard = cards[nextIndex];
    
    // Scroll position = Card's left position - distance from viewport left to center
    const scrollTo = nextCard.offsetLeft - (track.clientWidth / 2) + (nextCard.offsetWidth / 2);

    track.scrollTo({
      left: scrollTo,
      behavior: 'smooth'
    });
  }

  /**
   * Updates the visual focus on cards based on their distance from the center.
   * Also updates the disabled state of the navigation buttons.
   */
  function highlightActiveCard() {
    const track = selectID('slider-track');
    const cards = track.querySelectorAll('.project-card');
    const prevBtn = selectID('prev-slide');
    const nextBtn = selectID('next-slide');

    if (!track || !prevBtn || !nextBtn) return;

    const currentScroll = track.scrollLeft;
    const viewportCenter = currentScroll + (track.clientWidth / 2);
    
    let minDistance = Infinity;

    cards.forEach(card => {
      const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
      const distance = Math.abs(viewportCenter - cardCenter);

      // 1. Dynamic Focus Effect
      const cardWidth = card.offsetWidth;
      const maxDistance = cardWidth * 1.5; // Fade effect distance 
      const normalizedDistance = Math.min(1, distance / maxDistance);

      // Opacity: from 1 (center) down to 0.4 (edge)
      const opacity = 1 - (normalizedDistance * .4); 
      card.style.opacity = opacity;

      // Scale: from 1 (center) down to 0.9 (edge)
      const scale = 1 - (normalizedDistance * 0.1); 
      card.style.transform = `scale(${scale})`;
      
      // Find the card closest to the center for potential "active" class
      if (distance < minDistance) {
          minDistance = distance;
      }
    });
    
    // 2. Button Disabling Logic (using a tolerance threshold)
    const scrollEndTolerance = 10;
    
    // For 'Prev' button: check if scroll is near the start
    prevBtn.disabled = currentScroll < scrollEndTolerance; 

    // For 'Next' button: check if scroll is near the end
    // track.scrollWidth is total content width
    // track.clientWidth is the visible area width
    nextBtn.disabled = currentScroll + track.clientWidth >= track.scrollWidth - scrollEndTolerance;
  }


})()
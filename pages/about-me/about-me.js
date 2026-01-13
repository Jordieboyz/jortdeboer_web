(function() {
    "use strict";

    // Global utility to prevent rapid double-clicks during transition
    let isTransitioning = false; 

    document.addEventListener('DOMContentLoaded', () => {
        // Assume these functions are defined elsewhere or not strictly needed for the carousel
        createExpertiseInput(); 

        createBeyondWorkCards();
        
        // Find and initialize ALL carousels after they are created
        document.querySelectorAll('.carousel-container').forEach(initializeCarousel);

        // Rename updateCarousela to the existing updateCarousels
        window.addEventListener('resize', () => {
            isTransitioning = false; 
            updateCarousels();
        });

        // Initialize Lucide Icons after content is rendered
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    });

    /**
     * Creates content blocks, including the carousel structure.
     * Also adds the necessary buttons and dots dynamically.
     */
    function createBeyondWorkCards(){
        // Note: Assuming 'select' is a defined helper function (e.g., document.querySelector)
        const contentContainer = select('.beyond-work-content-container') || document.querySelector('.beyond-work-content-container');

        if (!contentContainer || typeof BeyondWorkData === 'undefined') return;

        BeyondWorkData.forEach((project, blockIndex) => {
            const imgsHtml = (project.imgs || []).map(img =>
                `<div class="carousel-slide"><img src="${img}" alt=""></div>`
            ).join('');
            
            // Generate a unique ID for each carousel track if the project has images
            const trackId = `carouselTrack-${blockIndex}`;
            const controlsId = `carouselControls-${blockIndex}`;

            // Only render carousel structure if images exist
            const carouselHtml = (project.imgs && project.imgs.length > 0) ? 
                `<div class="carousel-container" data-track-id="${trackId}">
                    <div class="carousel-track-container">
                        <div class="carousel-track" id="${trackId}">
                            ${imgsHtml}
                        </div>
                    </div>
                </div>` : 
                // Fallback for blocks without images (using a standard image/wrapper)
                `<div class="image-wrapper">
                    <img src="${project.img}" class="project-image" alt="${project.id}">
                </div>`;


            const blockHtml = 
             `<div class="content-block">
                ${carouselHtml}
                
                <div class="text-wrapper">
                    <h3 class="sub-title "><i data-lucide="${project.icon}"></i><span>${project.id}</span></h3>
                    <p class="project-description"> 
                        ${project.description}
                    </p>
                </div>
            </div>`;
            
            // Insert content block
            contentContainer.insertAdjacentHTML('beforeend', blockHtml);
        });
    }
    
    function createExpertiseInput(){
        const contentContainer = select('.expertise-table');
        const tbodyEl = document.createElement('tbody');

        expertiseTable.forEach((expertise) => {
            tbodyEl.innerHTML += `
                <tr>
                    <td>${expertise.category}</td>
                    <td>${(expertise.values || []).join(', ')}</td>
                </tr>`
        });
        contentContainer.appendChild(tbodyEl);
    }

    /**
     * Initializes a single carousel track for looping, adds clones, and sets initial position.
     * @param {HTMLElement} container - The .carousel-container element.
     */
    function initializeCarousel(container) {
        const trackId = container.dataset.trackId;
        const carouselTrack = document.getElementById(trackId);
        if (!carouselTrack) return;

        const originalSlides = Array.from(carouselTrack.children);
        const totalOriginalSlides = originalSlides.length;
        if (totalOriginalSlides < 2) {
            // No need for a carousel if 0 or 1 slide
            container.querySelector('.carousel-controls').style.display = 'none';
            return;
        }

        // Store original count and current index (starting at 1 for the first real slide)
        carouselTrack.dataset.totalOriginalSlides = totalOriginalSlides;
        carouselTrack.dataset.currentIndex = 1;

        // Clone the first and last slides
        const firstClone = originalSlides[0].cloneNode(true);
        const lastClone = originalSlides[totalOriginalSlides - 1].cloneNode(true);

        firstClone.classList.add('clone', 'first-clone');
        lastClone.classList.add('clone', 'last-clone');

        carouselTrack.appendChild(firstClone);
        carouselTrack.prepend(lastClone);

        // Re-get slides including clones
        const slides = Array.from(carouselTrack.children); 
        
        // Attach transition end listener for teleporting
        carouselTrack.addEventListener('transitionend', () => {
            isTransitioning = false;
            handleLoopTeleport(carouselTrack, totalOriginalSlides);
        });
        
        // Initial setup to correctly position the view on the first real slide (index 1)
        carouselTrack.style.transition = 'none'; // Disable transition for initial jump
        updateCarousel(carouselTrack, slides, false);

        // Re-enable transition after a moment
        setTimeout(() => {
            carouselTrack.style.transition = 'transform 0.5s ease-in-out';
        }, 50);
    }
    
    /**
     * Handles the jump (teleport) when crossing the loop boundary.
     */
    function handleLoopTeleport(carouselTrack, totalOriginalSlides) {
        let currentIndex = parseInt(carouselTrack.dataset.currentIndex, 10);
        
        // If we landed on the last clone (Track Index 0), jump to the last real slide
        if (currentIndex === 0) {
            currentIndex = totalOriginalSlides;
            carouselTrack.dataset.currentIndex = currentIndex;
            updateCarousel(carouselTrack, null, false);
        } 
        // If we landed on the first clone (Track Index totalOriginalSlides + 1), jump to the first real slide
        else if (currentIndex === totalOriginalSlides + 1) {
            currentIndex = 1;
            carouselTrack.dataset.currentIndex = currentIndex;
            updateCarousel(carouselTrack, null, false);

        }
    }


    /**
     * Updates the position and appearance of all carousels on the page.
     * This is the function called on resize and initial load (via initializeCarousel).
     */
    function updateCarousels(useTransition = true) {
        const tracks = document.querySelectorAll('.carousel-track');

        tracks.forEach((carouselTrack) => {
            const slides = Array.from(carouselTrack.children);
            if (slides.length < 2) return; // Ignore tracks without enough slides/clones
            
            updateCarousel(carouselTrack, slides, useTransition);
        });
    }

    /**
     * Core function to calculate transform and update visual state for a single carousel.
     */
    function updateCarousel(carouselTrack, slides, useTransition = true) {
        // Fetch values if not passed
        slides = slides || Array.from(carouselTrack.children);
        let currentIndex = parseInt(carouselTrack.dataset.currentIndex, 10);
        const totalOriginalSlides = parseInt(carouselTrack.dataset.totalOriginalSlides, 10);
        
        // Set transition property
        if (!useTransition) {
            carouselTrack.style.transition = 'none';
            carouselTrack.querySelectorAll('.carousel-slide').forEach(track => {
                track.style.transition = `none`;
            });
        } else {
            carouselTrack.style.transition = 'transform 0.5s ease-in-out';
                        carouselTrack.querySelectorAll('.carousel-slide').forEach(track => {
                track.style.transition = `all 0.5s ease-in-out`;
            });
        }
        
        // --- CENTERING LOGIC ---
        const activeSlideElement = slides[currentIndex];
        if (!activeSlideElement) return;

        const activeSlideWidth = activeSlideElement.offsetWidth;
        
        let offset = 0;
        for (let i = 0; i < currentIndex; i++) {
            const computedMargin = parseFloat(getComputedStyle(slides[i]).marginLeft) || 0;
            offset += slides[i].offsetWidth + (2 * computedMargin);
        }
        
        const trackContainerWidth = carouselTrack.parentElement.offsetWidth;
        const centerOffset = (trackContainerWidth / 2) - (activeSlideWidth / 2);
        const activeSlideMarginLeft = parseFloat(getComputedStyle(activeSlideElement).marginLeft) || 0;
        const finalTransformX = -offset + centerOffset - activeSlideMarginLeft;

        carouselTrack.style.transform = `translateX(${finalTransformX}px)`;

        // --- Z-INDEX & VISIBILITY FIX ---
        slides.forEach((slide, index) => {
  
            slide.classList.remove('active');
            
            const distance = Math.abs(index - currentIndex);

            if (index === currentIndex) {
                slide.classList.add('active');
                slide.style.zIndex = 10;
                slide.style.visibility = 'visible';
            } else if (distance === 1) {
                slide.style.zIndex = 8;
                slide.style.visibility = 'visible';
            } else {
                slide.style.zIndex = 0; 
                slide.style.visibility = 'hidden'; 
            }

            // Click listener for non-active slides
            if (index !== currentIndex) {
                slide.onclick = () => {
                    if (isTransitioning) return;
                    carouselTrack.dataset.currentIndex = index;
                    updateCarousel(carouselTrack);
                };
            } else {
                slide.onclick = null;
            }
        });
    }    
})()
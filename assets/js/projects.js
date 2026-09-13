import { CategoryRenderer, ProjectModalRenderer, ProjectRenderer, select } from "./render.js";
import { DATA } from "content-data"

/*---------------------------------------------------------------------------
    Module Variables
---------------------------------------------------------------------------*/
let activeCategory = 'All'; // Default active category

const modalOverlay = select('.project-modal-overlay');
const modalDetails = select('.modal-project-details');

new CategoryRenderer(DATA.categories, select('.category-tabs'), 
  {
    onClick : setActiveCategory
  }
)

/**
 * Sets the active category, updates the tabs, and renders the project list.
 * @param {string} category - The competency ID to activate ('All', 'swe', 'gd', 'ac', or 'at')
 */
function setActiveCategory(category) {
    activeCategory = category;

    select('.filter-button.active')?.classList.remove('active');
    select(`.filter-button[data-category="${category}"]`)?.classList.add('active');

    // 3. Render the filtered projects
    renderProjectList();
}

/**
 * Filters projects by the active category and renders the list in a grid.
 */
function renderProjectList() {
  const projectListContainer = select('.project-list'); 
  let filteredProjects = [...DATA.projectsData].sort((a, b) => b.date.localeCompare(a.date));

  if (!filteredProjects.length) {
    projectListContainer.replaceChildren(
      Object.assign(document.createElement('p'), {
        textContent: DATA.miscTranslations.empty,
        style:'color:#94a3b8;text-align:center;padding:2.5rem 0;grid-column:1/-1;'
      })
    );
    return
  } else {
    if (activeCategory !== 'All') {
      filteredProjects = filteredProjects.filter(p =>
        Array.isArray(p.competences) && p.competences.includes(activeCategory)
      );
    }
  }
  
  new ProjectRenderer(filteredProjects, projectListContainer, 
    {
      meta: true,
      tags: true,
      footer: false
    }
  ).run();
}


/**
 * Fills the modal with content and shows it.
 * @param {string} projectId - The ID of the project to display.
 */
window.showProjectModal = function(projectId) {
    const project = DATA.projectsData.find(p => p.id === projectId);

    if (!project) {
        console.error('Project not found:', projectId);
        return;
    }
    
    new ProjectModalRenderer(project, modalDetails).run()

    document.body.style.overflow = 'hidden';
    modalOverlay.classList.add('modal-active');
    modalOverlay.scrollTop = 0;
}

/**
 * Hides the modal with a transition.
 */
function hideProjectModal() {
    document.body.style.overflow = '';
    modalOverlay.classList.remove('modal-active');
    window.location.hash = ''; 
    
    setTimeout(() => {
      modalDetails.innerHTML = '';
    }, 10);
}


// --- 5. Initialization ---
document.addEventListener('DOMContentLoaded', () => {

  setActiveCategory(activeCategory)

  // Add listener to close when clicking outside the modal content
  select('.modal-close-btn')?.addEventListener('click', hideProjectModal);
  modalOverlay?.addEventListener('click', (event) => {
      if (event.target === modalOverlay) {
          hideProjectModal();
      }
  });

  if(window.location?.hash.length > 1){
    showProjectModal(window.location?.hash.substring(1));
  }
});






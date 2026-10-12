import { CategoryRenderer, ProjectListRenderer, ProjectModalRenderer, ProjectRenderer, ProjectCaseRenderer, select } from "./render.js";
import { DATA } from "content-data"
import { APP_EVENTS } from "./events.js";

let activeIndexTimer;
const isDutch = document.documentElement.lang === 'nl';

document.addEventListener(APP_EVENTS.PROJECT_CATEGORY_SELECT, ({ detail }) => {
  const categoryId = detail.btnKey;
  if (!categoryId) return;

  setCat(categoryId);
  const projects = [...document.querySelectorAll('.project-item:not([hidden])')];
  const currentId = location.hash.slice(1);
  const selectedProject = projects.find(project => project.dataset.id === currentId) || projects[0];
  if (selectedProject) {
    const activeHash = `#${selectedProject.dataset.id}`;
    history.replaceState(null, '', activeHash);
    setActiveIndex(activeHash);
    updateProjectToggle(selectedProject);
    const position = select('.pos');
    if (position)
      position.textContent = `Project ${projects.indexOf(selectedProject) + 1} of ${projects.length}`;
  }
  closeCategoryDialog();
  route();
});

document.addEventListener(APP_EVENTS.PROJECT_SHOW_CASE, ({ detail })     => { 
  if(detail.projId)
    showCase(detail.projId)
 });


/*---------------------------------------------------------------------------
    Module Variables
---------------------------------------------------------------------------*/
// let activeCategory = 'All'; // Default active category

// const modalOverlay = select('.project-modal-overlay');
// const modalDetails = select('.modal-project-details');

const projectEmptyState = document.createElement('p');
projectEmptyState.className = 'empty';
projectEmptyState.hidden = true;
projectEmptyState.textContent = 'No projects found in this category.';

const projectContactState = document.createElement('p');
projectContactState.className = 'contact';
projectContactState.hidden = true;
projectContactState.textContent = 'For code repositories and deeper implementation details, please contact me directly.';

new CategoryRenderer(DATA.competencies, select('.project-domains'), 
  {
    projects : DATA.projectsData
  }
)
setupCategoryDialog();


let filteredProjects = [...DATA.projectsData].sort((a, b) => b.date.localeCompare(a.date));
new ProjectListRenderer(filteredProjects, select('.idx'))
new ProjectRenderer(filteredProjects, select('.project-list'),
  {
    categories : DATA.competencies,
    meta: true,
    tags: true,
    footer: false
  }
).run();

const firstProject = select('.project-item');
if (firstProject) updateProjectToggle(firstProject);

// /**
//  * Sets the active category, updates the tabs, and renders the project list.
//  * @param {string} category - The competency ID to activate ('All', 'swe', 'gd', 'ac', or 'at')
//  */
// function setActiveCategory(category) {
//     activeCategory = category;

//     select('.filter-button.active')?.classList.remove('active');
//     select(`.filter-button[data-category="${category}"]`)?.classList.add('active');

//     // 3. Render the filtered projects
//     renderProjectList();
// }

// /**
//  * Filters projects by the active category and renders the list in a grid.
//  */
// function renderProjectList() {
//   const projectListContainer = select('.project-list'); 
//   let filteredProjects = [...DATA.projectsData].sort((a, b) => b.date.localeCompare(a.date));

//   if (!filteredProjects.length) {
//     projectListContainer.replaceChildren(
//       Object.assign(document.createElement('p'), {
//         textContent: DATA.miscTranslations.empty,
//         style:'color:#94a3b8;text-align:center;padding:2.5rem 0;grid-column:1/-1;'
//       })
//     );
//     return
//   } else {
//     if (activeCategory !== 'All') {
//       filteredProjects = filteredProjects.filter(p =>
//         Array.isArray(p.competences) && p.competences.includes(activeCategory)
//       );
//     }
//   }
  
//   new ProjectRenderer(filteredProjects, projectListContainer, 
//     {
//       meta: true,
//       tags: true,
//       footer: false
//     }
//   ).run();
// }


// /**
//  * Fills the modal with content and shows it.
//  * @param {string} projectId - The ID of the project to display.
//  */
// window.showProjectModal = function(projectId) {
//     const project = DATA.projectsData.find(p => p.id === projectId);

//     if (!project) {
//         console.error('Project not found:', projectId);
//         return;
//     }
    
//     new ProjectModalRenderer(project, modalDetails).run()

//     document.body.style.overflow = 'hidden';
//     modalOverlay.classList.add('modal-active');
//     modalOverlay.scrollTop = 0;
// }

// /**
//  * Hides the modal with a transition.
//  */
// function hideProjectModal() {
//     document.body.style.overflow = '';
//     modalOverlay.classList.remove('modal-active');
//     window.location.hash = ''; 
    
//     setTimeout(() => {
//       modalDetails.innerHTML = '';
//     }, 10);
// }


// // --- 5. Initialization ---
// document.addEventListener('DOMContentLoaded', () => {

//   setActiveCategory(activeCategory)

//   // Add listener to close when clicking outside the modal content
//   select('.modal-close-btn')?.addEventListener('click', hideProjectModal);
//   modalOverlay?.addEventListener('click', (event) => {
//       if (event.target === modalOverlay) {
//           hideProjectModal();
//       }
//   });

//   if(window.location?.hash.length > 1){
//     showProjectModal(window.location?.hash.substring(1));
//   }
// });

document.addEventListener('DOMContentLoaded', () => {
  const projectList = select('.project-list');

  if (projectList && !projectList.querySelector('.empty')) {
    projectList.appendChild(projectEmptyState);
    projectList.appendChild(projectContactState);
  }

  setCat('all');
})

document.addEventListener("scroll", () => {
  updatePos();
})

////////////////////////////////
function setCat(id){
  const filterSelection = value => el =>
    el.hidden = value !== "all" && el.dataset.cat !== value

  const categoryButtons = [...document.querySelectorAll('.filter-button[data-cat]')];
  categoryButtons.forEach(button => {
    button.hidden = false;
    button.setAttribute('aria-pressed', String(button.dataset.cat === id));
  });
  const categoryToggle = select('.category-toggle');
  if (categoryToggle) {
    categoryToggle.dataset.active = String(id !== 'all');
    const selectedCategory = categoryButtons.find(button => button.dataset.cat === id);
    const categoryName = selectedCategory?.querySelector('.domain-label')?.textContent;
    const currentCategory = select('.category-toggle-current');
    if (categoryName && currentCategory)
      currentCategory.textContent = categoryName;
    categoryToggle.style.setProperty('--selector-accent', getCategoryAccent(id));
  }

  document.querySelectorAll(".project-item").forEach(filterSelection(id));
  document.querySelectorAll(".idx li").forEach(filterSelection(id));

  const hasVisibleProjects = [...document.querySelectorAll('.project-item')].some(el => !el.hidden);
  projectEmptyState.hidden = hasVisibleProjects;
  projectContactState.hidden = hasVisibleProjects;
}

function setupCategoryDialog(){
  const domainContainer = select('.project-domains');
  const allButton = domainContainer?.querySelector('.filter-button[data-cat="all"]');
  if (!domainContainer || !allButton) return;

  const categoryOptions = document.createElement('div');
  categoryOptions.className = 'project-category-options';
  categoryOptions.id = 'project-category-options';
  domainContainer.querySelectorAll('.filter-button:not([data-cat="all"])').forEach(button => {
    categoryOptions.append(button);
  });

  const categoryToggle = document.createElement('button');
  categoryToggle.type = 'button';
  categoryToggle.className = 'category-toggle';
  categoryToggle.setAttribute('aria-haspopup', 'dialog');
  categoryToggle.setAttribute('aria-controls', 'project-category-dialog');
  categoryToggle.setAttribute('aria-expanded', 'false');
  categoryToggle.dataset.active = 'false';

  const toggleCopy = document.createElement('span');
  toggleCopy.className = 'category-toggle-copy';
  const toggleLabel = document.createElement('span');
  toggleLabel.className = 'category-toggle-label';
  toggleLabel.textContent = isDutch ? 'Categorie' : 'Category';
  const currentCategory = document.createElement('span');
  currentCategory.className = 'category-toggle-current';
  currentCategory.textContent = allButton.querySelector('.domain-label')?.textContent ||
    (isDutch ? 'Alle projecten' : 'All projects');
  toggleCopy.append(toggleLabel, currentCategory);

  const toggleIcon = document.createElement('i');
  toggleIcon.className = 'ph ph-caret-down';
  toggleIcon.setAttribute('aria-hidden', 'true');
  categoryToggle.append(toggleCopy, toggleIcon);

  const projectToggle = document.createElement('button');
  projectToggle.type = 'button';
  projectToggle.className = 'project-toggle';
  projectToggle.setAttribute('aria-haspopup', 'dialog');
  projectToggle.setAttribute('aria-controls', 'project-category-dialog');
  projectToggle.setAttribute('aria-expanded', 'false');
  const projectToggleCopy = document.createElement('span');
  projectToggleCopy.className = 'project-toggle-copy';
  const projectToggleLabel = document.createElement('span');
  projectToggleLabel.className = 'project-toggle-label';
  projectToggleLabel.textContent = isDutch ? 'Project' : 'Project';
  const currentProject = document.createElement('span');
  currentProject.className = 'project-toggle-current';
  currentProject.textContent = '';
  projectToggleCopy.append(projectToggleLabel, currentProject);
  const projectToggleIcon = document.createElement('i');
  projectToggleIcon.className = 'ph ph-caret-down';
  projectToggleIcon.setAttribute('aria-hidden', 'true');
  projectToggle.append(projectToggleCopy, projectToggleIcon);

  const mobileLayout = matchMedia('(max-width: 767px)');
  const dialog = document.createElement('dialog');
  dialog.id = 'project-category-dialog';
  dialog.className = 'project-category-dialog';
  dialog.setAttribute('aria-labelledby', 'project-category-dialog-title');

  const dialogPanel = document.createElement('div');
  dialogPanel.className = 'project-category-dialog-panel';
  const dialogHeader = document.createElement('div');
  dialogHeader.className = 'project-category-dialog-header';
  const dialogTitle = document.createElement('h2');
  dialogTitle.id = 'project-category-dialog-title';
  dialogTitle.textContent = isDutch ? 'Categorieën' : 'Categories';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'category-dialog-close';
  closeButton.setAttribute('aria-label', isDutch ? 'Selectie sluiten' : 'Close selection');
  closeButton.title = isDutch ? 'Selectie sluiten' : 'Close selection';
  const closeIcon = document.createElement('i');
  closeIcon.className = 'ph ph-x';
  closeIcon.setAttribute('aria-hidden', 'true');
  closeButton.append(closeIcon);
  closeButton.addEventListener('click', closeCategoryDialog);

  dialogHeader.append(dialogTitle, closeButton);

  const categoryGroup = document.createElement('section');
  categoryGroup.className = 'project-drawer-group project-category-group';
  const categoryHeading = document.createElement('h3');
  categoryHeading.textContent = isDutch ? 'Categorieën' : 'Categories';
  categoryGroup.append(categoryHeading, categoryOptions);

  const projectGroup = document.createElement('section');
  projectGroup.className = 'project-drawer-group project-selection-group';
  const projectHeading = document.createElement('div');
  projectHeading.className = 'project-selection-heading';
  const projectTitle = document.createElement('h3');
  projectTitle.textContent = isDutch ? 'Projecten' : 'Projects';
  const projectPosition = select('#projects .pos');
  const projectIndex = select('#projects .idx');
  const projectIndexHome = select('#projects .project-index');
  projectHeading.append(projectTitle);
  if (projectPosition) projectHeading.append(projectPosition);
  projectGroup.append(projectHeading);
  if (projectIndex) projectGroup.append(projectIndex);

  dialogPanel.append(dialogHeader, categoryGroup, projectGroup);
  dialog.append(dialogPanel);
  document.body.append(dialog);
  if (projectIndexHome && projectPosition && projectIndex)
    projectIndexHome.append(projectPosition, projectIndex);
  allButton.after(categoryToggle, projectToggle, categoryOptions);

  const openSelection = mode => {
    dialog.dataset.mode = mode;
    dialogTitle.textContent = mode === 'category'
      ? (isDutch ? 'Kies een categorie' : 'Choose a category')
      : (isDutch ? 'Kies een project' : 'Choose a project');
    categoryGroup.hidden = mode !== 'category';
    projectGroup.hidden = mode !== 'project';

    if (mobileLayout.matches) {
      if (mode === 'category')
        categoryGroup.append(allButton, categoryOptions);
      if (mode === 'project' && projectIndexHome && projectPosition && projectIndex) {
        projectHeading.append(projectPosition);
        projectGroup.append(projectIndex);
      }
    }
    if (!dialog.open) dialog.showModal();
    dialogPanel.scrollTop = 0;
    categoryToggle.setAttribute('aria-expanded', String(mode === 'category'));
    projectToggle.setAttribute('aria-expanded', String(mode === 'project'));
  };

  categoryToggle.addEventListener('click', () => openSelection('category'));
  projectToggle.addEventListener('click', () => openSelection('project'));
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeCategoryDialog();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeCategoryDialog();
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeCategoryDialog();
  });

  projectIndex?.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    closeCategoryDialog();
    if (link.hash === location.hash) route();
  });

  window.addEventListener('resize', () => {
    if (!mobileLayout.matches && dialog.open) closeCategoryDialog();
  });
}

function closeCategoryDialog(){
  const dialog = select('.project-category-dialog');
  const categoryToggle = select('.category-toggle');
  const projectToggle = select('.project-toggle');
  const categoryOptions = select('.project-category-options');
  const domainContainer = select('.project-domains');
  const allButton = select('.project-category-group > .filter-button[data-cat="all"]') ||
    select('.project-domains > .filter-button[data-cat="all"]');
  const projectIndexHome = select('#projects .project-index');
  const projectPosition = select('#projects .pos') || select('.project-selection-heading .pos');
  const projectIndex = select('#projects .idx') || select('.project-selection-group .idx');

  if (dialog?.open) dialog.close();
  categoryToggle?.setAttribute('aria-expanded', 'false');
  projectToggle?.setAttribute('aria-expanded', 'false');
  if (allButton && domainContainer && categoryToggle)
    domainContainer.insertBefore(allButton, categoryToggle);
  if (projectToggle && domainContainer)
    domainContainer.insertBefore(projectToggle, categoryToggle?.nextSibling || null);
  if (categoryOptions && domainContainer && projectToggle)
    domainContainer.insertBefore(categoryOptions, projectToggle.nextSibling);
  if (projectIndexHome && projectPosition && projectPosition.parentElement !== projectIndexHome)
    projectIndexHome.append(projectPosition);
  if (projectIndexHome && projectIndex && projectIndex.parentElement !== projectIndexHome)
    projectIndexHome.append(projectIndex);
}

function updateProjectToggle(project){
  const currentProjectName = select('.project-toggle-current');
  const projectToggle = select('.project-toggle');
  const projectTitle = project.querySelector('.project-card-title')?.textContent.trim();
  if (currentProjectName && projectTitle)
    currentProjectName.textContent = projectTitle;
  if (projectToggle)
    projectToggle.style.setProperty('--selector-accent', getCategoryAccent(project.dataset.cat));
}

function getCategoryAccent(categoryId){
  return DATA.competencies.find(category => category.id === categoryId)?.customColor || 'var(--color-primary)';
}

function updatePos(){
  if (select('#projects')?.hidden) return;

  const mob = innerWidth <= 900, 
  line= (mob?200:140) + innerHeight * .15;

  const projects = [...document.querySelectorAll('.project-item:not([hidden])')];
  if (!projects.length) return;

  let activeProj = projects[0];

  
  projects.forEach(p => { 
    if(p.getBoundingClientRect().top <= line){
      activeProj=p;
    }
    }
  );
  const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
  if(atEnd)
    activeProj=projects[projects.length-1];

  const activeHash = `#${activeProj.dataset.id}`;
  scheduleActiveIndex(activeHash);
  updateProjectToggle(activeProj);

  const position = select('.pos');
  if (position)
    position.textContent = `Project ${projects.indexOf(activeProj)+1} of ${projects.length}`;
  
}

function showCase(id) {
  const currentProject = DATA.projectsData.find(p => p.id === id)
  const caseAccent = getCategoryAccent(currentProject.competences?.[0]);
  const caseIndex = document.querySelector('.project-case .idx');
  const caseAside = caseIndex.closest('.project-index');
  let caseNavigation = caseAside.querySelector('.case-index-navigation');
  if (!caseNavigation) {
    caseNavigation = document.createElement('details');
    caseNavigation.className = 'case-index-navigation';
    const caseSummary = document.createElement('summary');
    caseSummary.className = 'case-index-summary';
    caseAside.insertBefore(caseNavigation, caseIndex);
    caseNavigation.append(caseSummary, caseIndex);
    caseIndex.addEventListener('click', event => {
      if (innerWidth <= 767 && event.target.closest('a'))
        caseNavigation.open = false;
    });
    window.addEventListener('resize', () => {
      caseNavigation.open = innerWidth > 767;
    });
  }
  const caseSummary = caseNavigation.querySelector('.case-index-summary');
  const sectionCount = currentProject.case.length;
  caseSummary.textContent = isDutch
    ? `In deze case (${sectionCount})`
    : `In this case (${sectionCount})`;
  caseNavigation.open = innerWidth > 767;
  caseAside.style.setProperty('--accent', caseAccent);
  caseAside.style.setProperty('--case-accent', caseAccent);

  // render ProjectCaseRenderer
  caseIndex.innerHTML = currentProject.case.map(c => `
    <li>
      <a href="#/${c.id}">
        <span>${c.title}</span>
      </a>
    </li>`).join("")

  new ProjectCaseRenderer(currentProject, select('#cmain'))

  const backLink = document.querySelector('.back');
  backLink.href = `#${currentProject.id}`;
  backLink.textContent = isDutch ? 'Terug naar projecten' : 'Back to projects';
  backLink.style.setProperty('--case-accent', caseAccent);
  document.querySelector('#projects').hidden = true;
  document.querySelector('.project-case').hidden = false;
}

// route them correctly
function route(){
  const hash = location.hash;
  let pId = hash.startsWith('#/') && hash.slice(2);
  if(pId){
    if (DATA.projectsData.some(project => project.id === pId)) {
      showCase(pId);
      return;
    }

    const caseSection = document.getElementById(pId);
    if (caseSection?.classList.contains('cs')) {
      const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0;
      const indexHeight = innerWidth <= 767 ? select('.project-case .project-index')?.offsetHeight ?? 0 : 0;
      scrollTo(0, caseSection.getBoundingClientRect().top + scrollY - headerHeight - indexHeight - 12);
    }
    return
  }

  document.querySelector('#projects').hidden = false;
  document.querySelector('.project-case').hidden = true;

  setActiveIndex(hash);
  const el = hash.length > 1 && [...document.querySelectorAll('.project-item')].find(p => p.dataset.id == hash.split('#')[1]);
  if( el && !el.hidden){
    updateProjectToggle(el);
    const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0;
    const indexHeight = innerWidth <= 767 ? select('#projects .project-index')?.offsetHeight ?? 0 : 30;
    const indexGap = innerWidth <= 767 ? 12 : 0;
    scrollTo(0, el.getBoundingClientRect().top + scrollY - headerHeight - indexHeight - indexGap);
  } else { 
    scrollTo(0,0);
  }
}

function setActiveIndex(hash){
  clearTimeout(activeIndexTimer);
  document.querySelectorAll('.project-list-item a').forEach(a =>{
    a.style.borderLeft = a.hash === hash ? 'solid 2px var(--accent)' : 'solid 2px var(--color-border)';
    a.style.color = a.hash === hash ? 'white' : 'var(--color-gray-400)';
  }
  )
}

function scheduleActiveIndex(hash){
  clearTimeout(activeIndexTimer);
  activeIndexTimer = setTimeout(() => setActiveIndex(hash), 160);
}

addEventListener("hashchange", route);
select('.idx')?.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (link?.hash === location.hash)
    route();
});
route()
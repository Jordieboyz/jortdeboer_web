import { DATA } from "content-data"
import { APP_EVENTS } from "./events.js";
import { 
  select,
  CategoryRenderer, 
  ProjectListRenderer, 
  ProjectRenderer, 
  ProjectCaseRenderer
} from "./render.js";

// TODO: make sure that the history state of case is covered, maybe add the project in the case when browsing
/*--------------------------------------------------------------------------- 
  + Static Rendered Elements
---------------------------------------------------------------------------*/
const sortedProjects = [...DATA.projectsData].sort((a, b) => b.date.localeCompare(a.date))
new ProjectListRenderer(sortedProjects, select('.idx'))
new ProjectRenderer(sortedProjects, select('.project-list'),
  {
    categories : DATA.categories,
  }
)

let isMobileLayout = matchMedia('(max-width: 767px)').matches;
new CategoryRenderer(DATA.categories, select('.project-categories'), 
  {
    projects : DATA.projectsData,
    isMobileLayout : isMobileLayout,
    max : DATA.categories.length
  }
)

/*--------------------------------------------------------------------------- 
  + EVENT implementations
---------------------------------------------------------------------------*/
document.addEventListener(APP_EVENTS.OPEN_SELECTION, ({ detail }) => { openSelection(detail.open)})
document.addEventListener(APP_EVENTS.CLOSE_SELECTION, ({ detail }) => { closeCategoryDialog() })
document.addEventListener(APP_EVENTS.PROJECT_SHOW_CASE, ({ detail }) => { showCase(detail.projId) });
document.addEventListener(APP_EVENTS.SELECT_PROJECT, ({ detail }) => { 
  if(isMobileLayout){
    closeCategoryDialog();
  }
});
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
  }
  closeCategoryDialog();
  route();
});

/*--------------------------------------------------------------------------- 
  + Page Specific Variables
---------------------------------------------------------------------------*/ 
let activeIndexTimer;
let selectedCategoryId = 'all';

/*--------------------------------------------------------------------------- 
  + On first Load of the page / DOMContentLoaded
---------------------------------------------------------------------------*/
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener("scroll", updatePos)
  window.addEventListener("hashchange", route);
  window.addEventListener('resize', () => {
    const isMobile = matchMedia('(max-width: 767px)').matches
    if(isMobileLayout !== isMobile){
      const projectIndex = select('.project-category-dialog .idx') || select('#projects .idx');
      projectIndex.hidden = false;
      new ProjectListRenderer(sortedProjects, projectIndex);
      new CategoryRenderer(DATA.categories, select('.project-categories'), {
        projects : DATA.projectsData,
        isMobileLayout : isMobile,
        max : DATA.categories.length
      });

      isMobileLayout = isMobile;
      setCat(selectedCategoryId);
      const visibleProjects = [...document.querySelectorAll('.project-item:not([hidden])')];
      const selectedProject = visibleProjects.find(project => project.dataset.id === location.hash.slice(1)) || visibleProjects[0];
      if (selectedProject) {
        updateProjectToggle(selectedProject);
        setActiveIndex(`#${selectedProject.dataset.id}`);
      }
    }

    if (isMobileLayout && select('.project-category-dialog')?.open) closeCategoryDialog();
  });
  setCat('all');
  const visibleProjects = [...document.querySelectorAll('.project-item:not([hidden])')];
  const selectedProject = visibleProjects.find(project => project.dataset.id === location.hash.slice(1)) || visibleProjects[0];
  if (selectedProject) {
    updateProjectToggle(selectedProject);
    setActiveIndex(`#${selectedProject.dataset.id}`);
  }
})
route()

/*--------------------------------------------------------------------------- 
  + Functions
---------------------------------------------------------------------------*/
function openSelection(mode){
  const dialog = select('.project-category-dialog');
  if (!dialog) return;

  select('.project-category-dialog-title').textContent = mode === 'category' ? 'Choose a category' : 'Choose a project';
  select('.project-category-group').hidden = mode !== 'category';
  select('.project-selection-group').hidden = mode !== 'project';
  select('.category-toggle')?.setAttribute('aria-expanded', String(mode === 'category'));
  select('.project-toggle')?.setAttribute('aria-expanded', String(mode === 'project'));

  if (!dialog?.open){
    dialog.showModal()
  }
};

function closeCategoryDialog(){
  const dialog = select('.project-category-dialog');
  select('.category-toggle')?.setAttribute('aria-expanded', 'false');
  select('.project-toggle')?.setAttribute('aria-expanded', 'false');
  if (dialog?.open) 
    dialog.close();
}

function setCat(id){
  selectedCategoryId = id;
  const filterSelection = value => el => {
    const categories = (el.dataset.cat || '').split(/\s+/);
    el.hidden = value !== "all" && !categories.includes(value);
  }

  document.querySelectorAll('.filter-button[data-cat]').forEach(button => {
    const selected = button.dataset.cat === id;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  updateCatToggle(id)

  document.querySelectorAll(".project-item").forEach(filterSelection(id));
  document.querySelectorAll(".idx li").forEach(filterSelection(id));
}


function updateCatToggle(id){
  if(!isMobileLayout || !id)
    return

  const categoryButtons = [...document.querySelectorAll('.filter-button[data-cat]')];
  const activeCat = categoryButtons.find(button => button.dataset.cat === id);
  if(activeCat){
    const categoryToggle = select('.category-toggle');
    if(categoryToggle){
      categoryToggle.querySelector('.category-toggle-current').textContent = activeCat.querySelector('.category-label').textContent;
      categoryToggle.style.setProperty('--accent', activeCat.style.getPropertyValue('--accent'));
    }
  }
}

function updateProjectToggle(project){
  if(!isMobileLayout || !project)
    return

  const pToggle = select('.project-toggle');
  if(!pToggle) return;
  const currentLabel = pToggle.querySelector('.project-toggle-current');
  if(!currentLabel) return;
  currentLabel.textContent = project.querySelector('.project-card-title')?.textContent.trim() ?? '';
  pToggle.style.setProperty('--accent', project.style.getPropertyValue('--accent'));
}


function getCategoryAccent(categoryId){
  return DATA.categories.find(category => category.id === categoryId)?.customColor;
}

function updatePos(){
  if (select('#projects')?.hidden) 
    return;

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
}

// check wether all this stuff is neccessary here !!!
function showCase(id) {
  const currentProject = DATA.projectsData.find(p => p.id === id)
  if (!currentProject) return;
  const caseHash = `#/${id}`;
  if (location.hash !== caseHash) history.pushState(null, '', caseHash);
  const projectCategories = currentProject.categories ?? currentProject.category ?? [];
  const primaryCategory = Array.isArray(projectCategories) ? projectCategories[0] : projectCategories;
  const caseAccent = getCategoryAccent(primaryCategory);
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
  caseSummary.textContent = `In this case (${sectionCount})`;
  caseNavigation.open = innerWidth > 767;
  caseAside.style.setProperty('--accent', caseAccent);

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
  backLink.style.setProperty('--accent', caseAccent);

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

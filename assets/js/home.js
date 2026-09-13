import { DomainDetailsPanel, domainSelectionRenderer, SocialLinksRenderer, CompetenceLinksRenderer, select } from "./render.js";
import { APP_EVENTS } from "./events.js";
import { DATA } from "content-data";

const domainById = new Map(DATA.competencies.map(domain => [domain.id, domain]));
const domainByTitle = new Map(DATA.competencies.map(domain => [domain.title, domain]));
const projectById = new Map(DATA.projectsData.map(project => [project.id, project]));
const projectByTitle = new Map(DATA.projectsData.map(project => [project.title, project]));

new SocialLinksRenderer(DATA.sociallinksData, select('.social-links'));
new CompetenceLinksRenderer(DATA.competencies, select('.home-stats'));
new domainSelectionRenderer(DATA.competencies, select('.domain-selection'), {
  projects: DATA.projectsData
});

let activeDomainKey = "";
let selectedProjectId = null;

const treeContainer = select(".domain-selection");
const detailStage = select(".detail-stage");
const skillTabs = Array.from(select('.skill-tab', true));
const stats = select('.home-stats');
const statPills = stats ? Array.from(stats.querySelectorAll('.stat-pill')) : [];
const scrollInd = document.getElementById('scroll-indicator');
let scrollFaded = false;

/*---------------------------------------------------------------------------
    Typed.js; Typing effect
---------------------------------------------------------------------------*/
new Typed('.typed', {
  strings: select('.typed')?.getAttribute('data-typed-items').split(','),
  loop: true,
  typeSpeed: 20,
  backSpeed: 20,
  backDelay: 3000
});

document.addEventListener('DOMContentLoaded', () => {
  const route = parseRouteHash(window.location.hash);

  if (route.domainId) {
    activeDomainKey = route.domainId;
  }

  if (route.projId) {
    selectedProjectId = route.projId;
  }

  renderDetailStage();

  if (route.domainId) {
    updateTreeState(route.domainId, route.projId || null);
  }

  if (window.location.hash.length > 1) {
    activateTab(window.location.hash.substring(1));
  }
});

document.addEventListener(APP_EVENTS.SCROLL_TO_DOMAIN, ({ detail }) => {
  const domainId = detail.domId ?? detail.domKey ?? detail.domainId;
  if (!domainId) return;

  const firstProject = DATA.projectsData.find(project =>
    Array.isArray(project.competences) && project.competences.includes(domainId)
  );

  activeDomainKey = domainId;
  selectedProjectId = firstProject?.id ?? null;

  updatePath(domainId, firstProject?.id ?? '');
  updateTreeState(domainId, firstProject?.id ?? null);

  if (firstProject) {
    swapDetailStage();
  } else {
    renderDetailStage();
  }
});

function parseRouteHash(hash = '') {
  const cleanHash = hash.replace(/^#/, '').replace(/^\//, '');
  const [domainId = '', projId = ''] = cleanHash.split('/');
  return { domainId, projId };
}

function updatePath(domainId = '', projId = '') {
  if (!domainId) {
    if (window.location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    return;
  }

  const hashValue = projId ? `${domainId}/${projId}` : domainId;
  if (window.location.hash.replace('#', '') !== hashValue) {
    window.location.hash = hashValue;
  }

  const header = select('.section-header');
  if (header) {
    window.scrollTo({ top: header.offsetTop });
  }
}

window.addEventListener('scroll', () => {
  if (window.scrollY > 25 && !scrollFaded) {
    scrollInd?.classList.add('hidden');
    scrollFaded = true;
  } else if (window.scrollY < 10 && scrollFaded) {
    scrollInd?.classList.remove('hidden');
    scrollFaded = false;
  }
}, { passive: true });

statPills.forEach(pill => {
  pill.addEventListener('click', () => {
    const domainForPill = DATA.competencies.find(c => c.title === pill.textContent.trim());
    const domainId = domainForPill?.id;

    if (!domainId) return;

    const firstProject = DATA.projectsData.find(project =>
      Array.isArray(project.competences) && project.competences.includes(domainId)
    );

    if (!firstProject) return;

    selectedProjectId = firstProject.id;
    activeDomainKey = domainId;

    updatePath(domainId, firstProject.id);
    updateTreeState(domainId, firstProject.id);
    swapDetailStage();
  });
});

function activateTab(tabOrDomainId) {
  if (!tabOrDomainId) return;

  const target = typeof tabOrDomainId === 'string'
    ? skillTabs.find(tab => tab.dataset.tab === tabOrDomainId)
    : tabOrDomainId;

  if (!target) return;

  skinTabsState(target);
}

function skinTabsState(activeTab) {
  skillTabs.forEach(tab => tab.classList.toggle('active', tab === activeTab));
}

document.addEventListener(APP_EVENTS.DOMAIN_SELECT, ({ detail }) => {
  activeDomainKey = detail.domKey;
  selectedProjectId = null;
  updatePath(detail.domKey);
  updateTreeState(detail.domKey, null);
});

document.addEventListener(APP_EVENTS.PROJECT_SELECT, ({ detail }) => {
  selectedProjectId = detail.projId;
  activeDomainKey = detail.domKey;
  updatePath(detail.domKey, detail.projId);
  updateTreeState(detail.domKey, detail.projId);
  swapDetailStage();
});

document.addEventListener(APP_EVENTS.PROJECT_CLOSE, () => {
  selectedProjectId = null;
  activeDomainKey = null;
  history.replaceState(null, '', location.pathname + location.search);
  updatePath('');
  updateTreeState();
  swapDetailStage();
});

export function updateTreeState(Did = null, Pid = null) {
  if (Did) activeDomainKey = Did;
  if (Pid) selectedProjectId = Pid;

  const groups = treeContainer.querySelectorAll('.tree-group');
  groups.forEach(groupEl => {
    const groupTitle = groupEl.querySelector('.domain-title')?.textContent?.trim();
    const domain = domainByTitle.get(groupTitle);
    groupEl.classList.toggle('expanded', domain?.id === activeDomainKey);

    const projItems = groupEl.querySelectorAll('.tree-project-item');
    projItems.forEach(item => {
      const itemTitle = item.querySelector('.tree-project-name')?.textContent?.trim();
      const project = projectByTitle.get(itemTitle);
      item.classList.toggle('active', project?.id === selectedProjectId);
    });
  });
}

function swapDetailStage() {
  if (!detailStage) return;

  detailStage.classList.add('card-animated-exit');

  setTimeout(() => {
    renderDetailStage();
    detailStage.classList.remove('card-animated-exit');
    detailStage.classList.add('card-animated-enter');

    setTimeout(() => {
      detailStage.classList.remove('card-animated-enter');
    }, 380);
  }, 150);
}

function renderDetailStage() {
  let activeProj = null;

  if (selectedProjectId) {
    activeProj = projectById.get(selectedProjectId) ?? null;
  }

  new DomainDetailsPanel(activeProj || { hintProj: DATA.projectsData.slice(0, 3) }, detailStage, {
    competences: DATA.competencies,
    placeholder: !activeProj,
  });
}
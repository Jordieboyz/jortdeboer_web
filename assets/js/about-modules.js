import { DATA } from "content-data"
import { APP_EVENTS } from "./events.js";

document.addEventListener(APP_EVENTS.MODULE_IDENTITY_SWITCH_PHASE, ({ detail })     => { switchModulePhase(detail.phase); });
document.addEventListener(APP_EVENTS.MODULE_TECHSTACK_SELECT_NODE, ({ detail })     => { selectNode(detail.layerId, detail.skillId); });
document.addEventListener(APP_EVENTS.MODULE_TECHSTACK_SHIFT_LAYER, ({ detail })     => { shiftLayer(detail.dir); });
document.addEventListener(APP_EVENTS.MODULE_TECHSTACK_CLEAR_SELECTION, ({ detail }) => { clearSelection(); });
document.addEventListener(APP_EVENTS.MODULE_HOBBY_CLOSE_MODAL, ({ detail })         => { closeHobbyModal(); });
document.addEventListener(APP_EVENTS.MODULE_HOBBY_OPEN_MODAL, ({ detail })          => { openHobbyModal(detail.hobbyId); });
document.addEventListener(APP_EVENTS.MODULE_EDUCATION_SELECT_NODE, ({ detail })     => { selectEducationNode(detail.nodeIdx); });
document.addEventListener(APP_EVENTS.MODULE_GITHUB_FETCH_DATA, ({ detail })         => { fetchGitHubData(detail.forceRefresh); });


let activeNodeId = null;
let activeLayerIndex = 0;

const LAYERS = getData('techstack').layers
const LAYER_ORDER = LAYERS.map(layer => layer.id) ?? []

window.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.module-content-wrapper .timeline-track')) return;

  selectEducationNode(0)
  updateTimelineLine()
  window.addEventListener('resize', updateTimelineLine)
  fetchGitHubData(true)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') clearSelection(); });
});

export function updateTimelineLine() {
  const track = document.querySelector('.module-content-wrapper .timeline-track')
  const dots = track?.parentElement.querySelectorAll('.timeline-dot')
  const line = track?.querySelector('.timeline-line-bg')
  if (!track || !dots?.length || !line) return

  const trackRect = track.getBoundingClientRect()
  const firstDotRect = dots[0].getBoundingClientRect()
  const lastDotRect = dots[dots.length - 1].getBoundingClientRect()
  const left = firstDotRect.left - trackRect.left
  const lastDotCenter = lastDotRect.left + lastDotRect.width / 2
  const right = trackRect.right - lastDotCenter
  const top = firstDotRect.top + firstDotRect.height / 2 - trackRect.top - line.offsetHeight / 2

  line.style.left = `${left}px`
  line.style.right = `${right}px`
  line.style.top = `${top}px`

  const activeDot = track.parentElement.querySelector('.timeline-node.active .timeline-dot')
  if (activeDot) {
    const activeDotRect = activeDot.getBoundingClientRect()
    const activeDotCenter = activeDotRect.left + activeDotRect.width / 2
    line.querySelector('.timeline-line-fill').style.width = `${activeDotCenter - firstDotRect.left}px`
  }
}

function getData(key, content = true){
  return content ? 
            DATA.modulesData.find(module => module.id === key)?.content : 
            DATA.modulesData.find(module => module.id === key) 
}

function createChipHTML(node) {
  const hasSvgLogo = typeof node.svg === 'string' && node.svg.trim().toLowerCase().endsWith('.svg');
  const iconHTML = hasSvgLogo
    ? `<img class="chip-logo" src="${node.svg}" alt="${node.title} logo">`
    : '';

  return `
    <div data-node="${node.id}" class="chip"
          style="--node-color:${node.color}; --node-glow:${node.glow};">
      <div class="chip-icon">${iconHTML}</div>
      <div class="chip-info">
        <div class="chip-title">${node.title}</div>
        <div class="chip-subtitle">${node.subtitle}</div>
      </div>
    </div>
  `;
}

function updateChipStates(nodeId) {
  document.querySelectorAll('.chip').forEach(el => {
    const isActive = el.dataset.node === nodeId;
    el.classList.toggle('is-active', isActive);
    el.classList.toggle('is-dimmed', !isActive);
  });
}

// slideDir: 1 = came from the right (next layer), -1 = came from the left (prev layer), omitted = no slide
export function selectNode(layerId, nodeId, slideDir) {
  const layer = LAYERS.find(layer => layer.id === layerId);
  if (!layer) return;

  // select node based on layer ID
  if (activeNodeId === nodeId && !slideDir) { 
    clearSelection(); 
    return; 
  }

  const node = layer.techskill.find(n => n.id === nodeId);
  if (!node) return;

  activeNodeId = nodeId;
  activeLayerIndex = LAYER_ORDER.indexOf(layer.id);

  updateDrawerContent(layer, node)
  renderSlider(layer, slideDir);
  updateChipStates(nodeId);

  document.querySelector('.detail-drawer').classList.add('is-open');
  document.querySelector('.stack-rack').classList.add('is-compact');

  LAYER_ORDER.forEach(l => {
    document.querySelector(`.slab-${l}`).classList.toggle('is-active-layer', l === node.id.toLowerCase());
  });
}

function renderSlider(layer, slideDir) {
  const slider = document.querySelector('.layer-slider');

  slider.style.setProperty('--layer-accent', layer.color.light);
  document.querySelector('.slider-label .num').textContent = layer.id.slice(-1);
  document.querySelector('.slider-label .label').textContent = layer.label;

  const track = document.querySelector('.slider-track');
  track.innerHTML = layer.techskill.map(n => createChipHTML(n)).join('');
  track.querySelectorAll('.chip[data-node]').forEach(chip => {
    chip.addEventListener('click', event => {
      event.stopPropagation()
      selectNode(layer.id, chip.dataset.node);
    });
  });
  track.classList.remove('anim-right', 'anim-left');
  if (slideDir === 1 || slideDir === -1) {
    void track.offsetWidth;
    track.classList.add(slideDir === 1 ? 'anim-right' : 'anim-left');
  }

  document.querySelector('.slider-dots').innerHTML = LAYER_ORDER
    .map((l, i) => `<span class="slider-dot ${i === activeLayerIndex ? 'is-active' : ''}"></span>`)
    .join('');
}

export function shiftLayer(dir) {
  const newIndex = (activeLayerIndex + dir + LAYER_ORDER.length) % LAYER_ORDER.length;
  const items = LAYERS.find(l => l.id === LAYER_ORDER[newIndex]).techskill
  selectNode(LAYER_ORDER[newIndex], items[0].id, dir);
}


function updateDrawerContent(layer, node) {
  const detail_drawer = document.querySelector('.detail-drawer');

  detail_drawer.style.setProperty('--node-color', node.color)
  const drawerLogo = detail_drawer.querySelector('.drawer-info img')
  const hasSvgLogo = typeof node.svg === 'string' && node.svg.trim().toLowerCase().endsWith('.svg')
  drawerLogo.hidden = !hasSvgLogo
  if (hasSvgLogo) {
    drawerLogo.src = node.svg
    drawerLogo.alt = `${node.title} logo`
  } else {
    drawerLogo.removeAttribute('src')
  }
  detail_drawer.querySelector('.drawer-title').textContent = node.title
  detail_drawer.querySelector('.drawer-layer').textContent = layer.id
  
  detail_drawer.querySelector('.spec-matrix').innerHTML = ['proficiency', 'Experience'].map(s => 
    `<div class="tech-spec-item">
        <span class="tech-spec-key">${s.toUpperCase()}:</span> 
        <span class="tech-spec-val">${node.meta.spec?.[s]}</span>
      </div>`
  ).join('')

  detail_drawer.querySelector('.section-text').textContent = node.meta?.usage || node.description || '';
  detail_drawer.querySelector('.eco-grid').innerHTML = (node.meta?.ecosystem || node.ecosystem || [])
    .map(eco => `<span class="eco-tag">${eco}</span>`)
    .join('');


  const relatedProjects = DATA.projectsData.filter(project => project.progLang?.includes(node.id)).slice(0, 2);
  detail_drawer.querySelector('.projects-list').innerHTML = relatedProjects.length
    ? relatedProjects.map(project => `
        <a class="project-card" href="projects.html#${project.id}">
          <div class="project-name">${project.title}</div>
          <div class="project-detail">${project.focus || project.shortDescription || ''}</div>
        </a>
      `).join('')
    : '<div class="project-detail">No related projects found.</div>';
}

export function clearSelection() {
  activeNodeId = null;
  document.querySelector('.detail-drawer').classList.remove('is-open');
  document.querySelector('.stack-rack').classList.remove('is-compact');

  LAYER_ORDER.forEach(l => document.querySelector(`.slab-${l}`).classList.remove('is-active-layer'));
  document.querySelectorAll('.chip').forEach(el => el.classList.remove('is-active', 'is-dimmed'));
  document.querySelector('.slider-track').innerHTML = '';
  document.querySelector('.slider-dots').innerHTML = '';
}




/* #################################################### */
/* IDENTITY */
/* #################################################### */

export function switchModulePhase(phase){
  const activePhase = document.querySelector('.phase-content.active');
  const currentPhase = Number(activePhase?.className.match(/identity-phase-(\d+)/)?.[1]);
  const slideDirection = phase > currentPhase ? 'slide-left' : 'slide-right';

  // Hide all phases
  document.querySelectorAll('.phase-content').forEach(el => {
    el.classList.remove('active', 'slide-left', 'slide-right');
  });
  document.querySelectorAll('.phase-btn').forEach(el => el.classList.remove('active'));

  // Show selected phase
  document.querySelector(`.identity-phase-${phase}`).classList.add('active', slideDirection);
}

/* #################################################### */
/* beyond the screen */
/* #################################################### */
  export function closeHobbyModal() {
    document.querySelector('.hobby-embedded-modal').classList.remove('active');
  }

export function openHobbyModal(hobbyId) {
    const modal = document.querySelector('.hobby-embedded-modal');
    const imgStack = document.querySelector('.modal-left-stack');
    const infoPanel = document.querySelector('.modal-right-info');
    const hobby = getData('hobbies').tiles.find(h => h.id === hobbyId);
    
    if (!hobby) return;

    // Render 3 distinct images in left column stack
    imgStack.innerHTML = hobby.images.map(img => `
      <div class="modal-img-item" style="background-image: url('${img}');"></div>
    `).join('');

    // Render information panel on the right
    const highlightsHtml = hobby.highlights.map(h => `<li><i class="ph ph-check-circle"></i> ${h}</li>`).join('');

    infoPanel.innerHTML = `
      <div class="modal-info-header">${hobby.label}</div>
      <div class="modal-info-subtitle">${hobby.desc}</div>
      <div class="modal-divider"></div>
      <p class="modal-info-text">${hobby.desc}</p>
      

      <div class="modal-info-section-title" style="margin-top: 12px;">Highlights</div>
      <ul class="hobby-stats-list">${highlightsHtml}</ul>
    `;

    modal.classList.add('active');
  }




/* #################################################### */
/* beyond the screen */
/* #################################################### */
export function selectEducationNode(nodeId) {
  const nodes = getData('education').nodes
  for (let i = 0; i < nodes.length; i++) {
    const node = document.querySelector(`.tnode-${i}`);
    if (i === nodeId) {
      node.classList.add('active');
    } else {
      node.classList.remove('active');
    }
  }

  const percentages = { 0: '0%', 1: '50%', 2: '100%'};
  document.querySelector('.timeline-line-fill').style.width = percentages[nodeId];
  updateTimelineLine()

  const data = nodes[nodeId];
  const html = `
    <div class="milestone-header">
      <div>
        <div class="milestone-year">${data.date}</div>
        <div class="milestone-title">${data.company}</div>
        <div class="milestone-track">${data.role}</div>
      </div>
      <div class="milestone-badge">Milestone 0${nodeId+1} / 0${nodes.length}</div>
    </div>
    <div class="milestone-desc">${data.desc}</div>
    <div class="milestone-list-title">Key Focus</div>
    <ul class="milestone-list">
      ${data.highlights.map(h => `<li><i class="ph ph-check-circle"></i> ${h}</li>`).join('')}
    </ul>
  `;
  document.querySelector('.milestone-card').innerHTML = html;
}

/* #################################################### */
/* IDENTITY */
/* #################################################### */

function createGithubStat(label, val){
  const stat = document.createElement('div');
  stat.className = 'github-stat';

  const value = document.createElement('span');
  value.className = 'github-stat-val';
  value.textContent = val;

  const labelElement = document.createElement('span');
  labelElement.className = 'github-stat-label';
  labelElement.textContent = label;

  stat.append(value, labelElement);
  return stat;
} 

function formatGithubDate(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

 export async function fetchGitHubData(forceRefresh = false) {
  const username = 'Jordieboyz'
    const grid = document.querySelector('.github-projects-grid');
    if (!grid) return 

    const refreshIcon = document.querySelector('.refresh-icon');
    const statsContainer = document.querySelector('.github-stats-container')
    
    if (statsContainer) statsContainer.innerHTML = ''
    if (refreshIcon) refreshIcon.classList.add('spinning');

    // Display Skeleton Loading State
    grid.innerHTML = Array(4).fill(0).map(() => `
      <div class="repo-skeleton">
        <div style="width: 50%; height: 16px; background: rgba(255,255,255,0.1); border-radius: 4px;"></div>
        <div style="width: 90%; height: 12px; background: rgba(255,255,255,0.06); border-radius: 4px;"></div>
        <div style="width: 30%; height: 12px; background: rgba(255,255,255,0.06); border-radius: 4px;"></div>
      </div>
    `).join('');

      try {
        // 1. Fetch User Profile Details
        const userRes = await fetch(`https://api.github.com/users/${username}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.bio) document.querySelector('.github-bio').innerText = userData.bio;
          // put the two stats in here, choose whatever and update accordingly
          if (userData.public_repos !== undefined) statsContainer.append(createGithubStat('Public Repos', userData.public_repos));
          // if (userData.followers !== undefined) document.querySelector('.github-stat-followers').innerText = userData.followers;
          if (userData.avatar_url) document.querySelector('.github-avatar').src = userData.avatar_url;
        }

        // 2. Fetch Public Repositories (Sorted by updated date)
        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=2`);
        
        if (!reposRes.ok) throw new Error(`GitHub API HTTP ${reposRes.status}`);

        const reposData = await reposRes.json();
        
        if (Array.isArray(reposData) && reposData.length > 0) {
          if (reposData[0].pushed_at !== undefined) {
            statsContainer.append(createGithubStat('Last Activity', formatGithubDate(reposData[0].pushed_at)));
          }
          renderRepositories(reposData);
        }
        
        window.githubDataLoaded = true;
      } catch (err) {
        console.warn('GitHub API Live Sync standard fallback activated:', err);
      } finally {
        if (refreshIcon) refreshIcon.classList.remove('spinning');
      }
    }

    const languageColors = {
      'C++': '#f34b7d',
      'C': '#555555',
      'C#': '#178600',
      'Python': '#3572A5',
      'JavaScript': '#f1e05a',
      'TypeScript': '#3178c6',
      'HTML': '#e34c26',
      'CSS': '#563d7c',
      'Rust': '#dea584',
      'Assembly': '#6E4C13'
    };

    function renderRepositories(repos) {
      const grid = document.querySelector('.github-projects-grid');
      
      grid.innerHTML = repos.map(repo => {
        const langColor = languageColors[repo.language] || '#38bdf8';
        const langName = repo.language || 'System Code';

        return `
          <div class="repo-card">
            <div>
              <div class="repo-header">
                <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-name">
                  <i class="ph ph-folder-simple"></i>
                  ${repo.name}
                </a>
                <i class="ph ph-arrow-square-out" style="color: #64748b; font-size: 14px;"></i>
              </div>
              <p class="repo-desc">${repo.description || 'No description provided for this public system module.'}</p>
            </div>

            <div class="repo-footer">
              <div class="repo-lang">
                <span class="lang-dot" style="background-color: ${langColor};"></span>
                <span>${langName}</span>
              </div>

              <div class="repo-metrics">
                <div class="repo-metric" title="Stars">
                  <i class="ph ph-star" style="color: #f59e0b;"></i>
                  <span>${repo.stargazers_count || 0}</span>
                </div>
                <div class="repo-metric" title="Forks">
                  <i class="ph ph-git-fork" style="color: #94a3b8;"></i>
                  <span>${repo.forks_count || 0}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
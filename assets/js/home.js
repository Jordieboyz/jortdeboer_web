import { DATA } from "content-data";
import { APP_EVENTS } from "./events.js";
import { 
  select,
  CategoryLinksRenderer, 
  CategorySelectionRenderer,
  CategoryDetailsPanel, 
  SocialLinksRenderer, 
} from "./render.js";


/*--------------------------------------------------------------------------- 
  + Static Rendered Elements
---------------------------------------------------------------------------*/

new SocialLinksRenderer(DATA.sociallinksData, select('.home-social-links'));
new CategoryLinksRenderer(DATA.categories.slice(1), select('.home-stats'));
new CategorySelectionRenderer(DATA.categories.slice(1), select('.category-selection'), {
  projects: DATA.projectsData
});

new Typed('.typed', {
  strings: select('.typed')?.getAttribute('data-typed-items').split(','),
  loop: true,
  typeSpeed: 20,
  backSpeed: 20,
  backDelay: 3000
});

/*--------------------------------------------------------------------------- 
  + EVENT implementations
---------------------------------------------------------------------------*/
document.addEventListener(APP_EVENTS.CATEGORY_SELECT, ({ detail }) => { 
  const newHash = `#${detail.categoryId}`
  window.location.hash = window.location.hash.split('/')[0] === newHash ? route() : newHash; 
});

document.addEventListener(APP_EVENTS.PROJECT_SELECT, ({ detail }) => { 
  window.location.hash = `#${detail.categoryId}/${detail.projId}`;
});

document.addEventListener(APP_EVENTS.PROJECT_CLOSE, () => { 
  window.location.hash = '';
  swapDetailStage()
});

document.addEventListener(APP_EVENTS.CATEGORY_LINK_CLICKED, ({ detail }) => {
  const firstProj = select(`.tree-group[data-cat=${detail.catId}] .tree-project-item`, true)[0]
  window.location.hash = `#${detail.catId}/${firstProj.dataset.pid}`
});

/*--------------------------------------------------------------------------- 
  + Page Specific Variables
---------------------------------------------------------------------------*/
const detailStage = select(".detail-stage");

let scrollFaded = false;
let scrollOnLoad = false

/*--------------------------------------------------------------------------- 
  + On first Load of the page / DOMContentLoaded
---------------------------------------------------------------------------*/
document.addEventListener('DOMContentLoaded', () => {

  updateHomeImage() // update size of the hero image
  renderDetailStage(); // render placeholder at this stage
  route(); // handle incoming hashes from load state

  window.addEventListener('resize', updateHomeImage)
  window.addEventListener('hashchange', route)
  window.addEventListener('scroll', () => {
    const scrollInd = document.getElementById('scroll-indicator');

    if (window.scrollY > 25 && !scrollFaded) {
      scrollInd?.classList.add('hidden');
      scrollFaded = true;
    } else if (window.scrollY < 10 && scrollFaded) {
      scrollInd?.classList.remove('hidden');
      scrollFaded = false;
    }
  }, { passive: true });

  scrollOnLoad = true;
});

/*--------------------------------------------------------------------------- 
  + Functions
---------------------------------------------------------------------------*/
function route(){

  const [catId = '', projId = ''] = location.hash.replace(/^#/, '').replace(/^\//, '').split('/');
  if(catId)
    updateTreeState(catId, projId);

  if(projId)
    swapDetailStage();

  // prevent scrolling on mobile
  if (window.matchMedia('(max-width: 768px)').matches && !projId) 
    return;
  
  if (scrollOnLoad) {
    window.scrollTo({ top: detailStage.offsetTop });
  }
}

export function updateTreeState(catId = null, pId = null) {
  select('.tree-group', true).forEach(groupEl => {
    groupEl.classList.toggle('expanded', groupEl.dataset.cat === catId);
  })

  if(pId){
    select(`.tree-group[data-cat=${catId}] .tree-project-item`, true).forEach(p => 
      p.classList.toggle('active', p.dataset.pid === pId))
  }
}

// animation for swapping content of the detailstage
function swapDetailStage() {
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

// TODO: maybe seperate the placeholder and the detailsrendere in the future!
function renderDetailStage() {
  const activeProjectId = window.location.hash.split('/')[1]

  // placeholder items ready
  let detailStageProject = { hintProj: DATA.projectsData.slice(0, 3) }

  if(activeProjectId)
    // override placeholder projects 
    detailStageProject = DATA.projectsData.find(p => p.id === activeProjectId)
  
  new CategoryDetailsPanel(detailStageProject, detailStage, {
    categories: DATA.categories,
    placeholder: !activeProjectId,
  });
}

function updateHomeImage(){
  const img = document.querySelector('.hero-headshot');
  img.src = img.src.replace(img.src.split('/').pop(), 
    window.innerWidth < 700 ? 'hero_jort_de_boer_short.jpeg' : 'hero_jort_de_boer.jpeg');
}

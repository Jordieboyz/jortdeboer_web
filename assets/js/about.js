import { DATA } from "content-data"
import { closeHobbyModal, updateTimelineLine } from "./about-modules.js";
import { 
    select,
    ModuleRenderer, 
    TelemetryRenderer, 
    SocialLinksRenderer 
} from "./render.js";


/*--------------------------------------------------------------------------- 
  + Static Rendered Elements
---------------------------------------------------------------------------*/
new SocialLinksRenderer(DATA.sociallinksData, select('.hero-links'))
new ModuleRenderer(DATA.modulesData, select('.available-mod-list'))
new TelemetryRenderer(DATA.telemetryData, select('.telemetry-grid'))


/*--------------------------------------------------------------------------- 
  + EVENT implementations
---------------------------------------------------------------------------*/


/*--------------------------------------------------------------------------- 
  + Page Specific Variables
---------------------------------------------------------------------------*/
let currentIdx = 0;
let resizeFrame = null;

const pickerList = select('.available-mod-list');
const pickerTrack = select('.available-mod-track');
const activeModuleContainer = select('.active-module-container');
const hintUp = select('.hintUp');
const hintDown = select('.hintDown');

const activePanelWrapper = activeModuleContainer.querySelector('.module-content-wrapper');
const panelOrigins = new WeakMap();
let mountedPanel = activePanelWrapper.querySelector('.panel-content');

/*--------------------------------------------------------------------------- 
  + On first Load of the page / DOMContentLoaded
---------------------------------------------------------------------------*/
document.addEventListener('DOMContentLoaded', () => {

    // Buttons for modules slider
    hintUp.addEventListener('click',    () => { if (currentIdx > 0) update(currentIdx - 1); });
    hintDown.addEventListener('click',  () => { if (currentIdx < DATA.modulesData.length - 1) update(currentIdx + 1); });

    // start at module no# 0
    window.addEventListener('resize', scheduleLayoutUpdate, { passive: true });
    window.visualViewport?.addEventListener('resize', scheduleLayoutUpdate, { passive: true });
    update(0, false)

});

/*--------------------------------------------------------------------------- 
  + Functions
---------------------------------------------------------------------------*/
function update(idx, animate = true) {
    const nextIdx = Math.max(0, Math.min(idx, DATA.modulesData.length - 1));
    if (nextIdx !== currentIdx && document.querySelector('.hobby-embedded-modal.active')) {
        closeHobbyModal({ restoreFocus: false });
    }
    currentIdx = nextIdx;
    const isMobile = window.innerWidth <= 768;
        
    if (isMobile) {
        const item = pickerTrack.querySelectorAll('.picker-item-wrapper')[currentIdx];
        const itemW = item?.getBoundingClientRect().width || 160;
        const edgeSpace = Math.max(0, (pickerTrack.clientWidth - itemW) / 2);
        pickerList.style.paddingLeft = `${edgeSpace}px`;
        pickerList.style.paddingRight = `${edgeSpace}px`;
        pickerList.style.transform = 'none';
        const itemRect = item?.getBoundingClientRect();
        const trackRect = pickerTrack.getBoundingClientRect();
        if (itemRect) {
            const targetLeft = pickerTrack.scrollLeft + itemRect.left - trackRect.left -
                (pickerTrack.clientWidth - itemRect.width) / 2;
            pickerTrack.scrollLeft = targetLeft;
        }
    } else {
          pickerList.style.paddingLeft = '';
          pickerList.style.paddingRight = '';
          pickerTrack.scrollLeft = 0;
          const itemH = 60;
          const targetY = ((activeModuleContainer.clientHeight - 72) / 2) - (currentIdx * itemH) - (itemH / 2);
          pickerList.style.transform = `translateY(${targetY}px)`;
    }

    hintUp.classList.toggle('visible', currentIdx > 0);
    hintDown.classList.toggle('visible', currentIdx < DATA.modulesData.length - 1);

    if (animate) {
        activeModuleContainer.classList.remove('surge-active');
        void activeModuleContainer.offsetWidth; 
        activeModuleContainer.classList.add('surge-active');
    }

    select('.picker-item', true).forEach((item, i) => {
        const isActive = i === currentIdx;
        item.classList.toggle('active', isActive);
        const dist = Math.abs(i - currentIdx);
        item.style.opacity = isActive ? '1' : Math.max(.3, 0.3 - (dist * 0.15));
        item.style.transform = isActive ? 'scale(1.05)' : `scale(${1 - dist * 0.05})`;

        if (isActive) { 
            select('.tab-text-module').innerHTML = item.querySelector('.label-text').textContent;
            const panel = item.querySelector('.panel-content') || (isActive ? mountedPanel : null);
            if (!panel) return;
            if (!panelOrigins.has(panel)) {
                panelOrigins.set(panel, panel.parentElement);
            }
            if (panel !== mountedPanel) {
                const mountedPanelOrigin = mountedPanel && panelOrigins.get(mountedPanel);
                if (mountedPanelOrigin) {
                    mountedPanelOrigin.appendChild(mountedPanel);
                }
                activePanelWrapper.replaceChildren(panel);
                mountedPanel = panel;
            }
        }
    });

    activeModuleContainer.classList.toggle(
          'is-techstack-active',
          mountedPanel?.classList.contains('techstack-panel') ?? false
    );

    updateTimelineLine();

}

function scheduleLayoutUpdate() {
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
        resizeFrame = requestAnimationFrame(() => {
            resizeFrame = null;
            update(currentIdx, false);
        });
    });
}

select('.available-mod-track').addEventListener('wheel', e => {
    e.preventDefault();
    if (Math.abs(e.deltaY) > 5) update(currentIdx + (e.deltaY > 0 ? 1 : -1));
}, { passive: false });

pickerList.addEventListener('click', e => {
    const wrapper = e.target.closest('.picker-item-wrapper');
    if (wrapper) update(parseInt(wrapper.dataset.idx));
});

let touchStartX = null;

pickerTrack.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
}, { passive: true });

pickerTrack.addEventListener('touchend', e => {
    if (touchStartX === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;

    if (Math.abs(deltaX) < 35) return;
    update(currentIdx + (deltaX < 0 ? 1 : -1));
}, { passive: true });

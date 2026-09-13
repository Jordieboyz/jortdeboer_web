import { ModuleRenderer, TelemetryRenderer, SocialLinksRenderer } from "./render.js";
import { updateTimelineLine } from "./about-modules.js";
import { DATA } from "content-data"

const selectID = id => document.getElementById(id);
const select = (selector, all = false) =>
    all ? [...document.querySelectorAll(selector)] : document.querySelector(selector);

let currentIdx = 0;

const pickerList = select('.available-mod-list');
const activeModuleContainer = select('.active-module-container');
const hintUp = selectID('hintUp');
const hintDown = selectID('hintDown');
// const overlay = selectID('diveOverlay');

new SocialLinksRenderer(DATA.sociallinksData, select('.hero-links')).run()
new ModuleRenderer(DATA.modulesData, pickerList).run()
new TelemetryRenderer(DATA.telemetryData, select('.telemetry-grid')).run()

const activePanelWrapper = activeModuleContainer.querySelector('.module-content-wrapper');
const panelOrigins = new WeakMap();
let mountedPanel = activePanelWrapper.querySelector('.panel-content');

document.addEventListener('DOMContentLoaded', () => {

    // Buttons for modules slider
    hintUp.addEventListener('click',    () => { if (currentIdx > 0) update(currentIdx - 1); });
    hintDown.addEventListener('click',  () => { if (currentIdx < DATA.modulesData.length - 1) update(currentIdx + 1); });

    // start at module no# 0
    window.addEventListener('resize', () => update(currentIdx, false));
    update(0, false)

});

function update(idx, animate = true) {
    currentIdx = Math.max(0, Math.min(idx, DATA.modulesData.length - 1));
    const isMobile = window.innerWidth <= 768;
        
    if (isMobile) {
        const itemW = 160;
        const targetX = (window.innerWidth / 2) - (currentIdx * itemW) - (itemW / 2);
        pickerList.style.transform = `translateX(${targetX}px)`;
    } else {
        const itemH = 60;
        const targetY = ((425 - 72)/ 2) - (currentIdx * itemH) - (itemH / 2);
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

    updateTimelineLine();

}

select('.available-mod-track').addEventListener('wheel', e => {
    e.preventDefault();
    if (Math.abs(e.deltaY) > 5) update(currentIdx + (e.deltaY > 0 ? 1 : -1));
}, { passive: false });

pickerList.addEventListener('click', e => {
    const wrapper = e.target.closest('.picker-item-wrapper');
    if (wrapper) update(parseInt(wrapper.dataset.idx));
});



async function fetchGitHub() {
    const list = selectID('github-list');
    try {
        // Fetch more than 3 to account for filtering out the profile README repo
        const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=10`);
        const data = await res.json();
        
        if (data && data.length > 0) {
            // Filter out the repository that matches the username (usually the profile README)
            const filteredRepos = data
                .filter(repo => repo.name.toLowerCase() !== GITHUB_USER.toLowerCase())
                .slice(0, 3); // Then take the top 3

            if (filteredRepos.length === 0) {
                    list.innerHTML = `<div class="loading">NO_PUBLIC_REPOS</div>`;
                    return;
            }

            list.innerHTML = filteredRepos.map(repo => {
                const descriptionHtml = repo.description 
                    ? `<div class="repo-desc">${repo.description}</div>` 
                    : '';
                return `
                    <div class="repo-card">
                        <div class="repo-header">
                            <a href="${repo.html_url}" target="_blank" class="repo-link">${repo.name}</a>
                            <span class="repo-updated">${formatRelativeTime(repo.pushed_at)}</span>
                        </div>
                        ${descriptionHtml}
                    </div>
                `;
            }).join('');
        } else {
            list.innerHTML = `<div class="loading">NO_PUBLIC_REPOS</div>`;
        }
    } catch (err) {
        list.innerHTML = `<div class="loading" style="color:#f87171">OFFLINE_MODE</div>`;
    }
}

// for project 2
// function openDive() {
    
// }

// function closeDive() {
//     ovrelay.classList.add('active');
// }

// document.addEventListener('keydown', (e) => {
//     if (e.key === "Escape") closeDive();
// })

    // window.onload = () => {
    //     fetchGitHub();
    // };
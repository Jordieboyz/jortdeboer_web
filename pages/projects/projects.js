(function() {
  "use strict";

    // --- 2. DOM Elements and Global State ---
    const modalOverlay = select('.project-modal-overlay');
    const modalDetails = select('.modal-project-details');

    let activeCategory = 'All'; // Default active category

    const categories = {
        'All': 'All Projects',
        'Low-Level': 'Low-Level / Embedded',
        'Mid-Level': 'Mid-Level / Systems',
        'High-Level': 'High-Level / Apps',
        'In-Development' : 'In Development'
    };
    
    // Add listener to close when clicking outside the modal content
    select('.modal-close-btn')?.addEventListener('click', hideProjectModal);
    modalOverlay?.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            hideProjectModal();
        }
    });


    /**
     * Renders the interactive filter buttons at the top.
     */
    function renderCategoryTabs() {
        const categoryKeys = Object.keys(categories);

        const html = categoryKeys.map(key => {
            const displayValue = categories[key];
            const isActive = key === activeCategory ? 'active' : '';
            let n = projectsData.length
            
            if(key != 'All'){
                n = projectsData.filter(p =>
                    Array.isArray(p.category) && p.category.includes(key)
                ).length
            }
            return `
                <button class="filter-button ${isActive}" data-category="${key}" onclick="setActiveCategory('${key}')">
                    ${displayValue} (${n})
                </button>
            `;
        }).join('');
        
        select('.category-tabs').innerHTML = html;
    }

    /**
     * Sets the active category, updates the tabs, and renders the project list.
     * @param {string} category - The category to activate ('All', 'Low-Level...', etc.)
     */
    window.setActiveCategory = function(category) {
        activeCategory = category;

        // 1. Update active class on buttons
        select('.filter-button', true).forEach(btn => {
            if (btn.getAttribute('data-category') === category) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 2. Render the filtered projects
        renderProjectList();
    }

    /**
     * Filters projects by the active category and renders the list in a grid.
     */
    function renderProjectList() {
        const projectListContainer = select('.project-list'); 
        let filteredProjects = projectsData;

        if (activeCategory !== 'All') {
            filteredProjects = projectsData.filter(p =>
                Array.isArray(p.category) && p.category.includes(activeCategory)
            );
        }

        // Sort by date (most recent first)
        filteredProjects.sort((a, b) => {
            if (a.date < b.date) return 1;
            if (a.date > b.date) return -1;
            return 0;
        });

        if (filteredProjects.length === 0) {
            projectListContainer.innerHTML = `
                <p style="color: #94a3b8; text-align: center; padding: 2.5rem 0; grid-column: 1 / -1;">
                    No projects found in this category.
                </p>`;
            return;
        }
        const html = filteredProjects.map(p => createProjectItemHtml(p)).join('');
        projectListContainer.innerHTML = html;

        lucide.createIcons(); // Initialize Lucide icons after injecting HTML
    }


    /**
     * Fills the modal with content and shows it.
     * @param {string} projectId - The ID of the project to display.
     */
    window.showProjectModal = function(projectId) {
        const project = projectsData.find(p => p.id === projectId);

        if (!project) {
            console.error('Project not found:', projectId);
            return;
        }

        const tagsHtml = project.tags.map(tag => 
            `<span class="tag">${tag}</span>`
        ).join('');
        
        const stackListHtml = project.stack.map(item => `<li>${item}</li>`).join('');
        
        modalDetails.innerHTML = `
            <div>
                <span class="modal-header-meta">${project.category} / ${project.date}</span>
                <h2 class="modal-title">${project.title}</h2>
                <h3 class="modal-focus">${project.focus}</h3>
            </div>
            
            <div class="tags-container" style="margin-top: 1rem; margin-bottom: 1.5rem; gap: 0.5rem;">
                ${tagsHtml}
            </div>

            <div class="modal-body">
                <h4>Project Goal and Overview</h4>
                <p>${project.longDescription.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
                
                <h4>Core Technology Stack</h4>
                <ul>
                    ${stackListHtml}
                </ul>

                <p style="font-size: 0.75rem; text-align: center; color: #64748b; margin-top: 2rem;">
                    For code repositories and deeper implementation details, please contact me directly.
                </p>
            </div>
        `;
        
        lucide.createIcons();

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
        }, 300);
    }

    // --- 5. Initialization ---
    document.addEventListener('DOMContentLoaded', () => {
        renderCategoryTabs();
        renderProjectList();

        if(window.location?.hash.length > 1){
            showProjectModal(window.location?.hash.substring(1));
        }

        lucide.createIcons();
    });


  })()






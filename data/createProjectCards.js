(function() {
  "use strict";

    window.createCardFooterHtml = (project) => {
        const linksHtml = project.links.map(link => 
            `<a href="${link.web}" target="_blank">
                <i data-lucide="${link.icon}" class="link-icon"></i>
            </a>`
        ).join('');

        return ` <div class="card-footer">
                    <div class="quick-links">
                        ${linksHtml}
                    </div>
                    <a href="projects.html#${project.id}" class="btn-see-more" >
                        <span>See More</span>
                        <i class="icon" data-lucide="chevron-right"></i>
                    </a>
            </div>`;

    };

    window.createStatusRibbonHtml = () => {
        return `
            <div class="status-corner-ribbon in-progress">
            <span>In Development</span>
            </div>
        `
    }

    function createTagsHtml(project){
      const tagsHtml = project.tags.map(tag => 
          `<span class="tag">${tag}</span>`
      ).join('');

      return `                  
          <div class="tags-container">
              ${tagsHtml}
          </div>`
    }

    function createMetaHtml(project){
        return `<div class="card-meta-row">
                    <span class="item-date">${project.date}</span>
                ${project.completed ? '' :`
                    <span class="progress-dot-container">
                        <span class="progress-badge">
                            <span class="progress-badge-text">In Development</span>
                        </span>
                    </span>`
                }
                </div>`
    }


    /**
     * Creates the HTML structure for a single project item (vertical card) with the new visual style.
     * @param {Object} project - The project data object.
     * @returns {string} The HTML string for the project item.
     */
    window.createProjectItemHtml = (project, meta = true, tags = true) => {        
        return `
            <div class="project-item" onclick="showProjectModal('${project.id}')">

                <!-- NEW: Image/Graphic Area -->
                <div class="card-image-container">
                    <img src="${project.bannerImage}">
                </div>
                
                <div class="project-content">
                    ${meta ? createMetaHtml(project) : ''}
                    <div class="project-header">
                        <i data-lucide="${project.icon}" class="project-icon"></i>
                        <h4 class="project-title">${project.title}</h4>
                    </div>
                    <p class="item-description">${project.shortDescription}</p>
                    ${tags ? createTagsHtml(project) : ''}
                </div>
            </div>
        `;
    }

    window.createProjectCardHtml = (project, meta = false, tags = false, footer = true) => {
        const card = document.createElement('a');
        card.classList.add('project-card');

        card.innerHTML += project.completed ? '' : createStatusRibbonHtml();
        card.innerHTML += createProjectItemHtml(project, meta, tags);
        card.innerHTML += footer ? createCardFooterHtml(project) : ''
        return card
    }






















})()
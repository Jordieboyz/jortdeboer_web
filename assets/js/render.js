import { DATA } from "content-data"
import { APP_EVENTS, emit } from "./events.js";

export class ElementBuilder {
  static tags = [
    'div', 'span', 'button', 'i', 'li', 
    'h1', 'h2', 'h3', 'h4', 'p', 'a', 'img', 'ul',
  ];

  static voidElements = new Set([
    'img', 'input', 'br', 'hr', 'meta', 'link'
  ]);

  static rawHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content.cloneNode(true);
  }

  static create(selector, children = [], extraClasses = '', attrs = {}) {
    if (typeof extraClasses === 'object' && !Array.isArray(extraClasses)) {
      attrs = extraClasses;
      extraClasses = '';
    }

    if (typeof children === 'object' && !Array.isArray(children) && !(children instanceof Node)) {
      attrs = children;
      children = [];
    }

    if (ElementBuilder.voidElements.has(selector)) {
      children = [];
    }

    const el = document.createElement(selector);

    // --- classes ---
    if (extraClasses) {
      el.className = extraClasses;
    }

    // --- attributes ---
    Object.entries(attrs || {}).forEach(([key, value]) => {
      const k = key.toLowerCase()
      
      if (k.startsWith('on') && typeof value === 'function') {
        el.addEventListener(k.slice(2), value);
        return;
      }
      el.setAttribute(key, value);
    });

    // --- children ---
    if (!Array.isArray(children)) {
      children = [children];
    }

    children.flat().forEach(child => {
      if (!child && child !== 0) return;

      if (typeof child === 'string' || typeof child === 'number') {
        el.append(child);
      } else {
        el.appendChild(child);
      }
    });

    return el;
  }
}

const elements = Object.fromEntries(
  ElementBuilder.tags.map(tag => [
    tag, (cls = '', children = [], attrs = {}) =>
      ElementBuilder.create(tag, children, cls, attrs)
  ])
);

export const select = (selector, all = false) =>
  all ? [...document.querySelectorAll(selector)] : document.querySelector(selector);

const html = content => ElementBuilder.rawHTML(content);
const {
  div, span, button, i, li,
  h2, h3, h4, p, a, img, ul
} = elements;

class BaseRenderer {
    constructor(data, parent, options = {}) {
        this.data = data;
        this.parent = parent;
        this.options = options;

        this.isList = Array.isArray(this.data)

        this.validate();    
        this.run();
    }

    validate() {
        if (!this.data || Object.keys(this.data).length === 0) {
          throw new Error(`${this.constructor.name}: No data found!`)
        }
    }

    render() {
        throw new Error(`${this.constructor.name} must implement render()` );
    }

    renderList(){
      return this.data.map((item, idx) => {
        return this.renderItem(item, idx)
      });
    };

    renderItem(item, idx){
      const preservedData = this.data
      const preservedOptions = this.options

      this.data = item
      this.options = {...this.options, idx};
      
      try { 
        return this.render();
      } finally {
        this.data = preservedData
        this.options = preservedOptions
      }
    }
    
    mount(element){
        if (!this.parent) return

        if (Array.isArray(element)) {
            this.parent.replaceChildren(...element)
            return 
        }
        this.parent.replaceChildren(element);
    }

    run(){
      const result = this.isList 
        ? this.renderList() 
        : this.render()
      
      this.mount(result)
      return result
    }

    create(tag, className, props = {}){
        return Object.assign(document.createElement(tag), {
            className, ...props
        })
    }
    

    get miscTranslations(){
      return DATA.miscTranslations
    }
}

export class TelemetryRenderer extends BaseRenderer {
  render(){
    return div('telemetry-item', [
      div('telemetry-label', [
        i(`ph ${this.data.icon}`),
        span('telemetry-name', this.data.name )
      ]),
      div('telemetry-value', this.data.value, 
        { style: `color: ${this.data.customColor}`}
      )
    ])
  }
}

export class ModuleRenderer extends BaseRenderer {

  selectModule(idx){
    switch (idx) {
      case 0:
        return this.identityModule();
      case 1:
        return this.hobbiesModule();
      case 2:
        return this.techStackModule();
      case 3:
        return this.educationModule();
      case 4:
        return this.githubModule();
      case 5:
        return this.contactModule();
      default:
        return null;
    }
  }

  render() {
    return div('picker-item-wrapper', [
      div('picker-item', [
        div('icon-box', [
          i(`ph ${this.data.icon}`)
        ]),
        div('label-group', [
          span('label-text', this.data.label),
          span('label-subtext', this.data.shortDesc),
        ]),
        div('panel-content-wrapper', this.selectModule(this.options.idx))
      ])
    ], { 'data-idx': this.options.idx }
    );
  }

  identityModule(){
    return div('panel-content',[
      div('phase-content identity-phase-1 active', [
        div('header-content', [
          h2('intro-headline', html(this.data.content.intro))
        ]),
        div('identity-spec-bar', this.data.content.specs.map(spec => 
          div('spec-item',[
            span('spec-label', [
              i(spec.icon),
              spec.label
            ]),
            span('spec-val', spec.value)
          ])
        )),
        button('btn-next', [
          span('', 'Next: Mindset & Core Values'),
          i('ph ph-arrow-right')
        ], {
          onClick : (e) => {
            e.stopPropagation();
            emit(e.currentTarget, APP_EVENTS.MODULE_IDENTITY_SWITCH_PHASE, { phase : 2 })
          },
          style : "float: right;"
        })
      ]),
      div('phase-content identity-phase-2', [
        div('cards-container', this.data.content.cards.map(card => 
          div('vibe-card', [
            div('card-title',[
              div('card-icon-glow', [ 
                i(card.icon )
              ]),
              span('card-label', card.label)
            ]),
            p('card-text', html(card.text))
          ])
        )),
        button('btn-next', [
          i('ph ph-arrow-left'),
          span('', 'Back: Bio & Specs')
        ], {
          onClick : (e) => {
            e.stopPropagation();
            emit(e.currentTarget, APP_EVENTS.MODULE_IDENTITY_SWITCH_PHASE, { phase : 1 })
          },
          style : "float: left;"
        })
      ])
    ])
  }
  
  hobbiesModule(){
    return div('panel-content education-panel', [ 
      div('header-content', [
        // h2('intro-headline', html(this.data.content.intro))
      ]),
      div('tiles-grid', this.data.content.tiles.map(tile => 
        div('tile', [
          div('tile-image',[], { 
            style:`background-image: url('${tile.bg}')`
          }),
          div('shutter-content', [
            span('tile-label', tile.label),
            p('tile-desc', tile.desc)
          ])
        ], {
          onClick : (e) => {
            e.stopPropagation()
            emit(e.currentTarget, APP_EVENTS.MODULE_HOBBY_OPEN_MODAL, 
              {
                hobbyId : tile.id
              }
            )   
          }
        })
      )),
      div('hobby-embedded-modal', [
        button('modal-close-x', i('ph ph-x'), {
          onclick : (e) => {
            e.stopPropagation()
            emit(e.currentTarget, APP_EVENTS.MODULE_HOBBY_CLOSE_MODAL)   
          }
        }),
        div('modal-left-stack'),
        div('modal-right-info')
      ])
    ])
  }

  techStackModule(){
    function createSkillChip(layer, skill){
      const hasSvgLogo = typeof skill.svg === 'string' && skill.svg.trim().toLowerCase().endsWith('.svg');

      return div('chip', [
          div('chip-icon', hasSvgLogo
            ? img('chip-logo', [], { src: skill.svg, alt: `${skill.title} logo` })
            : []
          ),
          div('chip-info',[
            div('chip-title', skill.title),
            div('chip-subtitle', skill.subtitle)
          ])
        ], { 
          onclick : (e) => { 
            e.stopPropagation(); 
            emit(e.currentTarget, APP_EVENTS.MODULE_TECHSTACK_SELECT_NODE, 
              {
                layerId : layer.id, 
                skillId : skill.id,
              }
            )
          },
          style : `--node-color: ${skill.color};`
        }
      )
    }

    function createStackRack(layer){
      return div(`slab slab-${layer.id}`, [
          div('slab-tab', [
            span("num", layer.id.slice(-1)),
            span("label", layer.label),
          ]),
          div(`slab-nodes grid-${layer.id}`, layer.techskill.map(s => createSkillChip(layer, s)))
        ], { 
          style : `--slab-bg: ${layer.color.bg}; --slab-light: ${layer.color.light}; --slab-dark: ${layer.color.dark};`
        }
      )
    }

    return div('panel-content techstack-panel', [ 
      div('hud-canvas',[
        div('stack-rack', [ 
          this.data.content.layers.map(layer => createStackRack(layer)),
          div('layer-slider', [
            button('slider-arrow', i('ph ph-caret-left'), { 
              onClick : (e) => {
                e.stopPropagation(); 
                emit(e.currentTarget, APP_EVENTS.MODULE_TECHSTACK_SHIFT_LAYER, 
                  {
                    dir : -1
                  }
                )
              }
            }),
            div('slider-viewport',[
              div('slider-head',[
                div('slider-label',[
                  span('num sld-num'),
                  span("label sld-label"),
                ]),
                div('slider-dots')
              ]),
              div('slider-track')
            ]),
            button('slider-arrow', i('ph ph-caret-right'), { 
              onClick : (e) => {
                e.stopPropagation(); 
                emit(e.currentTarget, APP_EVENTS.MODULE_TECHSTACK_SHIFT_LAYER, 
                  {
                    dir : 1
                  }
                )
              } 
            })
          ])
        ]),
        div('detail-drawer', [
          div('drawer-header', [
            div('drawer-info', [
              div('drawer-icon', img('drawer-logo', [], { alt: 'Technology logo' })),
              div('__', [
                div('drawer-title'), //fill in by js
                span('drawer-layer')  //fill in by js
              ])
            ]),
            button('btn-close', i('ph ph-x'), { 
              onClick : (e) => {
                e.stopPropagation(); 
                emit(e.currentTarget, APP_EVENTS.MODULE_TECHSTACK_CLEAR_SELECTION)
              } 
            })
          ]),
          div('detail-body',[
            div('detail-grid',[
              // need to automate !
              div('detail-section',[
                div('section-label', 'WHAT I USE IT FOR'),
                p('section-text') //fill in by js
              ]),
                            div('detail-section',[
                div('section-label', 'TOOLS / ECOSYSTEM'),
                div('eco-grid') //fill in by js
              ]),
                 div('detail-section',[
                div('section-label', 'PROFICIENCY & EXPERIENCE'),
                div('spec-matrix') //fill in by js
              ]),
              div('detail-section',[
                div('section-label', 'RELATED PROJECTS'),
                div('projects-list') //fill in by js
              ]),
            ])
          ])
        ])
      ])
    ])
  }

  educationModule(){
    function createTimelineNode(node, idx){
      return div(`timeline-node tnode-${idx} ${idx == 0 ? 'active' : ''}`,[
        div('timeline-dot', [
          div('timeline-dot-inner')
        ]),
        div('timeline-title', node.date),
        div('timeline-subtitle', node.company)
      ], {
        onclick : (e) => { 
          e.stopPropagation(); 
          emit(e.currentTarget, APP_EVENTS.MODULE_EDUCATION_SELECT_NODE, 
            {
              nodeIdx : idx
            }
          )
        }
      })
    }
    
    return div('panel-content', [ 
      div('timeline-track', [
        div('timeline-line-bg',[
          div('timeline-line-fill')
        ])
      ]),
      div('timeline-nodes', this.data.content.nodes.map((n,i) => createTimelineNode(n, i) )),
      div('milestone-card')
    ])
  }

  githubModule(){

    return div('panel-content', [ 
      div('github-card', [
        img('github-avatar', [], { 
          src : 'https://github.com/Jordieboyz.png', 
          alt : this.data.title 
        }),
        div('github-info',[
          div('github-username', `@${this.data.content.username}`),
          div('github-bio', this.data.content.bio)
        ]),
        div('github-stats-container'),
      ]),
      div('github-controls-bar',[
        div('github-section-title', [
          i('ph ph-git-branch'),
          span('', 'Repositories')
        ]),
        div('github-actions', [
          button('btn-refresh', [
            i('refresh-icon ph ph-arrows-clockwise'),
            span('', 'Refresh Stream')
          ], {
            onclick : (e) => { 
              e.stopPropagation(); 
              emit(e.currentTarget, APP_EVENTS.MODULE_GITHUB_FETCH_DATA, 
                {
                  forceRefresh : true
                }
              )
            }
          })
        ])
      ]),
      div('github-projects-grid')
    ])
  }

  contactModule(){
    return div('panel-content', [ 
      div('header-content', [
        h2('intro-headline', html(this.data.content.intro))
      ])
    ])
  }
}

export class CategoryRenderer extends BaseRenderer {
    render(){
      const btnKey = this.data.key
      return button('filter-button', this.data.label, {
        'data-category' : btnKey,
        onClick : () => this.options.onClick(btnKey)
      })
    };
}

export class CompetenceRenderer extends BaseRenderer {
  fetchProjects(limit = 3){
    this.projects = this.options.projects.filter(project => project.competences?.includes(this.data.id))
      .slice(0, limit);
  }

  createTags(){
    return this.projects.map(p =>
      Array.isArray(p.tags) && p.tags.length > 0
        ? span("skill-tag", p.tags[0])
        : ''
    )
  }

  createProjectLinks(){
    return this.projects.map(project => 
      a('project-btn',[
        span('proj-dot'),
        div('project-title-row',[
          span('project-title-text', [
            project.title,
            i('ph ph-arrow-up-right')
          ])
        ])
      ],{href : `projects.html#${project.id}`})
    )
  }

  render(){      
    this.fetchProjects()
    return div('skill-card' ,[
      div('card-corner'), 
      div('card-inner-wrapper', [
        div('card-header', [
          div('card-icon-wrap', [
            i(`ph ${this.data.icon}`)
          ]),
          h3('',this.data.title)
        ]),
        // div('skill-tags', this.createTags()),
        p('skill-desc', this.data.description),
        div('card-divider'),
        div('project-view',[
          div('hover-buttons-stack', this.createProjectLinks()),
          div('image-preview-wrapper', [
            div('preview-link-anchor', [
              div('fallback-graphic', [
                i(`ph ${this.data.icon}`),
                span('', [this.data.title])
              ]),
              img('competence-img')
            ])
          ])
        ]),
          
        div('hover-card-footer', [
          a('card-footer-action',[
            span('', this.miscTranslations.viewProjects),
            i('ph ph-caret-right')
          ], { href : 'projects.html' })
        ]),
      ]),
    ], {style : `--accent: ${this.data.customColor}`}
    )
  };
}

export class ProjectModalRenderer extends BaseRenderer {
  createTags(){
    return (this.data.tags ?? []).map(tag => span('tag', tag))
  }
  
  createStackList(){
    return (this.data.stack ?? []).map(item => li('', item))
  }

  render(){
    const description = (this.data.longDescription ?? '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    return div('wrapper', [
      span('modal-header-meta',`${(this.data.competences ?? [])
        .map(id => DATA.competencies.find(competence => competence.id === id)?.title)
        .filter(Boolean)
        .join(' / ')} / ${this.data.date}`),
      h2('modal-title', this.data.title),
      h3('modal-focus', this.data.focus),
      div('tags-conatainer', this.createTags()),
      div('modal-body', [
        h4('', this.miscTranslations.goal),
        p('', description),
        h4('', this.miscTranslations.stack),
        ul('', this.createStackList()),
        p('contact', this.miscTranslations.contact)
      ]),
    ])
  }
}

export class ProjectRenderer extends BaseRenderer {
  createTags(){
    return (this.data.tags ?? []).map(tag =>
      span('tag', tag)
    )
  }
  
  render(){
    const pId = this.data.id
    const result = div('project-item',[
      div('card-image-container', 
        img('',[],{ src : this.data.bannerImage, alt : this.data.title })
      ),
      div('project-content', [
        this.options.meta && div('card-meta-row', [
          span('item-date', this.data.date),

          !this.data.completed &&
            span('progress-dot-container', [
              span('progress-badge', [
                span('progress-badge-text', this.miscTranslations.inDev)
              ])
            ])
        ]),
        div('project-header', [
          i(`project-icon ph ph-${this.data.icon}`),
          h4('project-title', this.data.title)
        ]),
        p('item-description', this.data.shortDescription),
        this.options.tags && 
          div('tags-container', this.createTags())
      ])
    ],{ 
        onClick: () => window.showProjectModal?.(pId)
      }
    )
    return result
  }
}

export class domainSelectionRenderer extends BaseRenderer {
  fetchProjects(id, limit = 2){
    this.projects = this.options.projects.filter(project => project.competences?.includes(id)).slice(0, limit);
  }

  project_count(id) {
    return this.options.projects.filter(project => project.competences?.includes(id)).length
  }

  render(){
    this.fetchProjects(this.data.id)
    const domId = this.data.id

    return div('tree-group',[
      div('btn domain-header',[
        div('domain-header-left',[ 
          i('ph ph-caret-down domain-chevron'),
          div('domain-icon-dot', 
            i(`ph ${this.data.icon}`)
          ),
          span('domain-title', this.data.title)
        ]),
        span('domain-count-badge', Math.min(2, this.project_count(this.data.id)))
      ],{
        onClick : (e) => {
          e.stopPropagation();
          emit(e.currentTarget, APP_EVENTS.DOMAIN_SELECT, 
            {
              domKey : domId
            }
          )
        }
      }),

      div('project-sublist-wrapper',[
        div('project-sublist-inner',[
          div('project-sublist', this.projects.map(proj => 
            div('tree-project-item', [
              div('tree-project-item-left',[
                span('tree-file-ext', i(`ph ph-${proj.icon}`)),
                span('tree-project-name', proj.title)
              ]),
              span('tree-active-indicator')
            ],
            {
              onClick : (e) => { 
                e.stopPropagation();
                emit(e.currentTarget, APP_EVENTS.PROJECT_SELECT, {
                  domKey : domId,
                  projId : proj.id,
                })
              }
            })
          ))
        ])
      ])
    ], { style: `--accent : ${this.data.customColor}`})
  }
}

export class DomainDetailsPanel extends BaseRenderer {

  // THis class always gets passed a single project object for display
  render(){    
    return this.options.placeholder ?  
      // placeholder
      div('placeholder-state', [
        div('placeholder-icon-wrap', i('ph ph-cursor-click')),
        h3('placeholder-title', 'No Project Selected'),
        p('placeholder-text', 'Select any system project from the explorer tree on the left to inspect its details and technical specs.'),
        div('placeholder-hint-chips', this.data.hintProj.map(p => 
          button('btn quick-pick-button', [
            span('quick-pick-label' , [
              i(`ph ph-${p.icon}`), 
              p.title
            ]),
            i('ph ph-arrow-right')
          ], {
            style: `--accent : ${this.options.competences.find(c => c.id === p.competences[0]).customColor}`,
            onClick : (e) => {
              e.stopPropagation();
              console.log('ds', p)
              emit(e.currentTarget, APP_EVENTS.PROJECT_SELECT, {
                domKey : p.competences[0],
                projId : p.id,
              })
            }
          })
        ))
      ]) 
    :  // project card 
    div('project-card', [
      div('card-header',[
        a('category-pill-badge',[
          span('badge-text-primary',[
            i(`ph ph-${this.data.icon}`),
            span('badgeCategoryText', this.options.competences.find(c => c.id === this.data.competences[0]).title)
          ])
        ]),
        div('card-top-actions',
          button('close-icon-btn', i('ph ph-x'), 
            {
              onClick : (e) => {
                e.stopPropagation();
                emit(e.currentTarget, APP_EVENTS.PROJECT_CLOSE)
              }
            }
          )
        )
      ]),
      div('project-image-container',[
        img('banner-image', [], { src : this.data.bannerImage}),
        div('overlay-card', [
          span('created-meta', [
            i('ph ph-clock') ,
            this.data.date
          ]),
          h2('overlay-title', this.data.title),

        ])
      ]),
      div('project-description', this.data.shortDescription),
      div('card-bottom-bar' ,[
        a('btn btn-view-project', span('', [
          'View project', 
        i('ph ph-arrow-up-right arrow-icon')]), {
          href : `projects.html#${this.data.id}`
        }),
        a('btn btn-github', span('', [ 
          i('ph ph-github-logo'), 
          'Github'
        ]), {
          href : `https://github.com/Jordieboyz`,
          target : '_blank'
        })
      ])
    ], { style: `--accent : ${this.options.competences.find(c => c.id === this.data.competences[0]).customColor}`})
  }
}

export class CompetenceTabRenderer extends BaseRenderer {
  project_count(id) {
    return this.options.projects.filter(project => project.competences?.includes(id)).length
  }
  
  render(){
    return div('skill-tab',[
      div('tab-icon-wrap', [
        i(`ph ${this.data.icon}`)
      ]),
      div('tab-head',[
        span('tab-label',this.data.title),
        span('tab-count',`Featured projects: ${this.project_count(this.data.id)}`)
      ])
    ],{ 
      style : `--accent: ${this.data.customColor}`,
      'data-tab': this.data.id, 
      'role' : 'tab'
    });
  }
}

export class CompetencePanelRenderer extends BaseRenderer {
  fetchProjects(limit = 3){
    this.projects = this.options.projects.filter(project => project.competences?.includes(this.data.id))
      .slice(0, limit);
  }

  createProjectLinks(){
    return this.projects.map((p, idx) =>
      Array.isArray(p.tags) && p.tags.length > 0
        ? a('proj-row',[
          span('proj-num',idx+1),
          span('proj-name',p.title),
          i('ph ph-arrow-up-right proj-arrow')
        ], { href:`projects.html#${p.id}` })
        : ''
    )
  }

  render(){
    this.fetchProjects()
    return div('panel-inner',[
      div('panel-img-wrap',[
        div('panel-fallback',[
          i(`ph ${this.data.icon}`) ,
          span('',this.data.title)
        ]),
        img('panel-img hidden'),
        div('panel-img-overlay')
      ]),
      div('panel-body',[
        div('panel-head',[
          div('panel-title-wrap',[
            div('panel-category', this.data.title),
            div('panel-title', this.data.title)
          ])
        ]),
        div('panel-projects',[
          div('panel-projects-label', 'Featured projects'),
          this.createProjectLinks()
        ]),
        a('panel-footer-link',[
          'All projects',
          i('ph ph-caret-right')
        ],{ href: 'projects.html' })
      ])
    ],{ 
      style : `--accent: ${this.data.customColor}`,
      'data-panel': this.data.id, 
    })
  
  }
}

export class SocialLinksRenderer extends BaseRenderer {
  render(){
    return  Object.values(this.data).map(link =>
       a('btn social-link', i(link.icon)
        , { href: link.href , target : link.target })
    )
  }
}

export class CompetenceLinksRenderer extends BaseRenderer {
  render(){
    const domId = this.data.id
    return span('btn stat-pill', [i(`ph ${this.data.icon}`), this.data.title], 
    { 
      style: `--accent: ${this.data.customColor}`,
      onClick : (e) => {
        e.stopPropagation();
        emit(e.currentTarget, APP_EVENTS.SCROLL_TO_DOMAIN, { domId : domId })
      } })
  }
}

export class LanguageDropdownRenderer extends BaseRenderer {
  render(){
    return Object.entries(this.data).map(([lang, v]) =>
       button('lang-option',[
          span('flag', v.flag),
          span('', v.language),
          i('ph ph-check check')
        ], { 'data-lang': lang })
    )
  }
}
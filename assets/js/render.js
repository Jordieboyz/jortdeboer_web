import { DATA } from "content-data"
import { APP_EVENTS, emit } from "./events.js";

export class ElementBuilder {
  static tags = [
    'div', 'span', 'button', 'i', 'li', 'article', 'section',
    'h1', 'h2', 'h3', 'h4', 'p', 'a', 'img', 'ul', 'dialog',
    'figure', 'figcaption',
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

const ph_icon = (icon, cls = '') =>
    i(`ph ph-${icon} ${cls}`.trim());

function getProjectCategories(project) {
  const categories = project.categories ?? project.category;
  return (Array.isArray(categories) ? categories : [categories])
    .filter(category => typeof category === 'string' && category.trim());
}

function getPrimaryProjectCategory(project) {
  return getProjectCategories(project)[0] ?? '';
}

export function select(el, all = false) {
  el = el.trim();
  if (all) return [...document.querySelectorAll(el)];
  if (el === "window") return window;
  return document.querySelector(el);
}

const html = content => ElementBuilder.rawHTML(content);
const {
  div, span, button, i, li, article, section,
  h2, h3, h4, p, a, img, ul, dialog, figure, figcaption
} = elements;

class BaseRenderer {
    constructor(data, parent, options = {}) {
        this.data = data;
        this.parent = parent;
        this.options = options;

        this.isList = Array.isArray(this.data)


        this.validate();   
        this.init();
        this.run();
        this.post();
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

    init(){}

    run(){
      const result = this.isList 
        ? this.renderList() 
        : this.render()
      
      this.mount(result)
      return result
    }

    post(){}

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
          ph_icon('arrow-right')
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
          ph_icon('arrow-left'),
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
    return div('panel-content hobbies-panel', [ 
      div('header-content', [
        h2('intro-headline', html(this.data.content.intro))
      ]),
      div('tiles-grid', this.data.content.tiles.map(tile =>
        button('tile', [
          div('tile-image',[], { 
            style:`background-image: url('${tile.bg}')`,
            'aria-hidden': 'true'
          }),
          div('shutter-content', [
            h3('tile-label', [i(tile.icon), tile.label]),
            p('tile-desc', tile.desc),
            span('tile-action', [tile.action, ph_icon('arrow-right')])
          ])
        ], {
          type: 'button',
          'aria-haspopup': 'dialog',
          onclick: event => {
            event.stopPropagation();
            emit(event.currentTarget, APP_EVENTS.MODULE_HOBBY_OPEN_MODAL, { hobbyId: tile.id });
          }
        })
      )),
      div('hobby-embedded-modal', [
        button('modal-close-x', ph_icon('x'), {
          type: 'button',
          'aria-label': this.data.content.closeLabel,
          onclick: event => {
            event.stopPropagation();
            emit(event.currentTarget, APP_EVENTS.MODULE_HOBBY_CLOSE_MODAL);
          }
        }),
        div('modal-left-stack'),
        div('modal-right-info')
      ], {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': this.data.content.dialogLabel,
        'aria-hidden': 'true'
      })
    ])
  }

  techStackModule(){
    function createSkillChip(layer, skill){
      const tech = DATA.proglangs.find(entry => entry.id === skill.id) ?? {};
      const hasSvgLogo = typeof tech.svg === 'string' && tech.svg.trim().toLowerCase().endsWith('.svg');

      return div('chip', [
          div('chip-icon', hasSvgLogo
            ? img('chip-logo', [], { src: tech.svg, alt: `${tech.title || skill.id} logo` })
            : [i(tech.icon || 'ph ph-code')]
          ),
          div('chip-info',[
            div('chip-title', tech.title || skill.id),
            div('chip-subtitle', tech.subtitle || '')
          ])
        ], { 
          role: 'button',
          tabindex: '0',
          'aria-label': tech.title || skill.id,
          onclick : (e) => { 
            e.stopPropagation(); 
            emit(e.currentTarget, APP_EVENTS.MODULE_TECHSTACK_SELECT_NODE, 
              {
                layerId : layer.id, 
                skillId : skill.id,
              }
            )
          },
          onKeydown: e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.currentTarget.click();
            }
          },
          style : `--node-color: ${tech.color || layer.color.light}; --node-glow: ${tech.glow || 'transparent'};`
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
            button('slider-arrow', ph_icon('caret-left'), { 
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
            button('slider-arrow', ph_icon('caret-right'), { 
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
            button('btn-close', ph_icon('x'), { 
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
      return button(`timeline-node tnode-${idx} ${idx == 0 ? 'active' : ''}`,[
        div('timeline-dot', [
          div('timeline-dot-inner')
        ]),
        div('timeline-title', node.date),
        div('timeline-subtitle', node.company)
      ], {
        type: 'button',
        'aria-pressed': String(idx === 0),
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
    
    return div('panel-content education-panel', [ 
      p('intro-headline education-intro', this.data.content.intro),
      div('timeline-track', [
        div('timeline-line-bg',[
          div('timeline-line-fill')
        ])
      ]),
      div('timeline-nodes', this.data.content.nodes.map((n,i) => createTimelineNode(n, i) )),
      div('milestone-card', [], {
        role: 'region',
        tabindex: '0'
      })
    ])
  }

  githubModule(){

    return div('panel-content github-panel', [ 
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
          ph_icon('git-branch'),
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
    const email = this.data.content.email || DATA.sociallinksData.mail.href;
    const emailAddress = email.replace(/^mailto:/, '');
    const linkedIn = DATA.sociallinksData.linkedin;
    const github = DATA.sociallinksData.github;

    return div('panel-content contact-module', [ 
      div('header-content', [
        h2('contact-title', this.data.content.title),
        p('contact-intro', html(this.data.content.intro))
      ]),
      div('contact-card', [
        div('contact-card-copy', [
          span('contact-eyebrow', this.data.content.eyebrow),
          h3('contact-card-title', this.data.content.prompt),
          p('contact-card-text', emailAddress)
        ]),
        a('contact-email-link', [
          ph_icon('envelope-simple'),
          span('', this.data.content.emailAction)
        ], {
          href: email,
          'aria-label': `${this.data.content.emailAction}: ${emailAddress}`
        })
      ]),
      div('contact-links', [
        a('contact-link', [
          ph_icon('linkedin-logo'),
          span('', 'LinkedIn'),
          ph_icon('arrow-up-right')
        ], {
          href: linkedIn.href,
          target: '_blank',
          rel: 'noopener noreferrer'
        }),
        a('contact-link', [
          ph_icon('github-logo'),
          span('', 'GitHub'),
          ph_icon('arrow-up-right')
        ], {
          href: github.href,
          target: '_blank',
          rel: 'noopener noreferrer'
        })
      ])
    ])
  }
}

export class CategoryRenderer extends BaseRenderer {
  project_count(id) {
    return this.options.projects.filter(project =>
      getProjectCategories(project).includes(id)
    ).length
  }

  createMobileButtons(className, label){
    return button(className, [
      span(`${className}-copy`, [
        span(`${className}-label`, label),
        span(`${className}-current`, '')
      ]),
      ph_icon('caret-down')
    ],{
       type: 'button',
       'aria-haspopup': 'dialog',
       'aria-controls': 'project-selection-dialog',
       'aria-expanded': 'false',
       onClick : (e) => {
          e.stopPropagation(); 
          emit(e.currentTarget, APP_EVENTS.OPEN_SELECTION, { open : label.toLowerCase() })
        } 
    });
  }

  createDialog(){
    const projectDialog = dialog('project-category-dialog',[
      div('project-category-dialog-header',[
        h2('project-category-dialog-title', 'Categories'),
        button('category-dialog-close', ph_icon('x'),{
          type: 'button',
          'aria-label': 'Close project selection',
          onclick : (e) => {
            e.stopPropagation()
            emit(e.currentTarget, APP_EVENTS.CLOSE_SELECTION)
          }
        })
      ]),
      div('project-category-dialog-panel',[
        section('project-drawer-group project-category-group'),
        section('project-drawer-group project-selection-group')
      ])
    ], { id: 'project-selection-dialog' })
    projectDialog.addEventListener('close', () => {
      document.querySelectorAll('.mobile-buttons button').forEach(toggle =>
        toggle.setAttribute('aria-expanded', 'false')
      );
    });
    const closeProjectDialog = () => {
      document.querySelectorAll('.mobile-buttons button').forEach(toggle =>
        toggle.setAttribute('aria-expanded', 'false')
      );
      if (projectDialog.open) projectDialog.close();
    };
    projectDialog.addEventListener('click', event => {
      if (event.target === projectDialog) closeProjectDialog();
    });
    projectDialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeProjectDialog();
      }
    });
    return projectDialog;
  }

  post(){
    const buttonParent = select('.mobile-buttons');
    const projectAside = select('#projects .project-index');
    const projectIndex = select('.project-category-dialog .idx') || select('#projects .idx');
    let projectDialog = select('.project-category-dialog');

    if(this.options.isMobileLayout){
      if(!projectDialog){
        projectDialog = this.createDialog();
        document.body.append(projectDialog);
      }
      projectDialog.querySelector('.project-category-group')
        .replaceChildren(...this.parent.children);
      projectDialog.querySelector('.project-selection-group')
        .replaceChildren(projectIndex);
      buttonParent.replaceChildren(
        this.createMobileButtons('category-toggle', 'Category'),
        this.createMobileButtons('project-toggle', 'Project')
      );
      buttonParent.hidden = false;
      this.parent.hidden = true;
      return;
    }

    if(projectDialog){
      if(projectDialog.open) projectDialog.close();
      this.parent.replaceChildren(
        ...projectDialog.querySelector('.project-category-group').children
      );
      projectAside.append(projectIndex);
      projectDialog.remove();
    }
    buttonParent.replaceChildren();
    buttonParent.hidden = true;
    this.parent.hidden = false;
  }

  render(){
    const btnKey = this.data.id
    console.log('running filter')
    return button('filter-button',[ 
        span('category-label',this.data.title),
        span('category-total', btnKey == 'all' ? this.options.projects.length : this.project_count(btnKey))
      ] , {
        'data-cat' : btnKey,
        style : `--accent: ${this.data.customColor}`,
        onclick : (e) => { 
          e.stopPropagation(); 
          emit(e.currentTarget, APP_EVENTS.PROJECT_CATEGORY_SELECT, 
            {
              btnKey : btnKey,
              catBtn : e.currentTarget
            }
          )
        }
      }
    )
  };
}

export class ProjectListRenderer extends BaseRenderer {
  render(){
    const projId = this.data.id
    const categories = getProjectCategories(this.data);
    const accent = DATA.categories.find(category => category.id === categories[0])?.customColor ?? 'var(--color-primary)';
    return li('project-list-item',[
      a('', [
        span('project-list-item-title', this.data.title),
        span('project-list-item-date', this.data.date  ? this.data.date : 'In Development')
      ], {
        href : '#'+this.data.id
      })
    ], {
      onClick : (e) => {
        e.stopPropagation()
        emit(e.currentTarget, APP_EVENTS.SELECT_PROJECT, { el : e.currentTarget, pId : projId })
      },
      'data-cat' : categories.join(' '),
      style: `--accent : ${accent}`}
    )
  } 
}

export class ProjectRenderer extends BaseRenderer {
  createTags(){
    return (this.data.tags ?? []).map(tag =>
      span('tag', tag)
    )
  }
  
  render(){
    const pId = this.data.id;
    const categories = getProjectCategories(this.data);
    const categoryNames = categories
      .map(id => this.options.categories.find(category => category.id === id)?.title)
      .filter(Boolean);
    const primaryCategory = categories[0];
    const accent = this.options.categories.find(category => category.id === primaryCategory)?.customColor ?? 'var(--color-primary)';
    return article('project-item', [
      div('card-image-container', [
        span('cat-tag', [
          ph_icon(this.data.icon),
          categoryNames.join(' · ')
        ]),
        img('',[],{ src : this.data.banner, alt : this.data.title })
      ]
      ),
      div('project-content', [
        div('project-card-meta', [
          div('status', span('', this.data.date ? "Completed" : "In Development")),
          span('', this.data.date)
        ]),
        h2('project-card-title', [ph_icon(this.data.icon), this.data.title]),
        p('project-card-focus', this.data.focus),
        p('project-card-description', this.data.short),
        span('project-card-head', 'Relevant Programming Languages :'),
        ul('project-card-langs', this.data.relProgLang.map(l =>  li('', l) )),
        div('project-card-links', [
          a('btn project-card-case-btn', 'Show more', 
            {
              href : `#/${this.data.id}`,
              onClick : (e) => {
                e.stopPropagation();
                e.preventDefault();
                emit(e.currentTarget, APP_EVENTS.PROJECT_SHOW_CASE, { 
                  projId : pId
                })
              }
            }
          ),
          div('source-links', this.data.links
            .filter(l => typeof l.web === 'string' && l.web.trim())
            .map(l => 
            a('btn project-card-btn', [
              ph_icon(l.icon),
              span('', l.site)
            ], {
              href : l.web,
              target : '_blank',
              rel : 'noopener noreferrer'
            })
          ))
        ])
      ])// add empty project page when none are here?
    ], {
      // hidden : false,
      'data-cat' : categories.join(' '),
      'data-id' : pId,
      style: `--accent : ${accent}`}
    );
  }
}

export class ProjectCaseRenderer extends BaseRenderer {
  render(){
    return div('project-case-content', [
      div('cs-head', [
        div('card-image-container', 
          img('',[],{ src : this.data.banner, alt : this.data.title })
        ),
        div(' project-card-meta', [
          div('status-dot', span('', this.data.date ? "Completed" : "In Development")),
          span('', this.data.date)
        ]),
        h2('project-card-title', this.data.title),
        p('project-card-focus', this.data.focus),
      ]),
      this.data.case.map(c => {
        const sectionContent = Array.isArray(c.content)
          ? c.content.map(paragraph => p('section-text', paragraph))
          : [p('section-text', c.content)];

        if (c.image) {
          sectionContent.push(figure('case-diagram', [
            img('', [], { src: c.image, alt: c.imageAlt }),
            figcaption('case-image-caption', c.imageCaption)
          ]));
        }

        const caseSection = section('cs', [
          h2('section-title', c.title),
          ...sectionContent
        ]);
        caseSection.id = c.id;
        return caseSection;
      })
    ])
  }
}

export class CategoryLinksRenderer extends BaseRenderer {
  render(){
    const catId = this.data.id
    return span('btn stat-pill', [i(`ph ${this.data.icon}`), this.data.title], 
    { 
      style: `--accent: ${this.data.customColor}`,
      onClick : (e) => {
        e.stopPropagation();
        emit(e.currentTarget, APP_EVENTS.CATEGORY_LINK_CLICKED, { catId : catId })
      } })
  }
}

export class CategorySelectionRenderer extends BaseRenderer {
  fetchProjects(id, limit = 3){
    this.projects = this.options.projects.filter(project =>
      getProjectCategories(project).includes(id)
    ).slice(0, limit);
  }

  project_count(id) {
    return this.options.projects.filter(project =>
      getProjectCategories(project).includes(id)
    ).length
  }

  render(){
    this.fetchProjects(this.data.id)
    const categoryId = this.data.id

    return div('tree-group',[
      div('btn category-header',[
        div('category-header-left',[ 
          ph_icon('caret-down category-chevron'),
          div('category-icon-dot', 
            i(`ph ${this.data.icon}`)
          ),
          span('category-title', this.data.title)
        ]),
        span('category-count-badge', Math.min(3, this.project_count(this.data.id)))
      ],{
        onClick : (e) => {
          e.stopPropagation();
          emit(e.currentTarget, APP_EVENTS.CATEGORY_SELECT, 
            {
              categoryId
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
              'data-pid' : proj.id,
              onClick : (e) => { 
                e.stopPropagation();
                emit(e.currentTarget, APP_EVENTS.PROJECT_SELECT, {
                  categoryId,
                  projId : proj.id,
                })
              }
            })
          ))
        ])
      ])
    ], { 
      'data-cat' : categoryId,
      style: `--accent : ${this.data.customColor}`})
  }
}

export class CategoryDetailsPanel extends BaseRenderer {
  
  initializeButtonState(){
    if(!this.data.links.length){
      return a('btn btn-link private', [
        ph_icon('lock-key'), 
        span('', 'Private Repo')
      ])
    }
    const projLink = this.data.links[0]
    return a('btn btn-link public', [
      ph_icon(projLink.icon), 
      span('', 'Source Code')
    ],{
      href : projLink?.web ?? '',
      target : '_blank'
    })
  }

  // THis class always gets passed a single project object for display
  render(){   

    return this.options.placeholder ?  
      // placeholder
      div('placeholder-state', [
        div('placeholder-icon-wrap', ph_icon('cursor-click')),
        h3('placeholder-title', 'No Project Selected'),
        p('placeholder-text', 'Select any system project from the explorer tree on the left to inspect its details and technical specs.'),
        div('placeholder-hint-chips', this.data.hintProj.map(p => 
          button('btn quick-pick-button', [
            span('quick-pick-label' , [
              i(`ph ph-${p.icon}`), 
              p.title
            ]),
            ph_icon('arrow-right')
          ], {
            style: `--accent : ${this.options.categories.find(c => c.id === getPrimaryProjectCategory(p))?.customColor ?? 'var(--color-primary)'}`,
            onClick : (e) => {
              e.stopPropagation();
              emit(e.currentTarget, APP_EVENTS.PROJECT_SELECT, {
                categoryId : getPrimaryProjectCategory(p),
                projId : p.id,
              })
            }
          })
        ))
      ]) 
    :  // project card 
    div('home-project-card',[
      div('card-header',
          button('close-icon-btn', ph_icon('x'), 
          {
            onClick : (e) => {
              e.stopPropagation();
              emit(e.currentTarget, APP_EVENTS.PROJECT_CLOSE)
            }
          }
        )
      ),
      div('banner-wrapper', 
        img('project-image', [], { src : this.data.banner})
      ),
      div('card-content',[

        div('main-content',[
          
          div('content-left', [
            span('', [
              i(`ph ph-${this.data.icon}`),
              h2('project-title', this.data.title),
            ]),
            p('project-description', this.data.short)
          ]),
          div('content-right', [
            div('info-box',[
              div('info-item', [
                ph_icon('calendar'),
                div('info-text',[
                  span('info-label', 'Completed'),
                  span('info-value', this.data.date)
                ])
              ]),
              div('info-item', [
                i(`ph ph-${this.data.icon}`),
                div('info-text',[
                  span('info-label', 'Focus'),
                  span('info-value', 
                    span('status-text', this.data.focus)
                    ),
                  ])
                ])
            ])
          ])
        ]),
        div('content-divider'),
          div('action-buttons', [
            a('btn btn-view-project', [
              span('', 'View project'),
              ph_icon('arrow-up-right arrow-icon')
            ], {
              href : `projects.html#${this.data.id}`
            }),
            this.initializeButtonState()
          ])
      ]),
    ], { style: `--accent : ${this.options.categories.find(c => c.id === getPrimaryProjectCategory(this.data))?.customColor ?? 'var(--color-primary)'}`})
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

export class LanguageDropdownRenderer extends BaseRenderer {
  render(){
    return button('btn lang-option',[
        span('', this.data.flag),
        span('', this.data.language),
    ], {
      onClick : (e) => {
        e.stopPropagation();
        emit(e.currentTarget, APP_EVENTS.OPEN_LANGUAGE_SELECTION, { langBtn : e.currentTarget })
      }
    });
  }
}
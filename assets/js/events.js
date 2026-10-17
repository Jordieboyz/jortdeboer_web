export const APP_EVENTS = {
  // Index.js Events
  OPEN_LANGUAGE_SELECTION : 'open-language-select',

  // projects.js Events
  OPEN_SELECTION : 'open-selection',
  CLOSE_SELECTION : 'close-selection',
  SELECT_PROJECT : 'select-project',
  PROJECT_CATEGORY_SELECT: 'project-category-select',
  PROJECT_SHOW_CASE : 'project-show-case',
  
  // Home page events
  CATEGORY_SELECT: 'category-select',
  PROJECT_SELECT: 'project-select',
  PROJECT_CLOSE: 'project-close',

  CATEGORY_LINK_CLICKED : 'category-link-clicked',
  
  // About Modules events
  MODULE_TECHSTACK_SELECT_NODE :      'select-techstack-node',
  MODULE_TECHSTACK_SHIFT_LAYER :      'shift-techstack-layer',
  MODULE_TECHSTACK_CLEAR_SELECTION :  'clear-techstack-selection',

  MODULE_IDENTITY_SWITCH_PHASE :      'switch-identity-phase',

  MODULE_HOBBY_OPEN_MODAL :           'open-hobby-modal',
  MODULE_HOBBY_CLOSE_MODAL :          'close-hobby-modal',

  MODULE_EDUCATION_SELECT_NODE :      'select-edu-node',

  MODULE_GITHUB_FETCH_DATA :          'fetch-github-data',
};


export function emit(element, eventName, detail = {}) {
    element.dispatchEvent(
        new CustomEvent(eventName, {
            bubbles: true,
            detail
        })
    );
}
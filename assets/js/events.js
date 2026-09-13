export const APP_EVENTS = {
  // Home page events
  DOMAIN_SELECT: 'domain-select',
  PROJECT_SELECT: 'project-select',
  PROJECT_CLOSE: 'project-close',
  SCROLL_TO_DOMAIN : 'scroll-to-domain',
  
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
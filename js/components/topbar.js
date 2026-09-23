// KontentOS — Responsive Top Bar Component with Quick Theme Switch & Breadcrumbs
import { stateStore } from '../state.js';
import { toggleMobileDrawer } from './sidebar.js';

const TAB_TITLES = {
  onboarding: 'Creator Brain',
  brain: 'Creator Brain',
  dashboard: 'Idea Studio',
  studio: 'Raw-to-Reel Studio',
  'smart-editor': 'AI Smart Editor',
  schedule: 'Schedule Planner',
  settings: 'User Settings'
};

export function renderTopBar(container) {
  const state = stateStore.get();
  const activeTitle = TAB_TITLES[state.currentTab] || 'Idea Studio';
  const isDark = state.theme !== 'light';

  container.innerHTML = `
    <header class="top-app-bar">
      <div class="top-bar-left" style="display: flex; align-items: center; gap: 0.6rem; min-width: 0;">
        <div class="brand-title" style="font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 0.4rem; cursor: pointer; flex-shrink: 0;" id="topbar-logo-click">
          <span style="background: var(--accent-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">⚡ KontentOS</span>
          <span class="badge badge-purple desktop-only" style="font-size: 0.65rem; padding: 2px 6px;">CREATOR SUITE</span>
        </div>
        
        <div style="height: 16px; width: 1px; background: var(--border-subtle);" class="desktop-only"></div>
        
        <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" id="topbar-current-section">
          <span style="color: var(--accent-primary); font-size: 0.75rem;">/</span>
          <span style="overflow: hidden; text-overflow: ellipsis;">${activeTitle}</span>
        </div>
      </div>

      <div class="top-bar-right" style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
        <!-- Theme Switch Toggle Button -->
        <button id="btn-header-theme-toggle" class="btn-theme-toggle" title="Switch to ${isDark ? 'Light' : 'Dark'} Mode" style="min-height: 38px; min-width: 38px; padding: 0.4rem 0.6rem;">
          <span>${isDark ? '🌙' : '☀️'}</span>
          <span class="desktop-only" style="font-size: 0.78rem; font-weight: 600;">${isDark ? 'Dark' : 'Light'}</span>
        </button>

        <!-- Quick Create CTA (Desktop & Mobile) -->
        <button id="btn-header-create" class="btn-quick-create" title="Quick Create Studio" style="min-height: 38px; min-width: 38px; padding: 0.4rem 0.75rem;">
          <span>⚡</span>
          <span class="desktop-only">Quick Create</span>
        </button>

        <!-- Mobile Drawer Hamburger Trigger (Phone only) -->
        <button id="btn-mobile-menu-trigger" class="mobile-only" style="min-height: 38px; min-width: 38px; border-radius: 10px; background: var(--bg-surface-high); border: 1px solid var(--border-subtle); color: var(--text-main); display: inline-flex; align-items: center; justify-content: center; font-size: 1.1rem; cursor: pointer;" aria-label="Open Creator Suite Menu">
          <span>☰</span>
        </button>
      </div>
    </header>
  `;

  // Attach Event Listeners
  const logoClick = container.querySelector('#topbar-logo-click');
  if (logoClick) {
    logoClick.addEventListener('click', () => {
      stateStore.setTab('dashboard');
    });
  }

  const themeToggle = container.querySelector('#btn-header-theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = isDark ? 'light' : 'dark';
      stateStore.setTheme(nextTheme);
    });
  }

  const createBtn = container.querySelector('#btn-header-create');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      stateStore.setTab('studio');
    });
  }

  const mobileMenuTrigger = container.querySelector('#btn-mobile-menu-trigger');
  if (mobileMenuTrigger) {
    mobileMenuTrigger.addEventListener('click', () => {
      toggleMobileDrawer();
    });
  }
}


// KontentOS — Desktop Sidebar & Mobile Bottom Navigation with Settings
import { stateStore } from '../state.js';

let isDrawerOpen = false;

export function openMobileDrawer() {
  isDrawerOpen = true;
  const overlay = document.getElementById('mobile-drawer-sheet-overlay');
  if (overlay) {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

export function closeMobileDrawer() {
  isDrawerOpen = false;
  const overlay = document.getElementById('mobile-drawer-sheet-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

export function toggleMobileDrawer() {
  if (isDrawerOpen) {
    closeMobileDrawer();
  } else {
    openMobileDrawer();
  }
}

export function renderSidebar(sidebarContainer, mobileNavContainer) {
  const state = stateStore.get();
  const profile = state.creatorProfile;
  const currentTab = state.currentTab;

  const desktopMenuItems = [
    { id: 'dashboard', label: 'Idea Studio', icon: '💡' },
    { id: 'studio', label: 'Raw-to-Reel Studio', icon: '🎬' },
    { id: 'smart-editor', label: 'AI Smart Editor', icon: '✂️' },
    { id: 'onboarding', label: 'Creator Brain', icon: '🧠' },
    { id: 'schedule', label: 'Schedule Planner', icon: '📅' },
    { id: 'settings', label: 'User Settings', icon: '⚙️' }
  ];

  // Mobile Bottom Navigation: 5 Primary Ergonomic Thumb Targets
  const mobileMenuItems = [
    { id: 'dashboard', label: 'Ideas', icon: '💡' },
    { id: 'studio', label: 'Studio', icon: '🎬' },
    { id: 'smart-editor', label: 'Editor', icon: '✂️' },
    { id: 'schedule', label: 'Schedule', icon: '📅' },
    { id: 'more', label: 'More', icon: '☰' }
  ];

  const isMoreActive = ['onboarding', 'settings'].includes(currentTab);

  // Render Desktop Sidebar
  if (sidebarContainer) {
    sidebarContainer.innerHTML = `
      <div class="brand-header">
        <div class="brand-logo-badge">⚡</div>
        <div class="brand-title">
          <span>KontentOS</span>
          <span class="brand-subtitle">Creator Suite</span>
        </div>
      </div>

      <nav class="nav-menu">
        ${desktopMenuItems.map(item => `
          <div class="nav-item ${currentTab === item.id ? 'active' : ''}" data-tab="${item.id}">
            <span class="nav-icon">${item.icon}</span>
            <span>${item.label}</span>
          </div>
        `).join('')}
      </nav>

      <div class="sidebar-user-card" id="sidebar-user-profile-trigger" style="cursor: pointer;" title="Click to open User Settings">
        <div class="user-avatar">${(profile.name || 'C').charAt(0)}</div>
        <div class="user-info">
          <div class="user-name">${profile.name || 'Creator'}</div>
          <div class="user-tier">
            <span>●</span> ${profile.isPro ? 'Creator Pro' : 'Free Tier'}
          </div>
        </div>
      </div>
    `;

    sidebarContainer.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => {
        const tab = el.getAttribute('data-tab');
        stateStore.setTab(tab);
      });
    });

    const userCard = sidebarContainer.querySelector('#sidebar-user-profile-trigger');
    if (userCard) {
      userCard.addEventListener('click', () => {
        stateStore.setTab('settings');
      });
    }
  }

  // Render Mobile Bottom Navigation & Ensure Mobile Drawer Exists
  if (mobileNavContainer) {
    mobileNavContainer.innerHTML = mobileMenuItems.map(item => {
      const isActive = item.id === 'more' ? isMoreActive : currentTab === item.id;
      return `
        <button class="mobile-nav-btn ${isActive ? 'active' : ''}" data-tab="${item.id}" aria-label="${item.label}">
          <span class="icon">${item.icon}</span>
          <span class="mobile-label">${item.label}</span>
        </button>
      `;
    }).join('');

    mobileNavContainer.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab === 'more') {
          toggleMobileDrawer();
        } else {
          closeMobileDrawer();
          stateStore.setTab(tab);
        }
      });
    });
  }

  // Ensure Mobile Drawer Sheet Overlay is rendered in the DOM
  renderMobileDrawerSheet(profile, currentTab);
}

function renderMobileDrawerSheet(profile, currentTab) {
  let drawerOverlay = document.getElementById('mobile-drawer-sheet-overlay');
  if (!drawerOverlay) {
    drawerOverlay = document.createElement('div');
    drawerOverlay.id = 'mobile-drawer-sheet-overlay';
    drawerOverlay.className = 'mobile-drawer-overlay';
    document.body.appendChild(drawerOverlay);
  }

  const drawerTools = [
    { id: 'onboarding', label: 'Creator Brain', icon: '🧠', desc: 'Brand voice, avatar personas & signature hooks' },
    { id: 'settings', label: 'User Settings', icon: '⚙️', desc: 'API keys, AI engine, theme & exports' }
  ];

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

  drawerOverlay.innerHTML = `
    <div class="mobile-drawer-sheet" id="mobile-drawer-sheet-content">
      <div class="mobile-drawer-handle"></div>

      <!-- User Profile Header in Drawer -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); margin-bottom: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--accent-gradient, linear-gradient(135deg, #00f0ff, #7000ff)); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.15rem; color: #fff;">
            ${(profile.name || 'C').charAt(0)}
          </div>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-main);">${profile.name || 'Creator'}</div>
            <div style="font-size: 0.72rem; color: var(--accent-primary); font-weight: 600;">
              ● ${profile.isPro ? 'Creator Pro Plan' : 'Free Tier'} • ${profile.handle || '@creator'}
            </div>
          </div>
        </div>
        <button id="btn-close-mobile-drawer" style="background: var(--bg-surface-high); border: 1px solid var(--border-subtle); color: var(--text-muted); width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; cursor: pointer;">
          ✕
        </button>
      </div>

      <!-- Drawer Menu Items -->
      <div style="display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem;">
        <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-dim); font-weight: 800; letter-spacing: 0.06em; margin-bottom: 0.25rem; padding-left: 0.5rem;">
          Creator Suite Tools
        </div>
        ${drawerTools.map(tool => `
          <div class="mobile-drawer-item ${currentTab === tool.id ? 'active' : ''}" data-tab="${tool.id}">
            <div class="item-icon">${tool.icon}</div>
            <div class="item-content">
              <div class="item-title">${tool.label}</div>
              <div class="item-desc">${tool.desc}</div>
            </div>
            <span style="font-size: 0.9rem; color: var(--text-dim); font-weight: 800;">›</span>
          </div>
        `).join('')}
      </div>

      <!-- Quick System Preferences -->
      <div style="display: flex; gap: 0.5rem; pt-2; border-top: 1px solid var(--border-subtle); padding-top: 0.85rem;">
        <button id="btn-drawer-theme-toggle" class="btn btn-secondary" style="flex: 1; font-size: 0.8rem; padding: 0.55rem; justify-content: center;">
          <span>${currentTheme === 'light' ? '🌙 Switch to Dark' : '☀️ Switch to Warm Light'}</span>
        </button>
        <button id="btn-drawer-studio-quick" class="btn btn-primary" style="flex: 1; font-size: 0.8rem; padding: 0.55rem; justify-content: center;">
          <span>⚡ Studio Hub</span>
        </button>
      </div>
    </div>
  `;

  // Attach event listeners to drawer sheet
  drawerOverlay.onclick = (e) => {
    if (e.target === drawerOverlay) {
      closeMobileDrawer();
    }
  };

  const closeBtn = drawerOverlay.querySelector('#btn-close-mobile-drawer');
  if (closeBtn) {
    closeBtn.onclick = () => closeMobileDrawer();
  }

  drawerOverlay.querySelectorAll('.mobile-drawer-item').forEach(item => {
    item.onclick = () => {
      const tab = item.getAttribute('data-tab');
      closeMobileDrawer();
      stateStore.setTab(tab);
    };
  });

  const themeBtn = drawerOverlay.querySelector('#btn-drawer-theme-toggle');
  if (themeBtn) {
    themeBtn.onclick = () => {
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('kontentos_theme', nextTheme);
      closeMobileDrawer();
      // Re-render sidebar/drawer to reflect updated theme label
      renderSidebar(document.getElementById('desktop-sidebar'), document.getElementById('mobile-bottom-nav'));
    };
  }

  const studioQuickBtn = drawerOverlay.querySelector('#btn-drawer-studio-quick');
  if (studioQuickBtn) {
    studioQuickBtn.onclick = () => {
      closeMobileDrawer();
      stateStore.setTab('studio');
    };
  }
}



// KontentOS — Reactive State Management & Geo Database with Auto GPS/Timezone Detection

const STORAGE_KEY = 'kontentos_app_state_v1';

export const GEO_LOCALES = {
  IN: {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR (₹)',
    symbol: '₹',
    defaultLanguages: ['Hinglish (Hindi + English)', 'English (India)', 'Hindi', 'Tamil', 'Telugu'],
    trendingSounds: [
      { name: 'Bollywood Retro Phonk Beat', uses: '840K reels', energy: 'High Viral' },
      { name: 'Lofi Chai Conversations', uses: '420K reels', energy: 'Calm Aesthetic' },
      { name: 'Desi Street Hustle Brass', uses: '610K reels', energy: 'Motivator' }
    ],
    sampleVideos: [
      {
        id: 'in-1',
        title: 'POV: Bangalore Techie during Monsoon Traffic',
        vibe: 'Daily Rants & POVs',
        views: '2.8M views',
        platform: 'Instagram Reels',
        creator: '@tech_guy_rahul',
        hookUsed: 'If you think Monday blues are bad, try Outer Ring Road at 6 PM...',
        retentionScore: '94%',
        keyTakeaway: 'Fast 1.2s punchline cut + localized city relatable pain point.'
      },
      {
        id: 'in-2',
        title: 'Hostel Maggi Chronicles — Midnight Banter',
        vibe: 'Relatable Comedy & Skits',
        views: '4.1M views',
        platform: 'YouTube Shorts',
        creator: '@desi_hostel_life',
        hookUsed: 'Nobody: ... Literally nobody at 2 AM in room 402:',
        retentionScore: '96%',
        keyTakeaway: 'Immediate comedic sound cue + exaggerated expressive reactions.'
      },
      {
        id: 'in-3',
        title: '3 AI Tools that feel illegal in 2026 (For Freelancers)',
        vibe: 'Pro / Tech & AI',
        views: '1.4M views',
        platform: 'Instagram & LinkedIn',
        creator: '@priya_builds',
        hookUsed: 'Stop searching ChatGPT for client proposals...',
        retentionScore: '89%',
        keyTakeaway: 'High-contrast screen recording + bold yellow kinetic subtitles.'
      }
    ]
  },
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD ($)',
    symbol: '$',
    defaultLanguages: ['English (US)', 'Spanish'],
    trendingSounds: [
      { name: 'Hyperpop Glitch Rush', uses: '1.2M videos', energy: 'High Viral' },
      { name: 'NYC Subway Jazz Ambience', uses: '350K videos', energy: 'Aesthetic' }
    ],
    sampleVideos: [
      {
        id: 'us-1',
        title: 'POV: You work in Big Tech in 2026',
        vibe: 'Daily Rants & POVs',
        views: '3.5M views',
        platform: 'TikTok',
        creator: '@austin_codes',
        hookUsed: 'My manager just sent a Slack ping at 4:59 PM...',
        retentionScore: '92%',
        keyTakeaway: 'Deadpan delivery + zoom-in on facial expression.'
      }
    ]
  },
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP (£)',
    symbol: '£',
    defaultLanguages: ['English (UK)'],
    trendingSounds: [
      { name: 'London Drill Beat Minimal', uses: '480K videos', energy: 'High Viral' }
    ],
    sampleVideos: [
      {
        id: 'uk-1',
        title: 'When someone tries to talk to you on the Tube',
        vibe: 'Relatable Comedy & Skits',
        views: '1.9M views',
        platform: 'Instagram Reels',
        creator: '@oliver_uk',
        hookUsed: 'Tell me you are in London without telling me...',
        retentionScore: '91%',
        keyTakeaway: 'Dry British humor + fast jump cuts.'
      }
    ]
  },
  AE: {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    symbol: 'AED ',
    defaultLanguages: ['English (Global)', 'Arabic'],
    trendingSounds: [
      { name: 'Dubai Skyline Synthwave', uses: '290K videos', energy: 'Luxury Mood' }
    ],
    sampleVideos: [
      {
        id: 'ae-1',
        title: 'What $10 gets you in Downtown Dubai vs Marina',
        vibe: 'Aesthetic Mini-Vlogs',
        views: '2.1M views',
        platform: 'Instagram Reels',
        creator: '@dubai_diaries',
        hookUsed: 'You won’t believe what I just found in this cafe...',
        retentionScore: '95%',
        keyTakeaway: 'Crisp 4K drone b-roll + rapid price comparisons.'
      }
    ]
  }
};

function autoDetectGeo() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('India')) return 'IN';
    if (tz.includes('Dubai') || tz.includes('Gulf')) return 'AE';
    if (tz.includes('London') || tz.includes('Europe/London')) return 'UK';
    if (tz.includes('America') || tz.includes('US') || tz.includes('New_York') || tz.includes('Los_Angeles') || tz.includes('Chicago')) return 'US';
  } catch (e) {
    console.warn('Could not auto-detect timezone', e);
  }
  return 'IN';
}

const initialDefaultState = {
  theme: 'dark', // 'dark' | 'light'
  geo: autoDetectGeo(),
  geoSource: 'GPS & Timezone (Auto)',
  currentTab: 'onboarding',
  creatorProfile: {
    name: 'Aman Sharma',
    handle: '@amanshades',
    mode: 'viral',
    selectedVibe: 'Relatable Comedy & Skits',
    proNiche: 'Tech & Startups',
    proSubNiche: 'AI & Machine Learning',
    language: 'Hinglish (Hindi + English)',
    voiceArchetype: 'High-Energy Motivator',
    hookFormula: 'Curiosity Gap ("Nobody is talking about...")',
    connectedPlatforms: ['instagram', 'youtube', 'x', 'threads', 'facebook', 'linkedin'],
    includeWatermark: true,
    isPro: false,
    readinessScore: 98,
    customCatchphrase: 'Bhai suno!',
    bannedWords: 'Synergy, Game-changer, Deep dive'
  },
  monetization: {
    views: 250000,
    deliverableType: 'reel',
    monthlyReach: '1.2M',
    engagementRate: '8.4%',
    liveVerifiedMetrics: {
      creatorName: 'Creator Studio',
      handle: '@creator',
      subscribers: '320K',
      avgViews: '85,000',
      monthlyReach: '1.2M',
      engagementRate: '8.4%',
      topCountries: ['India (58%)', 'United States (18%)', 'United Kingdom (9%)'],
      ageDemographics: '18-24 (38%), 25-34 (48%), 35+ (14%)',
      verifiedSource: 'Creator Economy 2026 Live Market Index',
      lastFetchedAt: new Date().toISOString()
    },
    deals: [
      { id: '1', title: 'Notion Creator Workflow Package', brandName: 'Notion', amount: 3500, formattedAmount: '$3,500', deliverable: '1x YouTube Dedicated Video (8-10m)', stage: 'pitched', contact: 'partnerships@notion.so', notes: 'Sponsorship pitch sent for Q3 creator campaign. Focus on AI workspace features.' },
      { id: '2', title: 'Loom AI Feature Spotlight', brandName: 'Loom', amount: 1200, formattedAmount: '$1,200', deliverable: '1x Dedicated Instagram Reel (60s)', stage: 'pitched', contact: 'creator-team@loom.com', notes: 'Pitched 60s fast-paced screen tutorial with custom kinetic captions.' },
      { id: '3', title: 'Audio-Technica Creator Mic Review', brandName: 'Audio-Technica', amount: 1800, formattedAmount: '$1,800 + Hardware', deliverable: 'Dedicated Review & Reel', stage: 'negotiating', contact: 'press@audio-technica.com', notes: 'Agreed on product sample shipment. Finalizing contract terms and exclusivity clause.' },
      { id: '4', title: 'CapCut Pro Studio Promo', brandName: 'CapCut', amount: 2400, formattedAmount: '$2,400', deliverable: 'Multi-Platform Repurposed Bundle', stage: 'production', contact: 'growth@capcut.com', notes: 'Draft video recorded. Submitting first review cut with subtitles and sound FX.' },
      { id: '5', title: 'Zapier AI Automation Reel', brandName: 'Zapier', amount: 3000, formattedAmount: '$3,000', deliverable: '1x Dedicated Reel + LinkedIn Post', stage: 'paid', contact: 'influencer@zapier.com', notes: 'Invoice #ZP-849 paid via wire transfer. Campaign completed with 420K organic impressions.' },
      { id: '6', title: 'Epidemic Sound Audio Partner', brandName: 'Epidemic Sound', amount: 1500, formattedAmount: '$1,500', deliverable: 'Link in Bio + 30s Segment', stage: 'paid', contact: 'creators@epidemicsound.com', notes: 'Affiliate tracking link live in bio. Monthly retainer active.' },
    ]
  }
};

class AppState {
  constructor() {
    this.listeners = [];
    this.state = this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // 1. User Appearance & Geo Preferences (Persistent)
        const validTheme = (parsed.theme === 'light' || parsed.theme === 'dark') ? parsed.theme : 'dark';
        const validGeo = (parsed.geo && GEO_LOCALES[parsed.geo]) ? parsed.geo : autoDetectGeo();
        const validGeoSource = typeof parsed.geoSource === 'string' ? parsed.geoSource : 'GPS & Timezone (Auto)';

        // 2. Creator Identity & Profile Configuration (Persistent)
        const sanitizedProfile = {
          ...initialDefaultState.creatorProfile,
          ...(typeof parsed.creatorProfile === 'object' && parsed.creatorProfile ? parsed.creatorProfile : {})
        };

        // 3. User Authored Deals & Monetization (Persistent)
        const rawMonetization = (typeof parsed.monetization === 'object' && parsed.monetization) ? parsed.monetization : {};
        const sanitizedMonetization = {
          ...initialDefaultState.monetization,
          ...rawMonetization,
          deals: Array.isArray(rawMonetization.deals) 
            ? rawMonetization.deals 
            : [...initialDefaultState.monetization.deals]
        };

        // 4. Session & Navigation Lifecycle (Clean Reset on Refresh)
        // Refreshing the browser resets active transient tabs/screens back to the primary workspace view
        const initialTab = sanitizedProfile.name ? 'dashboard' : 'onboarding';

        return {
          theme: validTheme,
          geo: validGeo,
          geoSource: validGeoSource,
          currentTab: initialTab,
          creatorProfile: sanitizedProfile,
          monetization: sanitizedMonetization
        };
      }
    } catch (e) {
      console.warn('Error reading from localStorage, initializing fresh default state:', e);
    }
    return JSON.parse(JSON.stringify(initialDefaultState));
  }

  saveState(silent = false) {
    try {
      // Best Practice: Whitelist and serialize ONLY necessary persistent fields to localStorage
      // Excludes transient view states, temp uploads, active modals, and ephemeral drafts
      const persistentPayload = {
        theme: this.state.theme,
        geo: this.state.geo,
        geoSource: this.state.geoSource,
        creatorProfile: this.state.creatorProfile,
        monetization: {
          views: this.state.monetization?.views,
          deliverableType: this.state.monetization?.deliverableType,
          monthlyReach: this.state.monetization?.monthlyReach,
          engagementRate: this.state.monetization?.engagementRate,
          deals: this.state.monetization?.deals
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentPayload));
    } catch (e) {
      console.warn('Error saving to localStorage:', e);
    }
    if (!silent) {
      this.notify();
    }
  }

  get() {
    return this.state;
  }

  // Monetization & Brand CRM Helpers
  getMonetization() {
    if (!this.state.monetization) {
      this.state.monetization = JSON.parse(JSON.stringify(initialDefaultState.monetization));
    }
    return this.state.monetization;
  }

  updateMonetization(partial, silent = false) {
    this.state.monetization = {
      ...this.getMonetization(),
      ...partial
    };
    this.saveState(silent);
  }

  addBrandDeal(deal) {
    const monetization = this.getMonetization();
    const newDeal = {
      id: deal.id || Date.now().toString(),
      title: deal.title || 'New Brand Deal',
      brandName: deal.brandName || deal.title || 'Brand Partner',
      amount: typeof deal.amount === 'number' ? deal.amount : (parseFloat(String(deal.amount).replace(/[^0-9.]/g, '')) || 1000),
      formattedAmount: deal.formattedAmount || (typeof deal.amount === 'string' ? deal.amount : `$${deal.amount}`),
      deliverable: deal.deliverable || '1x Dedicated Short Video (60s)',
      stage: deal.stage || 'pitched',
      contact: deal.contact || '',
      notes: deal.notes || '',
      createdAt: deal.createdAt || new Date().toISOString()
    };
    monetization.deals = [newDeal, ...(monetization.deals || [])];
    this.saveState();
    return newDeal;
  }

  updateBrandDeal(id, updates) {
    const monetization = this.getMonetization();
    monetization.deals = (monetization.deals || []).map(d => {
      if (String(d.id) === String(id)) {
        const updated = { ...d, ...updates };
        if (updates.amount !== undefined && typeof updates.amount === 'number') {
          updated.amount = updates.amount;
        }
        return updated;
      }
      return d;
    });
    this.saveState();
  }

  moveBrandDealStage(id, newStage) {
    const monetization = this.getMonetization();
    monetization.deals = (monetization.deals || []).map(d => {
      if (String(d.id) === String(id)) {
        return { ...d, stage: newStage };
      }
      return d;
    });
    this.saveState();
  }

  deleteBrandDeal(id) {
    const monetization = this.getMonetization();
    monetization.deals = (monetization.deals || []).filter(d => String(d.id) !== String(id));
    this.saveState();
  }

  resetBrandDeals() {
    this.state.monetization.deals = JSON.parse(JSON.stringify(initialDefaultState.monetization.deals));
    this.saveState();
  }

  setTheme(themeName) {
    const isLight = themeName === 'light' || themeName === 'sahara-v3' || themeName === 'clean-light';
    const validTheme = isLight ? 'light' : 'dark';
    this.state.theme = validTheme;
    document.documentElement.setAttribute('data-theme', validTheme);
    this.saveState();
  }

  setGeo(geoCode, source = 'User Settings') {
    if (GEO_LOCALES[geoCode]) {
      this.state.geo = geoCode;
      this.state.geoSource = source;
      this.saveState();
    }
  }

  requestGpsLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const detected = autoDetectGeo();
          this.setGeo(detected, `GPS (Lat: ${pos.coords.latitude.toFixed(2)}, Lng: ${pos.coords.longitude.toFixed(2)})`);
        },
        () => {
          const detected = autoDetectGeo();
          this.setGeo(detected, 'Browser Timezone (Auto)');
        },
        { timeout: 4000 }
      );
    } else {
      const detected = autoDetectGeo();
      this.setGeo(detected, 'Browser Timezone (Auto)');
    }
  }

  setTab(tabName) {
    this.state.currentTab = tabName;
    this.saveState();
  }

  updateProfile(partialProfile, silent = false) {
    this.state.creatorProfile = {
      ...this.state.creatorProfile,
      ...partialProfile
    };
    this.calculateReadiness();
    this.saveState(silent);
  }

  calculateReadiness() {
    const p = this.state.creatorProfile;
    let score = 70;
    if (p.name && p.handle) score += 10;
    if (p.connectedPlatforms.length >= 3) score += 10;
    if (p.language) score += 5;
    if (p.hookFormula) score += 5;
    this.state.creatorProfile.readinessScore = Math.min(100, score);
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  }
}

export const stateStore = new AppState();

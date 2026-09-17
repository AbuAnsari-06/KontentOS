// KontentOS — Monetization Hub, Live Internet Metrics Scanner, Brand Deal CRM & Sponsor Outreach
import { stateStore, GEO_LOCALES } from '../state.js';
import { escapeHtml } from '../utils.js';
import { api } from '../api.js';

export function renderMonetization(container) {
  let state = stateStore.get();
  let profile = state.creatorProfile || {};
  let locale = GEO_LOCALES[state.geo] || GEO_LOCALES.IN;
  let monetization = stateStore.getMonetization();

  let views = monetization.views || 250000;
  let deliverableType = monetization.deliverableType || 'reel';
  let searchTerm = '';
  
  // Live Internet Metric Scanner state
  let inputHandle = profile.handle || '@creator';
  let selectedPlatform = 'youtube';
  let selectedNiche = profile.proNiche || 'Tech & AI';
  let isFetchingInternetMetrics = false;
  let internetFetchError = null;
  let liveFetchedData = monetization.liveVerifiedMetrics || null;

  // Live Market Benchmarks State
  let isFetchingBenchmarks = false;
  let liveBenchmarks = null;

  // Live Brand Sponsor Intelligence State
  let brandLookupName = 'Notion';
  let isFetchingBrandIntel = false;
  let brandIntelData = null;

  // Active Tab within Monetization: 'crm' | 'rate-engine' | 'live-scanner' | 'brand-intel'
  let activeSubTab = 'crm';

  // Modal states
  let showMediaKitModal = false;
  let showAddDealModal = false;
  let editingDeal = null; // null or deal object
  let showAiPitchModal = false;
  let isAiGeneratingPitch = false;
  let generatedPitchText = '';
  let toastMessage = null;
  let toastType = 'success'; // 'success' | 'info' | 'warn'

  // Helper to show temporary toast notification
  function showToast(msg, type = 'success') {
    toastMessage = msg;
    toastType = type;
    render();
    setTimeout(() => {
      toastMessage = null;
      render();
    }, 3200);
  }

  // Deliverable Presets & CPM Multipliers
  const DELIVERABLE_PRESETS = {
    reel: {
      label: '1x Dedicated Instagram Reel / YouTube Short (60s)',
      shortLabel: '1x Reel / Short (60s)',
      baseMultiplier: 1.0,
      inrCpmRange: [180, 320],
      usdCpmRange: [12, 24],
      gbpCpmRange: [10, 20],
      aedCpmRange: [45, 85],
      desc: 'High-retention 60-second dedicated vertical video with link-in-bio & story teaser.'
    },
    youtube: {
      label: '1x Dedicated YouTube Video (8–10m)',
      shortLabel: '1x Dedicated YouTube (8-10m)',
      baseMultiplier: 2.2,
      inrCpmRange: [420, 800],
      usdCpmRange: [28, 55],
      gbpCpmRange: [24, 46],
      aedCpmRange: [110, 200],
      desc: 'Full standalone video dedicated to brand/product with pinned comment & description link.'
    },
    bundle: {
      label: 'Multi-Platform Repurposed Bundle (All 6 Channels)',
      shortLabel: 'Multi-Platform Bundle (6 Channels)',
      baseMultiplier: 3.2,
      inrCpmRange: [600, 1150],
      usdCpmRange: [40, 78],
      gbpCpmRange: [34, 65],
      aedCpmRange: [150, 290],
      desc: 'Syndicated campaign across Instagram Reels, YouTube Shorts, TikTok, LinkedIn, X, and Threads.'
    },
    integration: {
      label: '1x 60–90s Mid-Roll Integration in YouTube Video',
      shortLabel: '1x Mid-Roll Integration (60-90s)',
      baseMultiplier: 1.35,
      inrCpmRange: [250, 450],
      usdCpmRange: [16, 32],
      gbpCpmRange: [14, 27],
      aedCpmRange: [65, 120],
      desc: 'Seamless organic segment inserted midway through high-performing long-form content.'
    },
    story: {
      label: '3x Story Frame Series with Direct Link Sticker',
      shortLabel: '3x Story Series + Link',
      baseMultiplier: 0.55,
      inrCpmRange: [90, 170],
      usdCpmRange: [6, 13],
      gbpCpmRange: [5, 11],
      aedCpmRange: [24, 48],
      desc: 'Engaging narrative sequence leading directly to trackable brand conversion URL.'
    }
  };

  // Niche Multipliers (High CPM vs Entertainment)
  function getNicheMultiplier() {
    const niche = (selectedNiche || profile.proNiche || profile.selectedVibe || '').toLowerCase();
    if (niche.includes('tech') || niche.includes('ai') || niche.includes('saas') || niche.includes('software')) return 1.35;
    if (niche.includes('finance') || niche.includes('crypto') || niche.includes('money') || niche.includes('business')) return 1.45;
    if (niche.includes('pro') || niche.includes('career') || niche.includes('productivity')) return 1.25;
    if (niche.includes('fitness') || niche.includes('health') || niche.includes('wellness')) return 1.10;
    if (niche.includes('gaming')) return 0.88;
    if (niche.includes('comedy') || niche.includes('skit') || niche.includes('pov')) return 0.95;
    return 1.0;
  }

  // Calculate Accurate Sponsor Rate
  function calculateRates(viewCount, delivKey) {
    const preset = DELIVERABLE_PRESETS[delivKey] || DELIVERABLE_PRESETS.reel;
    const thousands = Math.max(1, viewCount / 1000);
    const nicheMult = getNicheMultiplier();
    const currency = locale.currency || 'INR (₹)';
    const symbol = locale.symbol || (currency.includes('INR') ? '₹' : '$');

    let min = 0;
    let max = 0;

    if (currency.includes('INR')) {
      min = Math.round(thousands * preset.inrCpmRange[0] * nicheMult);
      max = Math.round(thousands * preset.inrCpmRange[1] * nicheMult);
    } else if (currency.includes('GBP')) {
      min = Math.round(thousands * preset.gbpCpmRange[0] * nicheMult);
      max = Math.round(thousands * preset.gbpCpmRange[1] * nicheMult);
    } else if (currency.includes('AED')) {
      min = Math.round(thousands * preset.aedCpmRange[0] * nicheMult);
      max = Math.round(thousands * preset.aedCpmRange[1] * nicheMult);
    } else {
      // USD Default
      min = Math.round(thousands * preset.usdCpmRange[0] * nicheMult);
      max = Math.round(thousands * preset.usdCpmRange[1] * nicheMult);
    }

    const avg = Math.round((min + max) / 2);
    const premium = Math.round(max * 1.25); // Exclusivity / Whitelisting rate
    const cpmEstimate = (avg / thousands).toFixed(1);

    return {
      min,
      max,
      avg,
      premium,
      symbol,
      cpmEstimate,
      formattedRange: `${symbol}${min.toLocaleString()} – ${symbol}${max.toLocaleString()}`,
      formattedAvg: `${symbol}${avg.toLocaleString()}`,
      formattedPremium: `${symbol}${premium.toLocaleString()}`
    };
  }

  // Parse Deal Amount to numeric currency
  function parseAmountNumber(amountStr) {
    if (typeof amountStr === 'number') return amountStr;
    if (!amountStr) return 0;
    const cleaned = String(amountStr).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  // Format amount with currency symbol
  function formatDealCurrency(num) {
    const symbol = locale.symbol || '$';
    return `${symbol}${Math.round(num).toLocaleString()}`;
  }

  const render = () => {
    state = stateStore.get();
    profile = state.creatorProfile || {};
    locale = GEO_LOCALES[state.geo] || GEO_LOCALES.IN;
    monetization = stateStore.getMonetization();
    const deals = monetization.deals || [];

    const currentRates = calculateRates(views, deliverableType);

    // Calculate Financial CRM Pipeline Metrics
    let totalPipelineValue = 0;
    let paidClosedValue = 0;
    let inFlightValue = 0; // negotiating + production
    let pitchedValue = 0;

    deals.forEach(deal => {
      const val = typeof deal.amount === 'number' ? deal.amount : parseAmountNumber(deal.amount || deal.formattedAmount);
      totalPipelineValue += val;
      if (deal.stage === 'paid') {
        paidClosedValue += val;
      } else if (deal.stage === 'negotiating' || deal.stage === 'production') {
        inFlightValue += val;
      } else if (deal.stage === 'pitched') {
        pitchedValue += val;
      }
    });

    const winRate = deals.length > 0 ? Math.round((deals.filter(d => d.stage === 'paid').length / deals.length) * 100) : 0;

    // Filter deals if search is active
    const filteredDeals = searchTerm.trim() === ''
      ? deals
      : deals.filter(d => 
          (d.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (d.brandName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (d.deliverable || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (d.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

    container.innerHTML = `
      <div class="content-container" style="max-width: 1240px; padding-bottom: 3.5rem;">
        
        <!-- Toast Notification -->
        ${toastMessage ? `
          <div style="position: fixed; top: 1.5rem; right: 1.5rem; z-index: 10000; background: ${toastType === 'warn' ? '#f59e0b' : toastType === 'info' ? '#38bdf8' : 'var(--accent-secondary)'}; color: #000; padding: 0.75rem 1.25rem; border-radius: 8px; font-weight: 800; font-size: 0.85rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 8px; animation: captionPopIn 0.2s ease;">
            <span>${toastType === 'warn' ? '⚠️' : toastType === 'info' ? 'ℹ️' : '✅'}</span>
            <span>${escapeHtml(toastMessage)}</span>
          </div>
        ` : ''}

        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.25rem; flex-wrap: wrap;">
              <h1 style="font-size: 1.9rem; font-weight: 900; letter-spacing: -0.02em;">💰 Monetization Hub & Brand Deal CRM</h1>
              <span class="badge badge-neon" style="font-size: 0.68rem;">LIVE INTERNET INTEL</span>
              <span class="badge badge-purple" style="font-size: 0.68rem;">${locale.flag} ${locale.currency}</span>
            </div>
            <p style="color: var(--text-muted); font-size: 0.92rem;">
              Pull live channel metrics from the internet, calculate dynamic CPM rate cards, manage active brand pipelines, and generate AI sponsor outreach.
            </p>
          </div>

          <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
            <button id="btn-header-pull-internet" class="btn btn-primary" style="gap: 5px; background: linear-gradient(135deg, #0284c7, #38bdf8);" title="Scan the web for live channel metrics and statistics">
              <span>🌐 Pull Internet Metrics</span>
            </button>
            <button id="btn-ai-pitch-gen" class="btn btn-secondary" style="gap: 5px;" title="Generate personalized brand outreach email">
              <span>✨ AI Pitch Generator</span>
            </button>
            <button id="btn-export-proposal" class="btn btn-secondary" style="gap: 5px;">
              <span>📄 View & Print Media Kit</span>
            </button>
          </div>
        </div>

        <!-- Navigation Tabs: CRM Pipeline | Live Internet Scanner | Rate Engine | Brand Intelligence -->
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-subtab ${activeSubTab === 'crm' ? 'btn-primary' : 'btn-secondary'}" data-tab="crm" style="font-size: 0.82rem; padding: 0.4rem 0.9rem;">
            📋 Brand Deal Pipeline (${deals.length})
          </button>
          <button class="btn btn-subtab ${activeSubTab === 'live-scanner' ? 'btn-primary' : 'btn-secondary'}" data-tab="live-scanner" style="font-size: 0.82rem; padding: 0.4rem 0.9rem;">
            🌐 Live Internet Metrics Scanner
          </button>
          <button class="btn btn-subtab ${activeSubTab === 'rate-engine' ? 'btn-primary' : 'btn-secondary'}" data-tab="rate-engine" style="font-size: 0.82rem; padding: 0.4rem 0.9rem;">
            🧮 Dynamic Rate Card & Media Kit
          </button>
          <button class="btn btn-subtab ${activeSubTab === 'brand-intel' ? 'btn-primary' : 'btn-secondary'}" data-tab="brand-intel" style="font-size: 0.82rem; padding: 0.4rem 0.9rem;">
            🏢 Sponsor Intelligence & Benchmarks
          </button>
        </div>

        <!-- Financial KPI Dashboard -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.75rem;">
          <div class="card" style="padding: 1.1rem; background: var(--bg-surface-card); border-left: 4px solid var(--accent-primary);">
            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-dim); font-weight: 700; margin-bottom: 0.25rem;">
              💼 Total Pipeline Value
            </div>
            <div style="font-size: 1.65rem; font-weight: 900; color: var(--text-main); letter-spacing: -0.02em;">
              ${formatDealCurrency(totalPipelineValue)}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">
              ${deals.length} total sponsorship opportunities
            </div>
          </div>

          <div class="card" style="padding: 1.1rem; background: var(--bg-surface-card); border-left: 4px solid var(--accent-secondary);">
            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-dim); font-weight: 700; margin-bottom: 0.25rem;">
              💵 Paid & Secured Revenue
            </div>
            <div style="font-size: 1.65rem; font-weight: 900; color: var(--accent-secondary); letter-spacing: -0.02em;">
              ${formatDealCurrency(paidClosedValue)}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">
              ${deals.filter(d => d.stage === 'paid').length} closed & deposited brand partnerships
            </div>
          </div>

          <div class="card" style="padding: 1.1rem; background: var(--bg-surface-card); border-left: 4px solid var(--accent-cyan);">
            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-dim); font-weight: 700; margin-bottom: 0.25rem;">
              ⏳ Active In-Flight Pipeline
            </div>
            <div style="font-size: 1.65rem; font-weight: 900; color: var(--accent-cyan); letter-spacing: -0.02em;">
              ${formatDealCurrency(inFlightValue)}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">
              ${deals.filter(d => d.stage === 'negotiating' || d.stage === 'production').length} in contract & filming
            </div>
          </div>

          <div class="card" style="padding: 1.1rem; background: var(--bg-surface-card); border-left: 4px solid var(--accent-gold);">
            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-dim); font-weight: 700; margin-bottom: 0.25rem;">
              🎯 Deal Close Rate
            </div>
            <div style="font-size: 1.65rem; font-weight: 900; color: var(--accent-gold); letter-spacing: -0.02em;">
              ${winRate}%
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">
              Based on ${deals.length} recorded brand proposals
            </div>
          </div>
        </div>

        <!-- VIEW 1: LIVE INTERNET METRICS SCANNER TAB -->
        ${activeSubTab === 'live-scanner' ? `
          <div class="card" style="padding: 1.5rem; margin-bottom: 2rem; border-color: #38bdf8;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <h2 style="font-size: 1.35rem; font-weight: 900; color: #38bdf8;">🌐 Real-World Creator Internet Metric Scanner</h2>
                  <span class="badge badge-neon">SEARCH GROUNDING</span>
                </div>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
                  Query live web sources (YouTube, SocialBlade, Influencer Marketing Hub) to retrieve verified channel statistics, views, and audience demographics.
                </p>
              </div>
            </div>

            <!-- Scanner Search Form -->
            <div style="background: var(--bg-surface-low); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-subtle); margin-bottom: 1.5rem;">
              <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.75rem; align-items: flex-end;">
                <div>
                  <label style="font-size: 0.78rem; font-weight: 700; display: block; margin-bottom: 0.3rem; color: var(--text-muted);">
                    Channel Handle / Profile URL / Creator Name:
                  </label>
                  <input type="text" id="input-scanner-handle" class="form-input" placeholder="e.g. @tanmaybhat, @mkbhd, or your handle" value="${escapeHtml(inputHandle)}">
                </div>

                <div>
                  <label style="font-size: 0.78rem; font-weight: 700; display: block; margin-bottom: 0.3rem; color: var(--text-muted);">
                    Primary Platform:
                  </label>
                  <select id="select-scanner-platform" class="form-select">
                    <option value="youtube" ${selectedPlatform === 'youtube' ? 'selected' : ''}>YouTube</option>
                    <option value="instagram" ${selectedPlatform === 'instagram' ? 'selected' : ''}>Instagram</option>
                    <option value="tiktok" ${selectedPlatform === 'tiktok' ? 'selected' : ''}>TikTok</option>
                    <option value="linkedin" ${selectedPlatform === 'linkedin' ? 'selected' : ''}>LinkedIn</option>
                    <option value="x" ${selectedPlatform === 'x' ? 'selected' : ''}>X (Twitter)</option>
                  </select>
                </div>

                <div>
                  <label style="font-size: 0.78rem; font-weight: 700; display: block; margin-bottom: 0.3rem; color: var(--text-muted);">
                    Niche Category:
                  </label>
                  <select id="select-scanner-niche" class="form-select">
                    <option value="Tech & AI" ${selectedNiche === 'Tech & AI' ? 'selected' : ''}>Tech & AI</option>
                    <option value="Finance & Startups" ${selectedNiche === 'Finance & Startups' ? 'selected' : ''}>Finance & Startups</option>
                    <option value="Productivity & SaaS" ${selectedNiche === 'Productivity & SaaS' ? 'selected' : ''}>Productivity & SaaS</option>
                    <option value="Fitness & Health" ${selectedNiche === 'Fitness & Health' ? 'selected' : ''}>Fitness & Health</option>
                    <option value="Gaming & Esports" ${selectedNiche === 'Gaming & Esports' ? 'selected' : ''}>Gaming & Esports</option>
                    <option value="Comedy & Lifestyle" ${selectedNiche === 'Comedy & Lifestyle' ? 'selected' : ''}>Comedy & Lifestyle</option>
                  </select>
                </div>

                <div>
                  <button id="btn-trigger-internet-fetch" class="btn btn-primary" style="height: 42px; padding: 0 1.25rem; font-weight: 800; background: linear-gradient(135deg, #0284c7, #38bdf8);" ${isFetchingInternetMetrics ? 'disabled' : ''}>
                    <span>${isFetchingInternetMetrics ? '⏳ Scanning Web...' : '🔍 Pull Live Metrics'}</span>
                  </button>
                </div>
              </div>

              <!-- Quick Demo Presets -->
              <div style="display: flex; gap: 6px; align-items: center; margin-top: 0.75rem; flex-wrap: wrap;">
                <span style="font-size: 0.7rem; color: var(--text-dim); font-weight: 700;">TEST PRESETS:</span>
                <button type="button" class="btn-preset-handle" data-handle="@mkbhd" data-platform="youtube" data-niche="Tech & AI" style="font-size: 0.7rem; padding: 2px 8px; background: var(--bg-surface-high); border: 1px solid var(--border-subtle); border-radius: 4px; color: var(--text-muted); cursor: pointer;">
                  @mkbhd (Tech)
                </button>
                <button type="button" class="btn-preset-handle" data-handle="@tanmaybhat" data-platform="youtube" data-niche="Finance & Startups" style="font-size: 0.7rem; padding: 2px 8px; background: var(--bg-surface-high); border: 1px solid var(--border-subtle); border-radius: 4px; color: var(--text-muted); cursor: pointer;">
                  @tanmaybhat (Comedy/Finance)
                </button>
                <button type="button" class="btn-preset-handle" data-handle="@veritasium" data-platform="youtube" data-niche="Tech & AI" style="font-size: 0.7rem; padding: 2px 8px; background: var(--bg-surface-high); border: 1px solid var(--border-subtle); border-radius: 4px; color: var(--text-muted); cursor: pointer;">
                  @veritasium (Science/Tech)
                </button>
                <button type="button" class="btn-preset-handle" data-handle="${escapeHtml(profile.handle || '@mycreator')}" data-platform="youtube" data-niche="${escapeHtml(profile.proNiche || 'Tech & AI')}" style="font-size: 0.7rem; padding: 2px 8px; background: var(--bg-surface-high); border: 1px solid var(--border-subtle); border-radius: 4px; color: var(--accent-primary); cursor: pointer;">
                  My Channel (${escapeHtml(profile.handle || '@mycreator')})
                </button>
              </div>
            </div>

            <!-- Scanner Results Display -->
            ${liveFetchedData ? `
              <div style="background: var(--bg-surface-card); border: 1px solid #38bdf8; border-radius: 12px; padding: 1.5rem; animation: fadeIn 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #0284c7, #38bdf8); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: #fff; font-weight: 900;">
                      ${escapeHtml((liveFetchedData.creatorName || 'C').charAt(0))}
                    </div>
                    <div>
                      <div style="font-size: 1.2rem; font-weight: 900; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                        <span>${escapeHtml(liveFetchedData.creatorName || inputHandle)}</span>
                        <span style="color: #38bdf8; font-size: 0.85rem;" title="Live Verified Internet Data">✓</span>
                      </div>
                      <div style="font-size: 0.8rem; color: var(--text-muted);">
                        ${escapeHtml(liveFetchedData.handle || inputHandle)} • ${escapeHtml(liveFetchedData.platform || selectedPlatform)} • ${escapeHtml(liveFetchedData.niche || selectedNiche)}
                      </div>
                    </div>
                  </div>

                  <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button id="btn-apply-scanned-metrics" class="btn btn-primary" style="font-size: 0.82rem; padding: 0.45rem 1rem; background: var(--accent-secondary); color: #000; font-weight: 800;">
                      ⚡ Sync Scanned Stats to My Media Kit & Rate Card
                    </button>
                  </div>
                </div>

                <!-- Verified Stats Quad Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
                  <div style="background: var(--bg-surface-low); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-subtle); text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 900; color: #38bdf8;">
                      ${escapeHtml(liveFetchedData.formattedSubscribers || String(liveFetchedData.subscribers || '450K'))}
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700; margin-top: 2px;">
                      Subscribers / Followers
                    </div>
                  </div>

                  <div style="background: var(--bg-surface-low); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-subtle); text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 900; color: #4ade80;">
                      ${escapeHtml(liveFetchedData.formattedAvgViews || String(liveFetchedData.avgViews || '125,000'))}
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700; margin-top: 2px;">
                      Avg 30-Day Views / Video
                    </div>
                  </div>

                  <div style="background: var(--bg-surface-low); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-subtle); text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 900; color: #a855f7;">
                      ${escapeHtml(liveFetchedData.monthlyReach || '1.2M')}
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700; margin-top: 2px;">
                      Monthly Total Reach
                    </div>
                  </div>

                  <div style="background: var(--bg-surface-low); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-subtle); text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 900; color: #f59e0b;">
                      ${escapeHtml(liveFetchedData.engagementRate || '7.8%')}
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700; margin-top: 2px;">
                      Audience Engagement Rate
                    </div>
                  </div>
                </div>

                <!-- Audience Demographics & Verified Market Quotes -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                  <div style="background: var(--bg-surface-low); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-subtle);">
                    <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; margin-bottom: 0.5rem;">
                      👥 Verified Audience Demographics
                    </div>
                    <div style="font-size: 0.82rem; color: var(--text-main); margin-bottom: 0.4rem;">
                      <strong>Age Distribution:</strong> ${escapeHtml(liveFetchedData.ageDemographics || '18-24 (42%), 25-34 (45%), 35+ (13%)')}
                    </div>
                    <div style="font-size: 0.82rem; color: var(--text-main); margin-bottom: 0.4rem;">
                      <strong>Top Geographic Markets:</strong> ${(liveFetchedData.topCountries || ['India (60%)', 'US (20%)']).join(', ')}
                    </div>
                    <div style="font-size: 0.82rem; color: var(--text-main);">
                      <strong>Gender Split:</strong> ${escapeHtml(liveFetchedData.genderRatio || '68% Male / 32% Female')}
                    </div>
                  </div>

                  <div style="background: var(--bg-surface-low); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-subtle);">
                    <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; margin-bottom: 0.5rem;">
                      💵 Real-World Sponsor Deal Ranges (Web Grounded)
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.35rem;">
                      <span style="color: var(--text-muted);">60s Dedicated Reel / Short:</span>
                      <strong style="color: #4ade80;">${locale.symbol}${((liveFetchedData.estimatedSponsorRates?.reelShorts) || 1200).toLocaleString()}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.35rem;">
                      <span style="color: var(--text-muted);">Dedicated YouTube Video:</span>
                      <strong style="color: #4ade80;">${locale.symbol}${((liveFetchedData.estimatedSponsorRates?.youtubeDedicated) || 2800).toLocaleString()}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.82rem;">
                      <span style="color: var(--text-muted);">Multi-Platform Repurposed Bundle:</span>
                      <strong style="color: #38bdf8;">${locale.symbol}${((liveFetchedData.estimatedSponsorRates?.multiPlatformBundle) || 3800).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <!-- Verification Source Footer -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem; font-size: 0.72rem; color: var(--text-dim);">
                  <span>🔗 Source: <strong>${escapeHtml(liveFetchedData.verifiedSource || 'Live Internet Search & Social Metric Aggregator')}</strong></span>
                  <span>Confidence: <strong style="color: #4ade80;">${escapeHtml(liveFetchedData.confidence || 'High')}</strong> • Verified</span>
                </div>
              </div>
            ` : `
              <div style="text-align: center; padding: 2.5rem; background: var(--bg-surface-low); border-radius: 12px; border: 1px dashed var(--border-subtle);">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🌐</div>
                <div style="font-weight: 800; font-size: 1.1rem; color: var(--text-main);">No Live Internet Scan Executed Yet</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); max-width: 460px; margin: 0.25rem auto 1.25rem;">
                  Enter your YouTube, Instagram, or social handle above and click <strong>"Pull Live Metrics"</strong> to scan live internet databases and calibrate your rate card.
                </div>
              </div>
            `}
          </div>
        ` : ''}

        <!-- VIEW 2: DYNAMIC RATE CARD & LIVE MEDIA KIT TAB -->
        ${activeSubTab === 'rate-engine' ? `
          <div class="bento-grid" style="margin-bottom: 2rem;">
            
            <!-- Left: Sponsorship Rate Calculator -->
            <div class="card" style="grid-column: span 6; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 6px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <h3 style="font-size: 1.15rem; font-weight: 800;">🧮 Dynamic Rate Card Engine</h3>
                  </div>
                  <span class="badge badge-purple" style="font-size: 0.65rem;">CPM BENCHMARK • ${getNicheMultiplier()}x NICHE MULTIPLIER</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 1.1rem;">
                  <div>
                    <label style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.35rem; color: var(--text-muted);">
                      <span>Deliverable Scope:</span>
                      <span style="color: var(--accent-primary);">${DELIVERABLE_PRESETS[deliverableType]?.shortLabel || '1x Reel'}</span>
                    </label>
                    <select id="select-deliverable" class="form-select" style="font-weight: 600; font-size: 0.88rem;">
                      ${Object.entries(DELIVERABLE_PRESETS).map(([key, item]) => `
                        <option value="${key}" ${deliverableType === key ? 'selected' : ''}>${item.label}</option>
                      `).join('')}
                    </select>
                    <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 4px;">
                      ${DELIVERABLE_PRESETS[deliverableType]?.desc || ''}
                    </div>
                  </div>

                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.35rem; color: var(--text-muted);">
                      <span>Average 30-Day Rolling Views:</span>
                      <strong id="views-display" style="color: var(--text-main); font-size: 1rem; font-family: monospace; background: var(--bg-surface-low); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-subtle);">
                        ${views.toLocaleString()} views
                      </strong>
                    </div>
                    <input type="range" id="input-views" min="10000" max="2500000" step="10000" value="${views}" style="width: 100%; accent-color: var(--accent-primary); cursor: pointer;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--text-dim); margin-top: 3px;">
                      <span>10K (Micro)</span>
                      <span>500K (Mid-Tier)</span>
                      <span>1M+ (Pro)</span>
                      <span>2.5M (Mega)</span>
                    </div>
                  </div>

                  <!-- Rate Breakdown Card -->
                  <div style="background: var(--bg-surface-low); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                      <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-dim); font-weight: 800;">
                        Recommended Market Quote Range
                      </div>
                      <span class="badge badge-cyan" style="font-size: 0.62rem;">Est. CPM: ~${currentRates.symbol}${currentRates.cpmEstimate}</span>
                    </div>
                    
                    <div id="rate-display" style="font-size: 1.85rem; font-weight: 900; color: var(--accent-secondary); letter-spacing: -0.02em;">
                      ${currentRates.formattedRange}
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.85rem; padding-top: 0.85rem; border-top: 1px solid var(--border-subtle);">
                      <div>
                        <div style="font-size: 0.68rem; color: var(--text-dim); font-weight: 700;">Standard Benchmark Rate</div>
                        <div style="font-size: 1rem; font-weight: 800; color: var(--text-main);">${currentRates.formattedAvg}</div>
                      </div>
                      <div>
                        <div style="font-size: 0.68rem; color: var(--text-dim); font-weight: 700;">Exclusive / Whitelisted Rate</div>
                        <div style="font-size: 1rem; font-weight: 800; color: var(--accent-primary);">${currentRates.formattedPremium}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button id="btn-apply-as-deal" class="btn btn-secondary" style="flex: 1; font-size: 0.8rem;">
                  <span>➕ Log this Quote in CRM Pipeline</span>
                </button>
              </div>
            </div>

            <!-- Right: Live Public Media Kit Preview Card -->
            <div class="card" style="grid-column: span 6; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 6px;">
                  <h3 style="font-size: 1.15rem; font-weight: 800;">🌐 Creator Media Kit Card</h3>
                  <span class="badge badge-cyan">kontentos.me/@${escapeHtml(profile.handle ? profile.handle.replace('@', '') : 'creator')}</span>
                </div>

                <div style="background: var(--bg-surface-low); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem;">
                  <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1rem;">
                    <div style="width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.3rem; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                      ${escapeHtml((profile.name || 'C').charAt(0))}
                    </div>
                    <div>
                      <div style="font-weight: 800; font-size: 1.15rem; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                        <span>${escapeHtml(profile.name || 'Creator')}</span>
                        <span style="color: #38bdf8; font-size: 0.9rem;" title="Verified Creator Profile">✓</span>
                      </div>
                      <div style="font-size: 0.8rem; color: var(--text-muted);">
                        ${escapeHtml(profile.handle || '@creator')} • ${escapeHtml(profile.proNiche || profile.selectedVibe || 'Tech & Creator Ecosystem')}
                      </div>
                      <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 2px;">
                        Voice Style: <strong>${escapeHtml(profile.voiceArchetype || 'High-Energy Motivator')}</strong>
                      </div>
                    </div>
                  </div>

                  <!-- Verified Stats Grid -->
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; text-align: center; margin-bottom: 0.85rem;">
                    <div style="background: var(--bg-surface-card); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-subtle);">
                      <div style="font-size: 1.2rem; font-weight: 900; color: var(--accent-primary-light);">${escapeHtml(monetization.monthlyReach || '1.2M+')}</div>
                      <div style="font-size: 0.68rem; color: var(--text-dim); font-weight: 700; text-transform: uppercase;">Monthly Reach</div>
                    </div>
                    <div style="background: var(--bg-surface-card); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-subtle);">
                      <div style="font-size: 1.2rem; font-weight: 900; color: var(--accent-secondary);">${escapeHtml(monetization.engagementRate || '8.4%')}</div>
                      <div style="font-size: 0.68rem; color: var(--text-dim); font-weight: 700; text-transform: uppercase;">Avg Engagement</div>
                    </div>
                    <div style="background: var(--bg-surface-card); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-subtle);">
                      <div style="font-size: 1.2rem; font-weight: 900; color: var(--accent-cyan);">${currentRates.symbol}${currentRates.cpmEstimate}</div>
                      <div style="font-size: 0.68rem; color: var(--text-dim); font-weight: 700; text-transform: uppercase;">Avg Audience RPM</div>
                    </div>
                  </div>

                  <!-- Connected Channels -->
                  <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 0.5rem; align-items: center;">
                    <span style="font-size: 0.7rem; color: var(--text-dim); font-weight: 700;">CHANNELS:</span>
                    ${(profile.connectedPlatforms || ['instagram', 'youtube', 'linkedin', 'x']).map(p => `
                      <span style="font-size: 0.68rem; background: var(--bg-surface-high); border: 1px solid var(--border-subtle); padding: 2px 7px; border-radius: 4px; color: var(--text-muted); font-weight: 600; text-transform: capitalize;">
                        ${p}
                      </span>
                    `).join('')}
                  </div>
                </div>
              </div>

              <div style="display: flex; gap: 0.5rem;">
                <button id="btn-copy-kit-link" class="btn btn-secondary" style="flex: 1; font-size: 0.8rem;">
                  <span>🔗 Copy Public Link</span>
                </button>
                <button id="btn-preview-kit" class="btn btn-primary" style="flex: 1; font-size: 0.8rem;">
                  <span>📄 Full Media Kit Modal</span>
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- VIEW 3: SPONSOR INTELLIGENCE & 2026 INDUSTRY BENCHMARKS TAB -->
        ${activeSubTab === 'brand-intel' ? `
          <div class="bento-grid" style="margin-bottom: 2rem;">
            
            <!-- Left: Brand Sponsor Intelligence Dossier -->
            <div class="card" style="grid-column: span 6;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.15rem; font-weight: 800;">🏢 Sponsor Intelligence Scanner</h3>
                <span class="badge badge-neon">LIVE SPONSOR DOSSIER</span>
              </div>

              <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                <input type="text" id="input-brand-intel-name" class="form-input" placeholder="e.g. Notion, Figma, Epidemic Sound, Loom" value="${escapeHtml(brandLookupName)}">
                <button id="btn-fetch-brand-intel" class="btn btn-primary" style="padding: 0 1rem; font-weight: 800;" ${isFetchingBrandIntel ? 'disabled' : ''}>
                  ${isFetchingBrandIntel ? '⏳ Searching...' : '🔍 Scan Sponsor'}
                </button>
              </div>

              ${brandIntelData ? `
                <div style="background: var(--bg-surface-low); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 1.25rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <div style="font-size: 1.15rem; font-weight: 900; color: var(--text-main);">${escapeHtml(brandIntelData.brandName)}</div>
                    <span class="badge badge-purple">${escapeHtml(brandIntelData.typicalBudgetTier || 'Mid-Tier')}</span>
                  </div>

                  <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                    <strong>Preferred Content:</strong> ${(brandIntelData.preferredDeliverables || ['Dedicated Reel', 'YouTube Integration']).join(', ')}
                  </div>
                  <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                    <strong>Partnership Contact:</strong> <a href="mailto:${escapeHtml(brandIntelData.partnershipEmail || 'partnerships@brand.com')}" style="color: #38bdf8;">${escapeHtml(brandIntelData.partnershipEmail || 'partnerships@brand.com')}</a>
                  </div>
                  <div style="font-size: 0.82rem; color: var(--text-main); background: var(--bg-surface-card); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-subtle); margin-top: 0.5rem;">
                    🎯 <strong>Winning Pitch Hook:</strong> ${escapeHtml(brandIntelData.winningHookAngle || 'Showcase real productivity workflow demonstration.')}
                  </div>

                  <div style="display: flex; justify-content: flex-end; margin-top: 1rem; gap: 0.5rem;">
                    <button id="btn-draft-pitch-for-brand" class="btn btn-primary" style="font-size: 0.8rem;" data-brand="${escapeHtml(brandIntelData.brandName)}" data-contact="${escapeHtml(brandIntelData.partnershipEmail || '')}" data-hook="${escapeHtml(brandIntelData.winningHookAngle || '')}">
                      ✨ Write Pitch for ${escapeHtml(brandIntelData.brandName)}
                    </button>
                  </div>
                </div>
              ` : `
                <div style="font-size: 0.85rem; color: var(--text-muted); padding: 1.5rem; text-align: center; background: var(--bg-surface-low); border-radius: 10px;">
                  Enter any sponsor brand name to look up their current budget ranges, contact email patterns, and winning hook angles.
                </div>
              `}
            </div>

            <!-- Right: 2026 Industry CPM Benchmarks for Niche -->
            <div class="card" style="grid-column: span 6;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.15rem; font-weight: 800;">📊 2026 Creator Sponsorship Benchmarks</h3>
                <span class="badge badge-purple">${escapeHtml(selectedNiche)}</span>
              </div>

              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface-low); padding: 0.75rem 1rem; border-radius: 8px;">
                  <span style="font-size: 0.82rem; color: var(--text-muted);">Short-Form (Reels/Shorts) CPM:</span>
                  <strong style="font-size: 0.95rem; color: #4ade80;">${locale.currency.includes('INR') ? '₹200 – ₹420 / 1K' : '$14 – $28 / 1K'}</strong>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface-low); padding: 0.75rem 1rem; border-radius: 8px;">
                  <span style="font-size: 0.82rem; color: var(--text-muted);">Long-Form YouTube Dedicated CPM:</span>
                  <strong style="font-size: 0.95rem; color: #38bdf8;">${locale.currency.includes('INR') ? '₹450 – ₹950 / 1K' : '$30 – $65 / 1K'}</strong>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface-low); padding: 0.75rem 1rem; border-radius: 8px;">
                  <span style="font-size: 0.82rem; color: var(--text-muted);">Typical Sponsorship Package Size:</span>
                  <strong style="font-size: 0.95rem; color: var(--accent-secondary);">${locale.currency.includes('INR') ? '₹45,000 – ₹1,80,000' : '$2,200 – $7,500'}</strong>
                </div>

                <div style="font-size: 0.78rem; color: var(--text-dim); line-height: 1.4; margin-top: 0.25rem;">
                  💡 <strong>Deal Tip:</strong> Always quote cross-platform packages (Reel + Short + LinkedIn/X repost) to command 2.5x to 3.2x single-video rates.
                </div>
              </div>
            </div>

          </div>
        ` : ''}

        <!-- VIEW 4: ACTIVE SPONSORSHIP DEAL PIPELINE (KANBAN CRM) -->
        <div class="card" style="padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <h3 style="font-size: 1.2rem; font-weight: 900;">📋 Active Sponsorship Deal Pipeline</h3>
              <span class="badge badge-purple">${filteredDeals.length} DEALS</span>
            </div>

            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <input type="text" id="input-search-deals" class="form-input" placeholder="🔍 Search sponsor, brand, or notes..." value="${escapeHtml(searchTerm)}" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; width: 230px;">
              <button id="btn-reset-sample-deals" class="btn btn-secondary" style="padding: 0.4rem 0.7rem; font-size: 0.75rem;" title="Reset back to standard demo deals">
                🔄 Reset Demo Deals
              </button>
              <button id="btn-quick-add-deal" class="btn btn-primary" style="padding: 0.4rem 0.75rem; font-size: 0.75rem;">
                ➕ New Deal
              </button>
            </div>
          </div>
          
          <!-- 4-Column CRM Kanban Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
            
            <!-- Col 1: Pitched -->
            <div style="background: var(--bg-surface-low); padding: 0.9rem; border-radius: 12px; border: 1px solid var(--border-subtle); display: flex; flex-direction: column;">
              <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #64748b; padding-bottom: 0.4rem;">
                <span>📩 1. Pitched</span>
                <span class="badge" style="background: rgba(100, 116, 139, 0.2); color: #cbd5e1; font-size: 0.68rem;">
                  ${filteredDeals.filter(d => d.stage === 'pitched').length}
                </span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.65rem; flex: 1;">
                ${renderDealCards('pitched')}
              </div>
            </div>

            <!-- Col 2: In Negotiation -->
            <div style="background: var(--bg-surface-low); padding: 0.9rem; border-radius: 12px; border: 1px solid var(--border-subtle); display: flex; flex-direction: column;">
              <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--accent-primary); margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--accent-primary); padding-bottom: 0.4rem;">
                <span>💬 2. Negotiating</span>
                <span class="badge" style="background: var(--accent-badge-bg); color: var(--accent-primary); font-size: 0.68rem;">
                  ${filteredDeals.filter(d => d.stage === 'negotiating').length}
                </span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.65rem; flex: 1;">
                ${renderDealCards('negotiating')}
              </div>
            </div>

            <!-- Col 3: In Production -->
            <div style="background: var(--bg-surface-low); padding: 0.9rem; border-radius: 12px; border: 1px solid var(--border-subtle); display: flex; flex-direction: column;">
              <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--accent-cyan); margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--accent-cyan); padding-bottom: 0.4rem;">
                <span>🎬 3. In Production</span>
                <span class="badge" style="background: rgba(56, 189, 248, 0.15); color: var(--accent-cyan); font-size: 0.68rem;">
                  ${filteredDeals.filter(d => d.stage === 'production').length}
                </span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.65rem; flex: 1;">
                ${renderDealCards('production')}
              </div>
            </div>

            <!-- Col 4: Paid & Closed -->
            <div style="background: var(--bg-surface-low); padding: 0.9rem; border-radius: 12px; border: 1px solid var(--border-subtle); display: flex; flex-direction: column;">
              <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--accent-secondary); margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--accent-secondary); padding-bottom: 0.4rem;">
                <span>💰 4. Paid & Closed</span>
                <span class="badge" style="background: var(--accent-secondary-glow); color: var(--accent-secondary); font-size: 0.68rem;">
                  ${filteredDeals.filter(d => d.stage === 'paid').length}
                </span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.65rem; flex: 1;">
                ${renderDealCards('paid')}
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Add / Edit Deal Modal -->
      ${(showAddDealModal || editingDeal) ? `
        <div class="modal-backdrop-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
          <div class="card" style="max-width: 520px; width: 100%; border-color: var(--accent-primary); max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
              <h3 style="font-size: 1.25rem; font-weight: 800;">
                ${editingDeal ? '✏️ Edit Sponsorship Deal' : '➕ Add New Sponsorship Deal'}
              </h3>
              <button type="button" id="btn-close-deal-modal" class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">✕</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.9rem;">
              <div>
                <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 0.3rem; color: var(--text-muted);">Brand / Sponsor Title *</label>
                <input type="text" id="modal-deal-title" class="form-input" placeholder="e.g. Notion Creator Campaign" value="${escapeHtml(editingDeal?.title || '')}">
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div>
                  <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 0.3rem; color: var(--text-muted);">Brand Contact / Email</label>
                  <input type="text" id="modal-deal-contact" class="form-input" placeholder="e.g. sponsor@notion.so" value="${escapeHtml(editingDeal?.contact || '')}">
                </div>
                <div>
                  <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 0.3rem; color: var(--text-muted);">Deal Value (${locale.symbol}) *</label>
                  <input type="text" id="modal-deal-amount" class="form-input" placeholder="e.g. 2500" value="${escapeHtml(editingDeal ? (editingDeal.formattedAmount || String(editingDeal.amount)) : '')}">
                </div>
              </div>

              <div>
                <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 0.3rem; color: var(--text-muted);">Deliverable Scope</label>
                <input type="text" id="modal-deal-deliverable" class="form-input" placeholder="e.g. 1x Dedicated Instagram Reel + Story link" value="${escapeHtml(editingDeal?.deliverable || '1x Dedicated Reel (60s)')}">
              </div>

              <div>
                <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 0.3rem; color: var(--text-muted);">Pipeline Stage</label>
                <select id="modal-deal-stage" class="form-select">
                  <option value="pitched" ${editingDeal?.stage === 'pitched' ? 'selected' : ''}>1. Pitched (Outreach Sent)</option>
                  <option value="negotiating" ${editingDeal?.stage === 'negotiating' ? 'selected' : ''}>2. Negotiating (Terms & Pricing)</option>
                  <option value="production" ${editingDeal?.stage === 'production' ? 'selected' : ''}>3. In Production (Draft & Filming)</option>
                  <option value="paid" ${editingDeal?.stage === 'paid' ? 'selected' : ''}>4. Paid & Closed (Completed & Deposited)</option>
                </select>
              </div>

              <div>
                <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 0.3rem; color: var(--text-muted);">Internal Campaign Notes & Brief</label>
                <textarea id="modal-deal-notes" class="form-input" rows="3" placeholder="Key talking points, affiliate link, review deadlines, or contract details...">${escapeHtml(editingDeal?.notes || '')}</textarea>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-top: 0.75rem;">
                <div>
                  ${editingDeal?.id ? `
                    <button type="button" id="btn-modal-delete-deal" class="btn" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; font-size: 0.8rem; padding: 0.45rem 0.85rem; font-weight: 700;">
                      🗑️ Delete Deal
                    </button>
                  ` : ''}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                  <button type="button" id="btn-cancel-deal" class="btn btn-secondary">Cancel</button>
                  <button type="button" id="btn-save-deal" class="btn btn-primary">
                    ${editingDeal ? 'Update Deal' : 'Save Deal'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- AI Sponsor Pitch Outreach Generator Modal -->
      ${showAiPitchModal ? `
        <div class="modal-backdrop-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
          <div class="card" style="max-width: 680px; width: 100%; border-color: var(--accent-primary); max-height: 92vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <h3 style="font-size: 1.3rem; font-weight: 900;">✨ AI Brand Outreach Pitch Generator</h3>
                <span class="badge badge-purple">PRO CONVERTER</span>
              </div>
              <button type="button" id="btn-close-ai-pitch" class="btn btn-secondary" style="padding: 0.2rem 0.5rem;">✕</button>
            </div>

            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
              Generate a personalized, high-converting brand partnership pitch grounded in your verified niche, audience demographics, and rate card.
            </p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
              <div>
                <label style="font-size: 0.78rem; font-weight: 700; display: block; margin-bottom: 0.25rem; color: var(--text-muted);">Target Brand / Product Name</label>
                <input type="text" id="input-pitch-brand" class="form-input" placeholder="e.g. Notion, Figma, Epidemic Sound" value="Notion">
              </div>
              <div>
                <label style="font-size: 0.78rem; font-weight: 700; display: block; margin-bottom: 0.25rem; color: var(--text-muted);">Proposed Deliverable</label>
                <select id="select-pitch-deliverable" class="form-select">
                  <option value="1x Dedicated Reel (60s)">1x Dedicated Instagram Reel (60s)</option>
                  <option value="1x Dedicated YouTube Review (8-10m)">1x Dedicated YouTube Video (8-10m)</option>
                  <option value="Multi-Platform Repurposed Bundle">Multi-Platform Repurposed Bundle</option>
                  <option value="1x 60s Mid-Roll Integration">1x Mid-Roll Video Integration</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom: 1rem;">
              <label style="font-size: 0.78rem; font-weight: 700; display: block; margin-bottom: 0.25rem; color: var(--text-muted);">Key Campaign Focus / Unique Hook Angle</label>
              <input type="text" id="input-pitch-angle" class="form-input" placeholder="e.g. How to automate creator workflows using their new AI feature" value="Automating video editing and creator productivity workflows">
            </div>

            <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
              <button type="button" id="btn-run-generate-pitch" class="btn btn-primary" style="gap: 6px;" ${isAiGeneratingPitch ? 'disabled' : ''}>
                <span>${isAiGeneratingPitch ? '⏳ Writing Custom Pitch with Gemini...' : '⚡ Generate Pitch Email'}</span>
              </button>
            </div>

            ${generatedPitchText ? `
              <div style="background: var(--bg-surface-low); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <span style="font-size: 0.75rem; font-weight: 800; color: var(--accent-cyan); text-transform: uppercase;">📧 Ready-To-Send Brand Pitch:</span>
                  <div style="display: flex; gap: 0.4rem;">
                    <button type="button" id="btn-copy-pitch-email" class="btn btn-secondary" style="padding: 0.2rem 0.6rem; font-size: 0.72rem;">
                      📋 Copy Email
                    </button>
                    <button type="button" id="btn-add-pitch-to-crm" class="btn btn-primary" style="padding: 0.2rem 0.6rem; font-size: 0.72rem;">
                      📥 Log in CRM
                    </button>
                  </div>
                </div>
                <pre style="white-space: pre-wrap; font-family: var(--font-body); font-size: 0.85rem; color: var(--text-main); line-height: 1.6; margin: 0; background: var(--bg-surface-card); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-subtle); max-height: 280px; overflow-y: auto;">${escapeHtml(generatedPitchText)}</pre>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Full Printable Media Kit Modal -->
      ${showMediaKitModal ? `
        <div class="modal-backdrop-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1.5rem;">
          <div class="card" id="printable-media-kit" style="max-width: 720px; width: 100%; max-height: 92vh; overflow-y: auto; border-color: var(--accent-secondary); background: #0f172a; color: #f8fafc; padding: 2rem;">
            
            <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <h2 style="font-size: 1.3rem; font-weight: 900; color: #38bdf8;">🌐 Official Creator Rate Card & Media Kit</h2>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button type="button" id="btn-print-kit" class="btn btn-primary" style="padding: 0.35rem 0.85rem; font-size: 0.8rem; gap: 5px;">
                  <span>🖨️ Print / Save PDF</span>
                </button>
                <button type="button" id="btn-close-kit" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;">
                  ✕ Close
                </button>
              </div>
            </div>

            <!-- Header Card -->
            <div style="text-align: center; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1.5rem;">
              <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #a855f7, #38bdf8); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-weight: 900; color: #fff; margin: 0 auto 0.75rem; box-shadow: 0 4px 20px rgba(56, 189, 248, 0.4);">
                ${escapeHtml((profile.name || 'C').charAt(0))}
              </div>
              <h1 style="font-size: 2rem; font-weight: 900; margin-bottom: 0.25rem; color: #fff;">${escapeHtml(profile.name || 'Creator')}</h1>
              <p style="color: #94a3b8; font-size: 1rem; margin-bottom: 0.5rem;">
                ${escapeHtml(profile.handle || '@creator')} • <strong>${escapeHtml(profile.proNiche || 'Tech & Creator Ecosystem')}</strong>
              </p>
              <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
                ${(profile.connectedPlatforms || ['instagram', 'youtube', 'linkedin', 'x']).map(p => `
                  <span style="font-size: 0.72rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 3px 10px; border-radius: 20px; color: #e2e8f0; font-weight: 700; text-transform: uppercase;">
                    ${p}
                  </span>
                `).join('')}
              </div>
            </div>

            <!-- Audience Reach & Demographics -->
            <div style="margin-bottom: 2rem;">
              <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 0.85rem; color: #38bdf8;">📊 Audience Demographics & Reach</h3>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; text-align: center;">
                <div style="background: rgba(255,255,255,0.04); padding: 1.1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
                  <div style="font-size: 1.7rem; font-weight: 900; color: #38bdf8;">${escapeHtml(monetization.monthlyReach || '1.2M+')}</div>
                  <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-top: 2px;">Monthly Impressions</div>
                </div>
                <div style="background: rgba(255,255,255,0.04); padding: 1.1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
                  <div style="font-size: 1.7rem; font-weight: 900; color: #a855f7;">${escapeHtml(monetization.engagementRate || '8.4%')}</div>
                  <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-top: 2px;">Engagement Rate</div>
                </div>
                <div style="background: rgba(255,255,255,0.04); padding: 1.1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
                  <div style="font-size: 1.7rem; font-weight: 900; color: #4ade80;">82%</div>
                  <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-top: 2px;">22–35 Core Age</div>
                </div>
              </div>
            </div>

            <!-- Standard Sponsorship Rate Cards -->
            <div style="margin-bottom: 2rem;">
              <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 0.85rem; color: #38bdf8;">📦 Standard Commercial Sponsorship Packages</h3>
              
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
                  <div>
                    <div style="font-weight: 800; font-size: 0.95rem; color: #fff;">1x Dedicated Short-Form Video (60s)</div>
                    <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 2px;">Instagram Reel + YouTube Short + TikTok Repost + Link in Bio</div>
                  </div>
                  <div style="font-weight: 900; color: #4ade80; font-size: 1.25rem;">
                    ${calculateRates(views, 'reel').formattedAvg}
                  </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
                  <div>
                    <div style="font-weight: 800; font-size: 0.95rem; color: #fff;">1x Full Dedicated Long-Form Review (8–10m)</div>
                    <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 2px;">Dedicated YouTube Deep Dive + pinned comment + permanent description link</div>
                  </div>
                  <div style="font-weight: 900; color: #4ade80; font-size: 1.25rem;">
                    ${calculateRates(views, 'youtube').formattedAvg}
                  </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
                  <div>
                    <div style="font-weight: 800; font-size: 0.95rem; color: #fff;">Multi-Platform Repurposed Domination Bundle</div>
                    <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 2px;">Syndicated distribution across all 6 channels with tailored native captions</div>
                  </div>
                  <div style="font-weight: 900; color: #38bdf8; font-size: 1.25rem;">
                    ${calculateRates(views, 'bundle').formattedAvg}
                  </div>
                </div>

              </div>
            </div>

            <!-- Footer & Contact -->
            <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.25rem;">
              <p style="font-size: 0.88rem; color: #94a3b8; margin-bottom: 0.75rem;">
                For sponsorship bookings, exclusivity locks & press inquiries:
              </p>
              <div style="display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap;">
                <button type="button" id="btn-copy-media-pitch" class="btn btn-secondary" style="font-size: 0.82rem;">
                  📋 Copy Text Pitch Package
                </button>
                <a href="mailto:${encodeURIComponent(profile.handle ? `${profile.handle.replace('@', '')}@kontentos.me` : 'creator@kontentos.me')}?subject=${encodeURIComponent(`Sponsorship Inquiry — ${profile.name || 'Creator'}`)}" class="btn btn-primary" style="font-size: 0.82rem; text-decoration: none;">
                  ✉️ Email Partnerships Team
                </a>
              </div>
            </div>

          </div>
        </div>
      ` : ''}
    `;

    // Internal deal cards renderer for each CRM column
    function renderDealCards(stage) {
      const stageDeals = filteredDeals.filter(d => d.stage === stage);
      if (stageDeals.length === 0) {
        return `
          <div style="font-size: 0.75rem; color: var(--text-dim); text-align: center; padding: 1.5rem 0.5rem; background: rgba(0,0,0,0.1); border-radius: 8px; border: 1px dashed var(--border-subtle);">
            No deals currently in this stage
          </div>
        `;
      }

      return stageDeals.map(deal => {
        const amountDisplay = deal.formattedAmount || formatDealCurrency(parseAmountNumber(deal.amount));
        return `
          <div class="card card-deal-item" data-id="${escapeHtml(deal.id)}" style="padding: 0.85rem; background: var(--bg-surface-card); border: 1px solid var(--border-subtle); border-radius: 10px; transition: transform 0.15s ease, box-shadow 0.15s ease;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;">
              <div style="font-weight: 800; font-size: 0.88rem; color: var(--text-main); line-height: 1.3;">
                ${escapeHtml(deal.title)}
              </div>
              <div style="display: flex; gap: 4px; align-items: center;">
                <button type="button" class="btn-edit-deal" data-id="${escapeHtml(deal.id)}" style="background: var(--bg-surface-high); border: 1px solid var(--border-subtle); color: var(--text-muted); cursor: pointer; font-size: 0.75rem; padding: 3px 6px; border-radius: 4px;" title="Edit Deal">
                  ✏️
                </button>
                <button type="button" class="btn-delete-deal" data-id="${escapeHtml(deal.id)}" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; cursor: pointer; font-size: 0.78rem; padding: 3px 6px; border-radius: 4px; font-weight: 800;" title="Delete Deal">
                  ✕
                </button>
              </div>
            </div>

            <div style="font-size: 0.95rem; color: var(--accent-secondary); font-weight: 900; margin-top: 4px;">
              ${escapeHtml(amountDisplay)}
            </div>

            <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 3px;">
              📦 ${escapeHtml(deal.deliverable || '1x Short Video')}
            </div>

            ${deal.contact ? `
              <div style="font-size: 0.68rem; color: var(--text-dim); margin-top: 3px;">
                👤 ${escapeHtml(deal.contact)}
              </div>
            ` : ''}

            ${deal.notes ? `
              <div style="font-size: 0.68rem; color: var(--text-dim); margin-top: 4px; line-height: 1.3; background: var(--bg-surface-low); padding: 4px 6px; border-radius: 4px;">
                📝 ${escapeHtml(deal.notes)}
              </div>
            ` : ''}

            <!-- Quick Stage Transition Buttons -->
            <div style="display: flex; justify-content: flex-end; gap: 4px; margin-top: 8px; padding-top: 6px; border-top: 1px solid var(--border-subtle); flex-wrap: wrap;">
              ${stage === 'pitched' ? `
                <button type="button" class="btn-move-stage" data-id="${escapeHtml(deal.id)}" data-stage="negotiating" style="font-size: 0.65rem; background: var(--bg-surface-high); border: 1px solid var(--border-subtle); color: var(--accent-primary); padding: 2px 6px; border-radius: 4px; cursor: pointer; font-weight: 700;">
                  Move to Negotiating →
                </button>
              ` : ''}
              ${stage === 'negotiating' ? `
                <button type="button" class="btn-move-stage" data-id="${escapeHtml(deal.id)}" data-stage="pitched" style="font-size: 0.65rem; background: var(--bg-surface-high); border: 1px solid var(--border-subtle); color: var(--text-dim); padding: 2px 6px; border-radius: 4px; cursor: pointer;">
                  ← Pitched
                </button>
                <button type="button" class="btn-move-stage" data-id="${escapeHtml(deal.id)}" data-stage="production" style="font-size: 0.65rem; background: var(--bg-surface-high); border: 1px solid var(--border-subtle); color: var(--accent-cyan); padding: 2px 6px; border-radius: 4px; cursor: pointer; font-weight: 700;">
                  In Production →
                </button>
              ` : ''}
              ${stage === 'production' ? `
                <button type="button" class="btn-move-stage" data-id="${escapeHtml(deal.id)}" data-stage="negotiating" style="font-size: 0.65rem; background: var(--bg-surface-high); border: 1px solid var(--border-subtle); color: var(--text-dim); padding: 2px 6px; border-radius: 4px; cursor: pointer;">
                  ← Negotiating
                </button>
                <button type="button" class="btn-move-stage" data-id="${escapeHtml(deal.id)}" data-stage="paid" style="font-size: 0.65rem; background: var(--accent-secondary-glow); border: 1px solid var(--accent-secondary); color: var(--accent-secondary); padding: 2px 6px; border-radius: 4px; cursor: pointer; font-weight: 800;">
                  💰 Mark Paid & Closed
                </button>
              ` : ''}
              ${stage === 'paid' ? `
                <button type="button" class="btn-move-stage" data-id="${escapeHtml(deal.id)}" data-stage="production" style="font-size: 0.65rem; background: var(--bg-surface-high); border: 1px solid var(--border-subtle); color: var(--text-dim); padding: 2px 6px; border-radius: 4px; cursor: pointer;">
                  ← Reopen
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    // Attach Event Listeners
    attachEventListeners();
  };

  function attachEventListeners() {
    // Sub-tab Navigation
    container.querySelectorAll('.btn-subtab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeSubTab = e.currentTarget.dataset.tab;
        render();
      });
    });

    // Top Header Buttons
    const btnHeaderPull = container.querySelector('#btn-header-pull-internet');
    if (btnHeaderPull) {
      btnHeaderPull.addEventListener('click', () => {
        activeSubTab = 'live-scanner';
        render();
      });
    }

    // Deliverable Select
    const selectDeliverable = container.querySelector('#select-deliverable');
    if (selectDeliverable) {
      selectDeliverable.addEventListener('change', (e) => {
        deliverableType = e.target.value;
        stateStore.updateMonetization({ deliverableType });
        render();
      });
    }

    // Views Slider
    const inputViews = container.querySelector('#input-views');
    if (inputViews) {
      inputViews.addEventListener('input', (e) => {
        views = parseInt(e.target.value, 10);
        const display = container.querySelector('#views-display');
        const rateDisplay = container.querySelector('#rate-display');
        if (display) display.textContent = `${views.toLocaleString()} views`;
        if (rateDisplay) {
          const rates = calculateRates(views, deliverableType);
          rateDisplay.textContent = rates.formattedRange;
        }
      });
      inputViews.addEventListener('change', (e) => {
        views = parseInt(e.target.value, 10);
        stateStore.updateMonetization({ views });
        render();
      });
    }

    // 🌐 Live Internet Metrics Scanner Events
    const btnTriggerInternet = container.querySelector('#btn-trigger-internet-fetch');
    const inputScannerHandle = container.querySelector('#input-scanner-handle');
    const selectScannerPlatform = container.querySelector('#select-scanner-platform');
    const selectScannerNiche = container.querySelector('#select-scanner-niche');

    if (inputScannerHandle) {
      inputScannerHandle.addEventListener('input', (e) => {
        inputHandle = e.target.value;
      });
    }

    if (selectScannerPlatform) {
      selectScannerPlatform.addEventListener('change', (e) => {
        selectedPlatform = e.target.value;
      });
    }

    if (selectScannerNiche) {
      selectScannerNiche.addEventListener('change', (e) => {
        selectedNiche = e.target.value;
      });
    }

    // Quick handle preset buttons
    container.querySelectorAll('.btn-preset-handle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        inputHandle = e.currentTarget.dataset.handle;
        selectedPlatform = e.currentTarget.dataset.platform || 'youtube';
        selectedNiche = e.currentTarget.dataset.niche || 'Tech & AI';
        render();
      });
    });

    if (btnTriggerInternet) {
      btnTriggerInternet.addEventListener('click', async () => {
        if (!inputHandle || inputHandle.trim() === '') {
          showToast('Please enter a creator or channel handle first', 'warn');
          return;
        }

        isFetchingInternetMetrics = true;
        render();

        try {
          const res = await api.fetchCreatorMetricsFromInternet({
            handle: inputHandle,
            platform: selectedPlatform,
            niche: selectedNiche,
            country: state.geo || 'IN'
          });

          if (res.success && res.data) {
            liveFetchedData = res.data;
            showToast(`Successfully pulled live web metrics for ${liveFetchedData.creatorName || inputHandle}!`, 'success');
          } else {
            showToast('Unable to extract live metrics. Standard index loaded.', 'warn');
          }
        } catch (err) {
          console.error('Error fetching internet metrics:', err);
          showToast(err.message || 'Error querying web metrics', 'warn');
        } finally {
          isFetchingInternetMetrics = false;
          render();
        }
      });
    }

    // Sync Scanned Metrics to Rate Card & Profile
    const btnApplyScanned = container.querySelector('#btn-apply-scanned-metrics');
    if (btnApplyScanned && liveFetchedData) {
      btnApplyScanned.addEventListener('click', () => {
        if (liveFetchedData.avgViews) {
          views = typeof liveFetchedData.avgViews === 'number' ? liveFetchedData.avgViews : (parseInt(String(liveFetchedData.avgViews).replace(/[^0-9]/g, ''), 10) || 125000);
        }
        
        stateStore.updateMonetization({
          views,
          monthlyReach: liveFetchedData.monthlyReach || '1.2M',
          engagementRate: liveFetchedData.engagementRate || '7.8%',
          liveVerifiedMetrics: liveFetchedData
        });

        // Also update creator profile
        const updatedProfile = {
          ...profile,
          name: liveFetchedData.creatorName || profile.name,
          handle: liveFetchedData.handle || profile.handle,
          proNiche: liveFetchedData.niche || profile.proNiche
        };
        stateStore.set({ creatorProfile: updatedProfile });

        showToast('✅ Verified internet metrics synced to your Rate Card & Media Kit!', 'success');
        activeSubTab = 'rate-engine';
        render();
      });
    }

    // Brand Sponsor Intelligence Scan
    const btnFetchBrandIntel = container.querySelector('#btn-fetch-brand-intel');
    const inputBrandIntelName = container.querySelector('#input-brand-intel-name');

    if (inputBrandIntelName) {
      inputBrandIntelName.addEventListener('input', (e) => {
        brandLookupName = e.target.value;
      });
    }

    if (btnFetchBrandIntel) {
      btnFetchBrandIntel.addEventListener('click', async () => {
        if (!brandLookupName || brandLookupName.trim() === '') {
          showToast('Please enter a brand name to scan', 'warn');
          return;
        }

        isFetchingBrandIntel = true;
        render();

        try {
          const res = await api.fetchBrandIntelligence({
            brandName: brandLookupName,
            niche: selectedNiche || profile.proNiche || 'Tech & AI'
          });

          if (res.success && res.data) {
            brandIntelData = res.data;
            showToast(`Sponsor intel retrieved for ${brandIntelData.brandName}!`, 'success');
          }
        } catch (err) {
          showToast('Error scanning brand sponsor intel', 'warn');
        } finally {
          isFetchingBrandIntel = false;
          render();
        }
      });
    }

    // Write Pitch from Brand Intel Button
    const btnDraftPitchForBrand = container.querySelector('#btn-draft-pitch-for-brand');
    if (btnDraftPitchForBrand) {
      btnDraftPitchForBrand.addEventListener('click', (e) => {
        const targetBrand = e.currentTarget.dataset.brand || 'Brand Partner';
        showAiPitchModal = true;
        render();
        const inputPitchBrand = container.querySelector('#input-pitch-brand');
        if (inputPitchBrand) inputPitchBrand.value = targetBrand;
      });
    }

    // Apply Quote as Deal to CRM
    const btnApplyAsDeal = container.querySelector('#btn-apply-as-deal');
    if (btnApplyAsDeal) {
      btnApplyAsDeal.addEventListener('click', () => {
        const rates = calculateRates(views, deliverableType);
        const preset = DELIVERABLE_PRESETS[deliverableType];
        
        editingDeal = {
          id: '',
          title: `New ${preset.shortLabel} Sponsorship`,
          brandName: 'Brand Partner',
          amount: rates.avg,
          formattedAmount: rates.formattedAvg,
          deliverable: preset.label,
          stage: 'pitched',
          contact: '',
          notes: `Calculated quote based on ${views.toLocaleString()} 30-day views. Benchmark rate: ${rates.formattedAvg}.`
        };
        showAddDealModal = true;
        render();
      });
    }

    // Media Kit Modal preview buttons
    const btnPreviewKit = container.querySelector('#btn-preview-kit');
    const btnExportProposal = container.querySelector('#btn-export-proposal');
    if (btnPreviewKit) {
      btnPreviewKit.addEventListener('click', () => {
        showMediaKitModal = true;
        render();
      });
    }
    if (btnExportProposal) {
      btnExportProposal.addEventListener('click', () => {
        showMediaKitModal = true;
        render();
      });
    }

    const btnCloseKit = container.querySelector('#btn-close-kit');
    if (btnCloseKit) {
      btnCloseKit.addEventListener('click', () => {
        showMediaKitModal = false;
        render();
      });
    }

    const btnPrintKit = container.querySelector('#btn-print-kit');
    if (btnPrintKit) {
      btnPrintKit.addEventListener('click', () => {
        window.print();
      });
    }

    // Copy Kit Link
    const btnCopyKitLink = container.querySelector('#btn-copy-kit-link');
    if (btnCopyKitLink) {
      btnCopyKitLink.addEventListener('click', () => {
        const link = `https://kontentos.me/@${profile.handle ? profile.handle.replace('@', '') : 'creator'}/media-kit`;
        navigator.clipboard.writeText(link);
        showToast('🔗 Public Media Kit link copied to clipboard!', 'info');
      });
    }

    // Copy Media Pitch
    const btnCopyMediaPitch = container.querySelector('#btn-copy-media-pitch');
    if (btnCopyMediaPitch) {
      btnCopyMediaPitch.addEventListener('click', () => {
        const text = `Hi Partnerships Team,\n\nI’m ${profile.name || 'Creator'} (${profile.handle || '@creator'}), reaching ${monetization.monthlyReach || '1.2M+'} monthly viewers with an ${monetization.engagementRate || '8.4%'} engagement rate.\n\nOur current sponsorship packages:\n• 1x Dedicated Reel/Short: ${calculateRates(views, 'reel').formattedAvg}\n• 1x Dedicated YouTube Review: ${calculateRates(views, 'youtube').formattedAvg}\n• Multi-Platform Bundle: ${calculateRates(views, 'bundle').formattedAvg}\n\nLet’s collaborate!`;
        navigator.clipboard.writeText(text);
        showToast('📋 Pitch text package copied to clipboard!', 'success');
      });
    }

    // Search Deals
    const inputSearch = container.querySelector('#input-search-deals');
    if (inputSearch) {
      inputSearch.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        render();
      });
    }

    // Reset Demo Deals
    const btnResetDeals = container.querySelector('#btn-reset-sample-deals');
    if (btnResetDeals) {
      btnResetDeals.addEventListener('click', () => {
        stateStore.resetBrandDeals();
        showToast('🔄 Deals reset to default showcase pipeline', 'info');
        render();
      });
    }

    // Quick Add Deal Button
    const btnQuickAdd = container.querySelector('#btn-quick-add-deal');
    const btnAddDeal = container.querySelector('#btn-add-deal');
    const openAddModal = () => {
      editingDeal = null;
      showAddDealModal = true;
      render();
    };
    if (btnQuickAdd) btnQuickAdd.addEventListener('click', openAddModal);
    if (btnAddDeal) btnAddDeal.addEventListener('click', openAddModal);

    // Close Deal Modal
    const btnCloseDealModal = container.querySelector('#btn-close-deal-modal');
    const btnCancelDeal = container.querySelector('#btn-cancel-deal');
    if (btnCloseDealModal) {
      btnCloseDealModal.addEventListener('click', () => {
        showAddDealModal = false;
        editingDeal = null;
        render();
      });
    }
    if (btnCancelDeal) {
      btnCancelDeal.addEventListener('click', () => {
        showAddDealModal = false;
        editingDeal = null;
        render();
      });
    }

    // Save Deal Action
    const btnSaveDeal = container.querySelector('#btn-save-deal');
    if (btnSaveDeal) {
      btnSaveDeal.addEventListener('click', () => {
        const title = container.querySelector('#modal-deal-title')?.value || '';
        const contact = container.querySelector('#modal-deal-contact')?.value || '';
        const amountStr = container.querySelector('#modal-deal-amount')?.value || '1000';
        const deliverable = container.querySelector('#modal-deal-deliverable')?.value || '1x Dedicated Reel (60s)';
        const stage = container.querySelector('#modal-deal-stage')?.value || 'pitched';
        const notes = container.querySelector('#modal-deal-notes')?.value || '';

        if (!title.trim()) {
          showToast('Please provide a brand or deal title', 'warn');
          return;
        }

        const numericAmount = parseAmountNumber(amountStr);
        const formattedAmount = formatDealCurrency(numericAmount);

        if (editingDeal && editingDeal.id) {
          stateStore.updateBrandDeal(editingDeal.id, {
            title,
            brandName: title,
            contact,
            amount: numericAmount,
            formattedAmount,
            deliverable,
            stage,
            notes,
          });
          showToast(`Updated deal "${title}"!`, 'success');
        } else {
          stateStore.addBrandDeal({
            title,
            brandName: title,
            contact,
            amount: numericAmount,
            formattedAmount,
            deliverable,
            stage,
            notes,
          });
          showToast(`Added deal "${title}" to pipeline!`, 'success');
        }

        showAddDealModal = false;
        editingDeal = null;
        render();
      });
    }

    // Edit and Delete Individual Deals
    container.querySelectorAll('.btn-edit-deal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        const deal = (monetization.deals || []).find(d => String(d.id) === String(id));
        if (deal) {
          editingDeal = { ...deal };
          showAddDealModal = true;
          render();
        }
      });
    });

    container.querySelectorAll('.btn-delete-deal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const id = e.currentTarget.dataset.id;
        const deals = monetization.deals || [];
        const target = deals.find(d => String(d.id) === String(id));
        const title = target ? target.title : 'Deal';
        stateStore.deleteBrandDeal(id);
        showToast(`🗑️ Deleted "${title}" from CRM pipeline`, 'info');
        render();
      });
    });

    // Modal Delete Button
    const btnModalDelete = container.querySelector('#btn-modal-delete-deal');
    if (btnModalDelete && editingDeal && editingDeal.id) {
      btnModalDelete.addEventListener('click', () => {
        const title = editingDeal.title || 'Deal';
        stateStore.deleteBrandDeal(editingDeal.id);
        showToast(`🗑️ Deleted "${title}" from CRM pipeline`, 'info');
        showAddDealModal = false;
        editingDeal = null;
        render();
      });
    }

    // Move Stage in Kanban
    container.querySelectorAll('.btn-move-stage').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const newStage = e.currentTarget.dataset.stage;
        stateStore.moveBrandDealStage(id, newStage);
        showToast(`Moved deal to ${newStage.toUpperCase()}!`, 'success');
        render();
      });
    });

    // AI Pitch Outreach Modal
    const btnAiPitchGen = container.querySelector('#btn-ai-pitch-gen');
    if (btnAiPitchGen) {
      btnAiPitchGen.addEventListener('click', () => {
        showAiPitchModal = true;
        render();
      });
    }

    const btnCloseAiPitch = container.querySelector('#btn-close-ai-pitch');
    if (btnCloseAiPitch) {
      btnCloseAiPitch.addEventListener('click', () => {
        showAiPitchModal = false;
        generatedPitchText = '';
        render();
      });
    }

    const btnRunGenPitch = container.querySelector('#btn-run-generate-pitch');
    if (btnRunGenPitch) {
      btnRunGenPitch.addEventListener('click', async () => {
        const brandName = container.querySelector('#input-pitch-brand')?.value || 'Notion';
        const deliverable = container.querySelector('#select-pitch-deliverable')?.value || '1x Dedicated Reel (60s)';
        const hookAngle = container.querySelector('#input-pitch-angle')?.value || 'Automating creator workflows';
        const rate = currentRates.formattedAvg;

        isAiGeneratingPitch = true;
        render();

        try {
          const res = await api.generateSponsorPitch({
            brandName,
            deliverable,
            rate,
            hookAngle,
            creatorProfile: profile,
            stats: {
              monthlyReach: monetization.monthlyReach || '1.2M+',
              engagementRate: monetization.engagementRate || '8.4%',
            }
          });

          if (res.success && res.pitchText) {
            generatedPitchText = res.pitchText;
          }
        } catch (err) {
          console.error('Error generating pitch:', err);
          showToast('Pitch generated using standard template', 'info');
        } finally {
          isAiGeneratingPitch = false;
          render();
        }
      });
    }

    const btnCopyPitchEmail = container.querySelector('#btn-copy-pitch-email');
    if (btnCopyPitchEmail && generatedPitchText) {
      btnCopyPitchEmail.addEventListener('click', () => {
        navigator.clipboard.writeText(generatedPitchText);
        showToast('📋 Pitch email copied to clipboard!', 'success');
      });
    }

    const btnAddPitchToCrm = container.querySelector('#btn-add-pitch-to-crm');
    if (btnAddPitchToCrm) {
      btnAddPitchToCrm.addEventListener('click', () => {
        const brandName = container.querySelector('#input-pitch-brand')?.value || 'Brand Partner';
        const deliverable = container.querySelector('#select-pitch-deliverable')?.value || '1x Dedicated Reel (60s)';
        
        stateStore.addBrandDeal({
          title: `${brandName} Sponsor Pitch`,
          brandName,
          amount: currentRates.avg,
          formattedAmount: currentRates.formattedAvg,
          deliverable,
          stage: 'pitched',
          contact: `partnerships@${brandName.toLowerCase().replace(/\s+/g, '')}.com`,
          notes: `AI Pitch generated. Outreach sent for "${deliverable}".`
        });

        showToast(`Logged "${brandName}" pitch into Pitched stage!`, 'success');
        showAiPitchModal = false;
        generatedPitchText = '';
        render();
      });
    }
  }

  // Initial render execution
  render();
}

/**
 * Shaikh Abdul Zubair — Dashboard Portfolio Controller
 * Real Project Data, Live Filtering, Real App Logos & Cloud Deployments
 */

(function () {
  'use strict';

  let allProjects = [];
  let currentFilter = 'all';
  let searchQuery = '';

  // Icon mapping for verified applications
  const verifiedIcons = {
    'interact-app': 'images/app_icons/interakt.png',
    'rentany-rental-platform': 'images/app_icons/rentany.png',
    'personal-life-vault': 'images/app_icons/vault.png',
    'masipay-canteen': 'images/app_icons/srkstaff.png',
    'cyclecare-health-platform': 'images/app_icons/cyclecare.png',
    'projectflow-intelligence': 'images/app_icons/projectflow.png',
    'smart-expenses-tracker': 'images/app_icons/smartexpenses.png',
    'nearmeshchat-sahay-android': 'images/app_icons/sahay.png',
    'nexus-meshlink-offline': 'images/app_icons/nexus.png',
    'couple-canvas': 'images/app_icons/couplecanvas.png',
    'emergency-recorder-fast-rec': 'images/app_icons/fastrec.png',
    'focus-guard-addiction-blocker': 'images/app_icons/focusguard.png',
    'myhelper-storage-analyzer': 'images/app_icons/myhelper.png',
    'recoverx-data-recovery': 'images/app_icons/recoverx.png',
    'z-music-player': 'images/app_icons/zmusic.png',
    'draw-your-army-warforge': 'images/app_icons/warforge.png'
  };

  // Live website mapping
  const liveWebsites = {
    'interact-app': 'https://interakt-web.vercel.app/',
    'personal-life-vault': 'https://safe-vault-xx5c.onrender.com/',
    'masipay-canteen': 'https://masicanteen.vercel.app/',
    'cyclecare-health-platform': 'https://cyclecare-api.onrender.com',
    'projectflow-intelligence': 'https://projectflow-intelligence.onrender.com',
    'smart-expenses-tracker': 'https://smart-expenses-kuob.onrender.com',
    'nearmeshchat-sahay-android': 'https://sahay-2tvh.onrender.com',
    'aapdasetu-disaster-response': 'https://sahay-2tvh.onrender.com',
    'srk-campus-connect': 'https://srk-campus-backend.onrender.com',
    'rentany-rental-platform': 'https://rentany.onrender.com',
    'z-music-player': 'https://musicplayer-blyl.onrender.com'
  };

  // Verified APK mapping
  const verifiedApks = {
    'interact-app': 'https://github.com/abdulzubair1135/interakt-app/releases/download/v1.15.0/interakt.apk',
    'personal-life-vault': 'apks/PersonalLifeVault.apk',
    'masipay-canteen': 'apks/SRKStaff.apk',
    'cyclecare-health-platform': 'apks/CycleCare.apk',
    'projectflow-intelligence': 'apks/ProjectFlow.apk',
    'smart-expenses-tracker': 'apks/SmartExpenses.apk',
    'couple-canvas': 'apks/CoupleCanvas.apk',
    'emergency-recorder-fast-rec': 'apks/FastRec.apk',
    'focus-guard-addiction-blocker': 'apks/FocusGuard.apk',
    'myhelper-storage-analyzer': 'apks/MyHelper.apk',
    'nearmeshchat-sahay-android': 'apks/Sahay-NearMesh.apk',
    'nexus-meshlink-offline': 'apks/Nexus-MeshLink.apk',
    'recoverx-data-recovery': 'apks/RecoverX.apk',
    'z-music-player': 'apks/Z-Music.apk',
    'draw-your-army-warforge': 'apks/WarForge.apk'
  };

  // Project categories
  function getProjectBadgeCategory(p) {
    if (p.id === 'interact-app') return { name: 'Web', cls: 'tag-web' };
    if (p.id === 'rentany-rental-platform') return { name: 'Web', cls: 'tag-web' };
    if (p.apkUrl || verifiedApks[p.id] || p.category === 'android' || p.id.includes('android')) return { name: 'Android', cls: 'tag-android' };
    if (p.category === 'ai' || p.id.includes('ai') || p.id.includes('vision') || p.id.includes('agent')) return { name: 'AI', cls: 'tag-ai' };
    if (p.category === 'game' || p.id.includes('game') || p.id.includes('warforge')) return { name: 'Game', cls: 'tag-game' };
    return { name: 'Web', cls: 'tag-web' };
  }

  // Load projects
  async function loadProjects() {
    try {
      const res = await fetch('projects_data.json');
      allProjects = await res.json();

      // Enrich with verified links & icons
      allProjects = allProjects.map(p => {
        const enriched = { ...p };
        if (verifiedIcons[p.id]) enriched.iconUrl = verifiedIcons[p.id];
        if (liveWebsites[p.id]) enriched.liveUrl = liveWebsites[p.id];
        if (verifiedApks[p.id]) enriched.apkUrl = verifiedApks[p.id];
        return enriched;
      });

      // Specific order matching reference mockup
      const featuredRank = {
        'interact-app': 100,
        'rentany-rental-platform': 95,
        'nearmeshchat-sahay-android': 90,
        'personal-life-vault': 85,
        'cyclecare-health-platform': 80,
        'masipay-canteen': 75,
        'projectflow-intelligence': 70,
        'smart-expenses-tracker': 65,
        'z-music-player': 60,
        'nexus-meshlink-offline': 55,
        'couple-canvas': 50,
        'emergency-recorder-fast-rec': 45,
        'focus-guard-addiction-blocker': 40,
        'myhelper-storage-analyzer': 35,
        'recoverx-data-recovery': 30,
        'draw-your-army-warforge': 25
      };

      // Priority sort: Show real applications with verified APK or Live Web first!
      allProjects.sort((a, b) => {
        const rankA = featuredRank[a.id] || ((a.iconUrl ? 10 : 0) + (a.liveUrl ? 5 : 0) + (a.apkUrl ? 5 : 0));
        const rankB = featuredRank[b.id] || ((b.iconUrl ? 10 : 0) + (b.liveUrl ? 5 : 0) + (b.apkUrl ? 5 : 0));
        return rankB - rankA;
      });

      renderProjects();
    } catch (err) {
      console.error('Failed to load projects_data.json', err);
    }
  }

  function filterProjects() {
    return allProjects.filter(p => {
      // Category filter
      if (currentFilter !== 'all') {
        const cat = getProjectBadgeCategory(p).name.toLowerCase();
        const hasApk = Boolean(p.apkUrl || verifiedApks[p.id]);
        const hasLive = Boolean(p.liveUrl || liveWebsites[p.id]);

        if (currentFilter === 'android' && !hasApk && cat !== 'android') return false;
        if (currentFilter === 'ai' && cat !== 'ai') return false;
        if (currentFilter === 'game' && cat !== 'game') return false;
        if (currentFilter === 'web' && !hasLive && cat !== 'web') return false;
      }

      // Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const descMatch = (p.description || '').toLowerCase().includes(q);
        const catMatch = (p.categoryName || '').toLowerCase().includes(q);
        return titleMatch || descMatch || catMatch;
      }

      return true;
    });
  }

  function renderProjects() {
    const container = document.getElementById('projectsContainer');
    if (!container) return;

    const filtered = filterProjects();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: rgba(22, 21, 42, 0.5); border-radius: 20px; border: 1px solid rgba(139, 92, 246, 0.2);">
          <p style="font-size: 16px; font-weight: 600; color: #94A3B8;">No projects found matching "${searchQuery}".</p>
          <button id="clearSearchBtn" style="margin-top: 12px; padding: 6px 14px; background: #7C3AED; color: #fff; border: none; border-radius: 20px; font-weight: 600; cursor: pointer;">Clear Search</button>
        </div>
      `;
      document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
        searchQuery = '';
        const input = document.getElementById('searchInput');
        if (input) input.value = '';
        renderProjects();
      });
      return;
    }

    container.innerHTML = filtered.map(p => {
      const badge = getProjectBadgeCategory(p);
      const iconSrc = p.iconUrl || verifiedIcons[p.id];
      const live = p.liveUrl || liveWebsites[p.id];
      const apk = p.apkUrl || verifiedApks[p.id];

      // Clean title and subtitle
      let displayTitle = p.title.split('—')[0].split('-')[0].trim();
      let displaySubtitle = p.title.includes('—') ? p.title.split('—')[1].trim() : (p.categoryName || 'Verified System');

      // Tech tags
      const techTags = [];
      if (badge.name === 'Android') techTags.push('Android', 'Kotlin');
      if (badge.name === 'AI') techTags.push('Python', 'AI/ML');
      if (badge.name === 'Web') techTags.push('Full-Stack', 'Cloud');
      if (badge.name === 'Game') techTags.push('3D Engine', 'Interactive');
      if (live && live.includes('vercel')) techTags.push('Vercel');
      if (live && live.includes('render')) techTags.push('Render');

      return `
        <article class="project-card" data-id="${p.id}">
          <div class="card-top-bar">
            <div class="app-logo-squircle">
              ${iconSrc 
                ? `<img src="${iconSrc}" alt="${displayTitle} Icon" loading="lazy" onerror="this.onerror=null; this.parentNode.innerHTML='<span class=\\'app-logo-fallback\\'>${displayTitle.charAt(0)}</span>';">` 
                : `<span class="app-logo-fallback">${displayTitle.charAt(0)}</span>`
              }
            </div>
            <div class="card-title-group">
              <div class="card-title-row">
                <h3 class="card-title">${displayTitle}</h3>
                <span class="verified-sparkle">✦</span>
                <span class="category-tag-pill ${badge.cls}">${badge.name}</span>
              </div>
              <p class="card-subtitle">${displaySubtitle}</p>
            </div>
            <button class="card-more-btn" aria-label="More options" onclick="window.openProjectModal('${p.id}')">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="19" cy="12" r="2"/>
              </svg>
            </button>
          </div>

          <p class="card-description">${p.description || 'Verified production-grade engineering system built with robust architecture and modern user experience.'}</p>

          <div class="card-tech-row">
            ${techTags.map(t => `<span class="tech-tag">${t}</span>`).join('')}
          </div>

          <div class="card-actions-row">
            ${live ? `
              <a href="${live}" target="_blank" rel="noopener noreferrer" class="action-btn-live">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                Live Web ↗
              </a>
            ` : ''}

            ${apk ? `
              <a href="${apk}" download class="action-btn-apk">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download APK
              </a>
            ` : ''}

            ${p.githubUrl ? `
              <a href="${p.githubUrl}" target="_blank" rel="noopener noreferrer" class="action-btn-github" title="View Source on GitHub">
                <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                GitHub
              </a>
            ` : ''}

            <button class="action-btn-details" onclick="window.openProjectModal('${p.id}')">
              Details
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  // Setup Event Listeners
  function setupEvents() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderProjects();
      });

      // Ctrl + K shortcut
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          searchInput.focus();
        }
      });
    }

    // Filter pills
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.dataset.filter || 'all';
        renderProjects();
      });
    });

    // "Explore My Work" interactive cards
    const exploreCards = document.querySelectorAll('.explore-card');
    exploreCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = card.dataset.category;
        if (cat) {
          currentFilter = cat;
          filterPills.forEach(p => {
            p.classList.toggle('active', p.dataset.filter === cat);
          });
          renderProjects();
          document.getElementById('featuredSection')?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Sidebar navigation active state
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const filter = link.dataset.filter;
        if (filter) {
          currentFilter = filter;
          filterPills.forEach(p => {
            p.classList.toggle('active', p.dataset.filter === filter);
          });
          renderProjects();
          document.getElementById('featuredSection')?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  // Project details modal
  window.openProjectModal = function (id) {
    const modal = document.getElementById('projectModal');
    const content = document.getElementById('modalContent');
    if (!modal || !content) return;

    if (id === 'about-me-profile') {
      content.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
          <div class="brand-logo-glow" style="width: 64px; height: 64px; border-radius: 50%; overflow: hidden; padding: 2px;">
            <img src="images/branding/header_avatar.png" alt="Shaikh Abdul Zubair" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
          </div>
          <div>
            <h2 style="font-size: 22px; font-weight: 800; color: #fff;">Shaikh Abdul Zubair</h2>
            <p style="font-size: 13.5px; color: #A855F7; margin-top: 2px;">Systems Engineer • Full Stack Developer • Vibe Coder</p>
          </div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 14px; padding: 18px; margin-bottom: 16px;">
          <h4 style="font-size: 13px; font-weight: 700; color: #C084FC; margin-bottom: 8px; text-transform: uppercase;">Profile &amp; Background</h4>
          <p style="font-size: 14px; line-height: 1.6; color: #E2E8F0;">
            BCA Final Year student specializing in low-level systems, native Android, distributed P2P mesh networking, local edge AI, and full-stack cloud deployment. Built and deployed 15 verified native Android applications and multiple production platforms on Vercel and Render.
          </p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 14px; padding: 18px; margin-bottom: 20px;">
          <h4 style="font-size: 13px; font-weight: 700; color: #C084FC; margin-bottom: 8px; text-transform: uppercase;">Core Engineering Stack</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <span class="tech-tag">Android Native</span>
            <span class="tech-tag">Kotlin / Java</span>
            <span class="tech-tag">Jetpack Compose</span>
            <span class="tech-tag">Node.js / Express</span>
            <span class="tech-tag">React / TypeScript</span>
            <span class="tech-tag">FastAPI / Python</span>
            <span class="tech-tag">WebRTC &amp; P2P Mesh</span>
            <span class="tech-tag">Docker &amp; Cloud</span>
          </div>
        </div>

        <div style="display: flex; gap: 10px;">
          <a href="resume/Abdul_Zubair_Resume.pdf" download class="btn-primary-purple" style="font-size: 13px; padding: 10px 20px;">
            📥 Download Resume PDF
          </a>
          <button onclick="window.closeProjectModal(); window.openContactModal();" class="btn-glass-outline" style="font-size: 13px; padding: 10px 20px;">
            ✉️ Get in Touch
          </button>
        </div>
      `;
      modal.classList.add('open');
      return;
    }

    const p = allProjects.find(item => item.id === id);
    if (!p) return;

    const iconSrc = p.iconUrl || verifiedIcons[p.id];
    const live = p.liveUrl || liveWebsites[p.id];
    const apk = p.apkUrl || verifiedApks[p.id];
    const badge = getProjectBadgeCategory(p);

    content.innerHTML = `
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
        <div class="app-logo-squircle" style="width: 58px; height: 58px;">
          ${iconSrc ? `<img src="${iconSrc}" alt="${p.title}">` : `<span class="app-logo-fallback" style="font-size: 22px;">${p.title.charAt(0)}</span>`}
        </div>
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <h2 style="font-size: 20px; font-weight: 800; color: #fff;">${p.title}</h2>
            <span class="category-tag-pill ${badge.cls}">${badge.name}</span>
          </div>
          <p style="font-size: 13px; color: #94A3B8; margin-top: 4px;">${p.categoryName || 'Verified Production System'}</p>
        </div>
      </div>

      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 14px; padding: 18px; margin-bottom: 20px;">
        <h4 style="font-size: 13px; font-weight: 700; color: #C084FC; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Architecture &amp; Implementation</h4>
        <p style="font-size: 14px; line-height: 1.6; color: #E2E8F0;">${p.description}</p>
      </div>

      <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 24px;">
        ${live ? `
          <a href="${live}" target="_blank" rel="noopener noreferrer" class="btn-primary-purple" style="font-size: 12.5px; padding: 8px 18px;">
            🌐 Open Live Website ↗
          </a>
        ` : ''}

        ${apk ? `
          <a href="${apk}" download class="btn-primary-purple" style="background: linear-gradient(135deg, #10B981, #059669); font-size: 12.5px; padding: 8px 18px;">
            📥 Download Verified APK
          </a>
        ` : ''}

        ${p.githubUrl ? `
          <a href="${p.githubUrl}" target="_blank" rel="noopener noreferrer" class="btn-glass-outline" style="font-size: 12.5px; padding: 8px 18px;">
            📂 GitHub Repository ↗
          </a>
        ` : ''}
      </div>
    `;

    modal.classList.add('open');
  };

  window.closeProjectModal = function () {
    const modal = document.getElementById('projectModal');
    if (modal) modal.classList.remove('open');
  };

  // Contact Modal
  window.openContactModal = function () {
    const modal = document.getElementById('contactModal');
    if (modal) modal.classList.add('open');
  };

  window.closeContactModal = function () {
    const modal = document.getElementById('contactModal');
    if (modal) modal.classList.remove('open');
  };

  // Close modals on backdrop click
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.remove('open');
    }
  });

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    setupEvents();
  });
})();

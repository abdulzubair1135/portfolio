/**
 * ============================================================================
 * PROJECT: CURSOR SWARM — INTERACTIVE MULTI-CURSOR ENGINE
 * Developer: Shaikh Abdul Zubair
 * Inspired by viral multi-cursor studio & Figma multiplayer swarm demonstrations
 * ============================================================================
 */

(function () {
  'use strict';

  // Preset Cursor Agents Pool with Distinct Visual Identities & Roles
  const AGENT_PROFILES = [
    { name: 'Alex', role: 'Lead Architect', color: '#5B8CFF', accent: 'rgba(91, 140, 255, 0.25)' },
    { name: 'Maya', role: 'Design Systems', color: '#FF4D6D', accent: 'rgba(255, 77, 109, 0.25)' },
    { name: 'Leo', role: 'Android Core', color: '#45D6A0', accent: 'rgba(69, 214, 160, 0.25)' },
    { name: 'Elena', role: 'AI Neural Matrix', color: '#FFC857', accent: 'rgba(255, 200, 87, 0.25)' },
    { name: 'Sora', role: 'WebGL & Shaders', color: '#A78BFA', accent: 'rgba(167, 139, 250, 0.25)' },
    { name: 'Kai', role: 'Motion Choreographer', color: '#06B6D4', accent: 'rgba(6, 182, 212, 0.25)' },
    { name: 'Nia', role: 'Typography Director', color: '#E2E8F0', accent: 'rgba(226, 232, 240, 0.25)' },
    { name: 'Zack', role: 'Low-Level Systems', color: '#F43F5E', accent: 'rgba(244, 63, 94, 0.25)' },
    { name: 'Rui', role: 'Game Physics', color: '#FB923C', accent: 'rgba(251, 146, 60, 0.25)' },
    { name: 'Tariq', role: 'FullStack Cloud', color: '#38BDF8', accent: 'rgba(56, 189, 248, 0.25)' },
    { name: 'Mira', role: 'Security & Edge', color: '#34D399', accent: 'rgba(52, 211, 153, 0.25)' },
    { name: 'Aria', role: 'Creative Explorer', color: '#F472B6', accent: 'rgba(244, 114, 182, 0.25)' },
    { name: 'Dante', role: 'APK Compiler', color: '#4ADE80', accent: 'rgba(74, 222, 128, 0.25)' },
    { name: 'Chloe', role: 'Interaction QA', color: '#FBBF24', accent: 'rgba(251, 191, 36, 0.25)' },
    { name: 'Javier', role: 'Mesh Network', color: '#818CF8', accent: 'rgba(129, 140, 248, 0.25)' },
    { name: 'Zubair Assistant', role: 'Swarm Coordinator', color: '#FF3366', accent: 'rgba(255, 51, 102, 0.25)' }
  ];

  class CursorAgent {
    constructor(profile, id, bounds) {
      this.id = id;
      this.name = profile.name;
      this.role = profile.role;
      this.color = profile.color;
      this.accent = profile.accent;

      // Position & Velocity
      this.x = Math.random() * bounds.width;
      this.y = Math.random() * bounds.height;
      this.targetX = this.x;
      this.targetY = this.y;
      this.vx = 0;
      this.vy = 0;
      this.angle = 0;
      this.speedFactor = 0.04 + Math.random() * 0.04;

      // Trail History (for Canvas Trail Rendering)
      this.trail = [];
      this.maxTrailLength = 12;

      // Interaction States
      this.isClicking = false;
      this.isSelecting = false;
      this.selectionStart = null;
      this.selectionEnd = null;
      this.activeTargetName = 'Exploring';

      // Internal timer for deterministic behavior cycles
      this.timer = Math.random() * 100;
      this.stateDuration = 180 + Math.random() * 200;
      this.currentAction = 'wander';

      // DOM Elements
      this.element = null;
      this.pointer = null;
      this.badge = null;
      this.initDOM();
    }

    initDOM() {
      const container = document.getElementById('swarm-overlay-container');
      if (!container) return;

      const cursorEl = document.createElement('div');
      cursorEl.className = 'swarm-cursor';
      cursorEl.id = `cursor-agent-${this.id}`;

      // Custom SVG Pointer filled with agent color and sleek dark outline
      cursorEl.innerHTML = `
        <svg class="swarm-cursor-pointer" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" 
                fill="${this.color}" 
                stroke="#090909" 
                stroke-width="1.2"/>
        </svg>
        <div class="swarm-cursor-badge" style="background: rgba(15, 16, 22, 0.9); color: ${this.color};">
          <span class="swarm-cursor-dot" style="background: ${this.color};"></span>
          <span>${this.name} (${this.role})</span>
        </div>
      `;

      container.appendChild(cursorEl);
      this.element = cursorEl;
      this.pointer = cursorEl.querySelector('.swarm-cursor-pointer');
      this.badge = cursorEl.querySelector('.swarm-cursor-badge');
    }

    update(bounds, mousePos, scrollY) {
      this.timer++;

      // Smooth Lerp toward target
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      
      this.vx = dx * this.speedFactor;
      this.vy = dy * this.speedFactor;

      this.x += this.vx;
      this.y += this.vy;

      // Compute cursor tilt angle along trajectory
      const velocityMag = Math.hypot(this.vx, this.vy);
      if (velocityMag > 0.5) {
        const rawAngle = Math.atan2(this.vy, this.vx) * (180 / Math.PI) - 45;
        this.angle += (rawAngle - this.angle) * 0.1;
      }

      // Avoidance / Flocking around Real User Mouse
      if (mousePos && mousePos.active) {
        const distToUser = Math.hypot(this.x - mousePos.x, this.y - mousePos.y);
        if (distToUser < 100) {
          // Gently yield and steer away
          const repelAngle = Math.atan2(this.y - mousePos.y, this.x - mousePos.x);
          this.targetX += Math.cos(repelAngle) * 35;
          this.targetY += Math.sin(repelAngle) * 35;
        }
      }

      // Record Trail History
      this.trail.unshift({ x: this.x, y: this.y, age: 1.0 });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.pop();
      }

      // Update Trail Aging
      for (let i = 0; i < this.trail.length; i++) {
        this.trail[i].age -= 0.08;
      }

      // Apply transform to DOM element with GPU acceleration
      if (this.element) {
        this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
        if (this.pointer) {
          this.pointer.style.transform = `rotate(${this.angle * 0.3}deg)`;
        }
      }
    }

    setTarget(x, y, action = 'wander', targetName = '') {
      this.targetX = x;
      this.targetY = y;
      this.currentAction = action;
      if (targetName) this.activeTargetName = targetName;
    }

    triggerClick(x, y) {
      this.isClicking = true;
      if (this.element) this.element.classList.add('is-clicking');

      // Create expanding ripple effect on DOM
      createRipple(x || this.x, y || this.y, this.color);

      setTimeout(() => {
        this.isClicking = false;
        if (this.element) this.element.classList.remove('is-clicking');
      }, 350);
    }

    startSelection(startX, startY) {
      this.isSelecting = true;
      this.selectionStart = { x: startX, y: startY };
      this.selectionEnd = { x: startX, y: startY };
      if (this.element) this.element.classList.add('is-selecting');
    }

    updateSelection(currentX, currentY) {
      if (this.isSelecting) {
        this.selectionEnd = { x: currentX, y: currentY };
      }
    }

    finishSelection() {
      this.isSelecting = false;
      this.selectionStart = null;
      this.selectionEnd = null;
      if (this.element) this.element.classList.remove('is-selecting');
    }

    destroy() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
  }

  function createRipple(x, y, color) {
    const container = document.getElementById('swarm-overlay-container');
    if (!container) return;

    const ripple = document.createElement('div');
    ripple.className = 'swarm-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = '60px';
    ripple.style.height = '60px';
    ripple.style.border = `2px solid ${color}`;
    ripple.style.boxShadow = `0 0 14px ${color}`;

    container.appendChild(ripple);
    setTimeout(() => {
      if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
    }, 700);
  }

  // ============================================================================
  // SWARM CONTROLLER & CHOREOGRAPHY MANAGER
  // ============================================================================
  class CursorSwarmManager {
    constructor() {
      this.agents = [];
      this.canvas = document.getElementById('swarm-canvas');
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      
      this.bounds = { width: window.innerWidth, height: window.innerHeight };
      this.mousePos = { x: -1000, y: -1000, active: false };
      this.isPaused = false;
      this.maxAgents = window.innerWidth < 768 ? 6 : 14;

      this.currentPhase = 'hero';
      this.telemetryActionEl = document.getElementById('hudCurrentAction');
      this.telemetryCountEl = document.getElementById('hudCursorCount');

      this.initCanvas();
      this.spawnAgents();
      this.bindEvents();
      this.setupChoreographyLoop();
      this.startRenderLoop();
    }

    initCanvas() {
      if (!this.canvas) return;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = this.bounds.width * this.dpr;
      this.canvas.height = this.bounds.height * this.dpr;
      this.canvas.style.width = `${this.bounds.width}px`;
      this.canvas.style.height = `${this.bounds.height}px`;
      if (this.ctx) this.ctx.scale(this.dpr, this.dpr);
    }

    spawnAgents() {
      // Clear existing
      this.agents.forEach(a => a.destroy());
      this.agents = [];

      const count = Math.min(this.maxAgents, AGENT_PROFILES.length);
      for (let i = 0; i < count; i++) {
        const agent = new CursorAgent(AGENT_PROFILES[i], i, this.bounds);
        this.agents.push(agent);
      }

      if (this.telemetryCountEl) {
        this.telemetryCountEl.textContent = `${this.agents.length} AGENTS`;
      }
    }

    bindEvents() {
      window.addEventListener('resize', () => {
        this.bounds.width = window.innerWidth;
        this.bounds.height = window.innerHeight;
        this.initCanvas();
      });

      window.addEventListener('mousemove', (e) => {
        this.mousePos.x = e.clientX;
        this.mousePos.y = e.clientY;
        this.mousePos.active = true;
      });

      window.addEventListener('mouseleave', () => {
        this.mousePos.active = false;
      });

      // User click triggers closest agents to respond
      window.addEventListener('click', (e) => {
        createRipple(e.clientX, e.clientY, '#FFFFFF');
        
        // Pick 2 closest agents and rush toward click
        const sorted = [...this.agents].sort((a, b) => {
          return Math.hypot(a.x - e.clientX, a.y - e.clientY) - Math.hypot(b.x - e.clientX, b.y - e.clientY);
        });

        sorted.slice(0, 2).forEach((agent, idx) => {
          const offsetX = (idx === 0 ? -25 : 25);
          const offsetY = (idx === 0 ? -15 : 20);
          agent.setTarget(e.clientX + offsetX, e.clientY + offsetY, 'click_react', 'Coordinating with User');
          setTimeout(() => agent.triggerClick(), 300);
        });
      });

      // Pause when tab is not visible
      document.addEventListener('visibilitychange', () => {
        this.isPaused = document.hidden;
      });
    }

    // Scroll-Driven Choreography Planner
    setupChoreographyLoop() {
      setInterval(() => {
        if (this.isPaused) return;
        this.planSwarmTasks();
      }, 3500);
    }

    planSwarmTasks() {
      // Find prominent on-screen elements to interact with
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      // 1. Hero Headline Target
      const heroTitle = document.getElementById('heroMassiveTitle');
      const startBtn = document.getElementById('btnStartExploring');
      const resumeBtn = document.getElementById('btnDownloadResume');
      const apkTabBtn = document.querySelector('.btn-apk-tab');
      const apkCards = Array.from(document.querySelectorAll('.project-card[data-is-apk="true"]'));
      const visibleCards = Array.from(document.querySelectorAll('.project-card')).filter(card => {
        const r = card.getBoundingClientRect();
        return r.top >= 0 && r.bottom <= vh + 100;
      });

      // Assign dynamic tasks based on view
      this.agents.forEach((agent, i) => {
        const rand = Math.random();

        // Behavior A: Construct Hero Letters / Select Words
        if (heroTitle && heroTitle.getBoundingClientRect().bottom > 50 && rand < 0.35) {
          const rect = heroTitle.getBoundingClientRect();
          const targetX = rect.left + Math.random() * rect.width;
          const targetY = rect.top + Math.random() * rect.height;

          agent.setTarget(targetX, targetY, 'inspect_heading', 'Inspecting Typography');
          if (Math.random() < 0.4) {
            agent.startSelection(targetX - 40, targetY - 10);
            setTimeout(() => agent.updateSelection(targetX + 60, targetY + 20), 400);
            setTimeout(() => agent.finishSelection(), 1800);
          }
        }
        // Behavior B: Hover & Click APK Download Buttons
        else if (apkCards.length > 0 && rand < 0.65) {
          const card = apkCards[i % apkCards.length];
          const rect = card.getBoundingClientRect();
          if (rect.top < vh && rect.bottom > 0) {
            const downloadBtn = card.querySelector('.btn-card-apk');
            const targetEl = downloadBtn || card;
            const bRect = targetEl.getBoundingClientRect();
            
            agent.setTarget(bRect.left + bRect.width / 2, bRect.top + bRect.height / 2, 'inspect_apk', `Testing ${card.id.replace('card-', '')}`);
            setTimeout(() => agent.triggerClick(), 1200);
          } else {
            this.wanderAgent(agent);
          }
        }
        // Behavior C: Interact with CTA Buttons
        else if (startBtn && startBtn.getBoundingClientRect().top < vh && rand < 0.85) {
          const btn = (i % 2 === 0 ? startBtn : resumeBtn) || startBtn;
          const rect = btn.getBoundingClientRect();
          agent.setTarget(rect.left + Math.random() * rect.width, rect.top + rect.height / 2, 'hover_cta', 'Hovering CTA Button');
          if (Math.random() < 0.3) {
            setTimeout(() => agent.triggerClick(), 1000);
          }
        }
        // Behavior D: Inspect project cards currently on screen
        else if (visibleCards.length > 0) {
          const card = visibleCards[i % visibleCards.length];
          const rect = card.getBoundingClientRect();
          agent.setTarget(rect.left + 30 + Math.random() * (rect.width - 60), rect.top + 20 + Math.random() * 80, 'inspect_card', 'Auditing Architecture');
        }
        // Behavior E: Natural organic wander
        else {
          this.wanderAgent(agent);
        }
      });

      // Update Telemetry Action Display
      const activeAgent = this.agents[Math.floor(Math.random() * this.agents.length)];
      if (this.telemetryActionEl && activeAgent) {
        this.telemetryActionEl.textContent = `${activeAgent.name}: ${activeAgent.activeTargetName}`;
      }
    }

    wanderAgent(agent) {
      const pad = 80;
      const targetX = pad + Math.random() * (this.bounds.width - pad * 2);
      const targetY = pad + Math.random() * (this.bounds.height - pad * 2);
      agent.setTarget(targetX, targetY, 'wander', 'Patrolling System');
    }

    // High Performance 60FPS Render Loop
    startRenderLoop() {
      const render = () => {
        requestAnimationFrame(render);
        if (this.isPaused) return;

        // Clear Canvas
        if (this.ctx) {
          this.ctx.clearRect(0, 0, this.bounds.width, this.bounds.height);
        }

        // Update each Agent & Draw Canvas Trails / Selection Boxes
        for (let i = 0; i < this.agents.length; i++) {
          const agent = this.agents[i];
          agent.update(this.bounds, this.mousePos, window.scrollY);

          if (this.ctx) {
            // Draw Glowing Trail
            if (agent.trail.length > 1) {
              this.ctx.beginPath();
              this.ctx.moveTo(agent.trail[0].x, agent.trail[0].y);
              for (let j = 1; j < agent.trail.length; j++) {
                this.ctx.lineTo(agent.trail[j].x, agent.trail[j].y);
              }
              this.ctx.strokeStyle = agent.color;
              this.ctx.lineWidth = 1.8;
              this.ctx.globalAlpha = 0.35;
              this.ctx.stroke();
              this.ctx.globalAlpha = 1.0;
            }

            // Draw Selection Rectangle if agent is selecting
            if (agent.isSelecting && agent.selectionStart && agent.selectionEnd) {
              const sx = agent.selectionStart.x;
              const sy = agent.selectionStart.y;
              const ex = agent.selectionEnd.x;
              const ey = agent.selectionEnd.y;
              const w = ex - sx;
              const h = ey - sy;

              this.ctx.fillStyle = agent.accent;
              this.ctx.fillRect(sx, sy, w, h);
              this.ctx.strokeStyle = agent.color;
              this.ctx.lineWidth = 1;
              this.ctx.strokeRect(sx, sy, w, h);
            }
          }
        }
      };

      requestAnimationFrame(render);
    }

    setCursorCount(count) {
      this.maxAgents = count;
      this.spawnAgents();
    }
  }

  // Initialize Swarm Engine once DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    window.cursorSwarm = new CursorSwarmManager();

    // Setup Telemetry HUD Controls
    const countToggleBtn = document.getElementById('hudToggleCount');
    if (countToggleBtn) {
      countToggleBtn.addEventListener('click', () => {
        const counts = [14, 8, 4, 18];
        const next = counts[(counts.indexOf(window.cursorSwarm.maxAgents) + 1) % counts.length];
        window.cursorSwarm.setCursorCount(next);
      });
    }

    // Setup GSAP Kinetic Typography Animations
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      // Kinetic Character Assembly on Hero Title
      const heroChars = document.querySelectorAll('.hero-title-massive .char-span');
      if (heroChars.length > 0) {
        gsap.from(heroChars, {
          y: 40,
          opacity: 0,
          scale: 0.9,
          stagger: 0.03,
          duration: 1.2,
          ease: 'power3.out'
        });
      }

      // ScrollTrigger: Hero Zoom & Parallax
      gsap.to('.hero-title-massive', {
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        },
        scale: 0.92,
        opacity: 0.35,
        y: -50
      });

      // ScrollTrigger: Project Cards Reveal
      gsap.utils.toArray('.project-card').forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            toggleActions: 'play none none reverse'
          },
          y: 30,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          delay: (i % 3) * 0.08
        });
      });
    }
  });

})();

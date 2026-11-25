/**
 * ZUBAIR WORLD — Database Repository & Data Store
 * Fully compatible with PostgreSQL (Prisma) and local persistent file storage
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_FILE = path.join(__dirname, 'database_store.json');
const PROJECTS_SOURCE = path.join(__dirname, '..', 'projects_data.json');

// Initial seed data generator
function getInitialData() {
  const rawProjects = fs.existsSync(PROJECTS_SOURCE)
    ? JSON.parse(fs.readFileSync(PROJECTS_SOURCE, 'utf8'))
    : [];

  const categories = [
    { id: 'cat-android', name: 'Android Apps & APKs', slug: 'apk', description: 'Native Android and P2P mesh offline applications' },
    { id: 'cat-ai', name: 'AI & Autonomous Systems', slug: 'ai', description: 'Edge LLMs, PyTorch neural models, and agentic workflows' },
    { id: 'cat-game', name: 'Game Development', slug: 'game', description: 'Unity 3D and Godot 4 game engine projects' },
    { id: 'cat-web', name: 'Web & Cloud Platforms', slug: 'website', description: 'Full-stack web applications and microservices' },
    { id: 'cat-software', name: 'Software & Utilities', slug: 'software', description: 'Systems algorithms, low-level utilities, and CLI tooling' }
  ];

  // 7 3D World Zones with realistic spatial layout
  const world_zones = [
    { id: 'zone-garage', name: 'Home Garage', slug: 'home-garage', description: 'Starting garage & pilot terminal', position_x: 0, position_y: 0, position_z: 0 },
    { id: 'zone-android', name: 'Android Cyber Metropolis', slug: 'android-city', description: 'Futuristic city showcasing native Android & mesh apps', position_x: 75, position_y: 0, position_z: -850 },
    { id: 'zone-ai', name: 'AI Research Facility', slug: 'ai-facility', description: 'Quantum computing labs and edge intelligence server racks', position_x: -60, position_y: -2, position_z: -1400 },
    { id: 'zone-gaming', name: 'Gaming Realm', slug: 'gaming-realm', description: 'Mountain pass and battle arena for RTS and RPG game engines', position_x: 65, position_y: 10, position_z: -1980 },
    { id: 'zone-web', name: 'Web & Cloud Metropolis', slug: 'web-metro', description: 'High-tech glass towers for cloud services and web platforms', position_x: -35, position_y: 2, position_z: -2420 },
    { id: 'zone-software', name: 'Software Workshop', slug: 'software-workshop', description: 'Industrial technology zone for algorithms and utilities', position_x: 20, position_y: 0, position_z: -2700 },
    { id: 'zone-destination', name: 'Sunset Overlook', slug: 'final-destination', description: 'Scenic destination with master resume downloads', position_x: 0, position_y: 0, position_z: -2900 }
  ];

  // Map 69 projects to World Objects with 3D positions
  const world_objects = [];
  const projects = rawProjects.map((p, idx) => {
    let zoneId = 'zone-web';
    let zoneX = 0;
    let zoneZ = -100;

    if (p.apkUrl || p.category === 'offline') {
      zoneId = 'zone-android';
      zoneX = 55 + (idx % 4) * 22;
      zoneZ = -780 - (idx % 6) * 45;
    } else if (p.category === 'ai' || (p.sections && p.sections.includes('ai'))) {
      zoneId = 'zone-ai';
      zoneX = -45 - (idx % 3) * 25;
      zoneZ = -1320 - (idx % 5) * 40;
    } else if (p.category === 'game' || (p.sections && p.sections.includes('game'))) {
      zoneId = 'zone-gaming';
      zoneX = 45 + (idx % 4) * 20;
      zoneZ = -1900 - (idx % 5) * 40;
    } else if (p.category === 'systems' || (p.sections && p.sections.includes('software'))) {
      zoneId = 'zone-software';
      zoneX = 10 + (idx % 3) * 18;
      zoneZ = -2620 - (idx % 4) * 35;
    } else {
      zoneId = 'zone-web';
      zoneX = -25 - (idx % 3) * 22;
      zoneZ = -2320 - (idx % 6) * 40;
    }

    world_objects.push({
      id: 'obj-' + p.id,
      project_id: p.id,
      zone_id: zoneId,
      position_x: zoneX,
      position_y: 0.5,
      position_z: zoneZ,
      interaction_radius: 7.5
    });

    return {
      id: p.id,
      name: p.title,
      slug: p.id,
      category_id: p.apkUrl ? 'cat-android' : (p.category === 'ai' ? 'cat-ai' : (p.category === 'game' ? 'cat-game' : 'cat-web')),
      description: p.description,
      long_description: `${p.title} is an engineering project architected by Shaikh Abdul Zubair. Built with production-ready standards, modern frameworks, and robust system performance.`,
      featured: Boolean(p.apkUrl || p.liveUrl),
      status: 'published',
      sort_order: idx + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      screenshot: `images/screenshots/${p.id}.png`,
      apkUrl: p.apkUrl || '',
      liveUrl: p.liveUrl || '',
      liveLabel: p.liveLabel || '',
      githubUrl: p.githubUrl || 'https://github.com/abdulzubair1135/my-all-projects'
    };
  });

  // Admin user (Shaikh Abdul Zubair)
  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync('zubair1135@admin', salt);

  const users = [
    {
      id: 'usr-admin-1',
      name: 'Shaikh Abdul Zubair',
      email: 'abdulzubair221@gmail.com',
      password_hash: password_hash,
      role: 'admin',
      created_at: new Date().toISOString()
    }
  ];

  return {
    users,
    categories,
    projects,
    world_zones,
    world_objects,
    contact_messages: [],
    visitor_analytics: [],
    site_settings: {
      site_title: "Shaikh Abdul Zubair | Zubair's Digital Highway & World",
      owner_email: "abdulzubair221@gmail.com",
      owner_phone: "+91 9663933073",
      github_username: "abdulzubair1135",
      resume_pdf: "resume/Shaikh_Abdul_Zubair_Resume.pdf",
      portfolio_pdf: "resume/Shaikh_Abdul_Zubair_Master_Portfolio_Resume.pdf"
    }
  };
}

class DatabaseStore {
  constructor() {
    this.data = null;
    this.load();
  }

  load() {
    if (fs.existsSync(DATA_FILE)) {
      try {
        this.data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      } catch (e) {
        console.warn('Error reading database_store.json, creating initial data:', e);
        this.data = getInitialData();
        this.save();
      }
    } else {
      this.data = getInitialData();
      this.save();
    }
  }

  save() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf8');
  }

  // --- Projects ---
  getProjects(query = {}) {
    let list = [...this.data.projects];
    if (query.category) {
      list = list.filter(p => p.category_id === query.category || p.slug.includes(query.category));
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (query.featured) {
      list = list.filter(p => p.featured === true);
    }
    return list;
  }

  getProjectByIdOrSlug(idOrSlug) {
    return this.data.projects.find(p => p.id === idOrSlug || p.slug === idOrSlug);
  }

  createProject(project) {
    const newProj = {
      ...project,
      id: project.id || 'proj-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.projects.push(newProj);
    this.save();
    return newProj;
  }

  updateProject(id, updates) {
    const idx = this.data.projects.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.projects[idx] = {
      ...this.data.projects[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.data.projects[idx];
  }

  deleteProject(id) {
    const idx = this.data.projects.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.projects.splice(idx, 1);
    this.save();
    return true;
  }

  // --- World Zones & Objects ---
  getWorldZones() {
    return this.data.world_zones;
  }

  getWorldObjects() {
    return this.data.world_objects;
  }

  updateWorldObjectPosition(id, position) {
    const obj = this.data.world_objects.find(o => o.id === id || o.project_id === id);
    if (!obj) return null;
    if (position.x !== undefined) obj.position_x = position.x;
    if (position.y !== undefined) obj.position_y = position.y;
    if (position.z !== undefined) obj.position_z = position.z;
    this.save();
    return obj;
  }

  // --- Categories ---
  getCategories() {
    return this.data.categories;
  }

  // --- Contact Messages ---
  addContactMessage(msg) {
    const newMsg = {
      id: 'msg-' + Date.now(),
      name: msg.name,
      email: msg.email,
      subject: msg.subject || 'Portfolio Inquiry',
      message: msg.message,
      created_at: new Date().toISOString(),
      status: 'unread'
    };
    this.data.contact_messages.push(newMsg);
    this.save();
    return newMsg;
  }

  getContactMessages() {
    return this.data.contact_messages;
  }

  // --- Visitor Analytics ---
  logAnalyticsEvent(event) {
    const ev = {
      id: 'ev-' + Date.now(),
      event_type: event.event_type || 'interaction',
      project_id: event.project_id || null,
      created_at: new Date().toISOString()
    };
    this.data.visitor_analytics.push(ev);
    if (this.data.visitor_analytics.length > 500) {
      this.data.visitor_analytics.shift();
    }
    this.save();
    return ev;
  }

  getAnalyticsSummary() {
    const totalEvents = this.data.visitor_analytics.length;
    const projectViews = this.data.visitor_analytics.filter(e => e.event_type === 'project_view').length;
    const downloads = this.data.visitor_analytics.filter(e => e.event_type === 'download').length;
    return { totalEvents, projectViews, downloads };
  }

  // --- Users & Auth ---
  findUserByEmail(email) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }
}

module.exports = new DatabaseStore();

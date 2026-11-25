/**
 * ZUBAIR WORLD — Node.js Express Backend REST API
 * Production-ready server with JWT auth, helmet security, and CORS
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_zubair_world_jwt_key_2026';

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allows WebGL and cross-origin assets
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Auth Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

// ==========================================
// PUBLIC API ENDPOINTS
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'Zubair World Engine API', time: new Date().toISOString() });
});

// GET /api/projects (with filtering & search)
app.get('/api/projects', (req, res) => {
  const projects = db.getProjects(req.query);
  res.json({ total: projects.length, data: projects });
});

// GET /api/projects/featured
app.get('/api/projects/featured', (req, res) => {
  const featured = db.getProjects({ featured: true });
  res.json({ total: featured.length, data: featured });
});

// GET /api/projects/:slug
app.get('/api/projects/:slug', (req, res) => {
  const project = db.getProjectByIdOrSlug(req.params.slug);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json({ data: project });
});

// GET /api/categories
app.get('/api/categories', (req, res) => {
  res.json({ data: db.getCategories() });
});

// GET /api/world/zones
app.get('/api/world/zones', (req, res) => {
  res.json({ data: db.getWorldZones() });
});

// GET /api/world/objects (3D positions of interactive project waypoints)
app.get('/api/world/objects', (req, res) => {
  res.json({ data: db.getWorldObjects() });
});

// POST /api/contact (Receive contact messages)
app.post('/api/contact', (req, res) => {
  const { name, email, message, subject } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Please provide name, email, and message.' });
  }

  const savedMsg = db.addContactMessage({ name, email, message, subject });
  res.status(201).json({ success: true, message: 'Message sent successfully!', data: savedMsg });
});

// POST /api/analytics/event (Log visitor events)
app.post('/api/analytics/event', (req, res) => {
  const ev = db.logAnalyticsEvent(req.body);
  res.status(201).json({ success: true, data: ev });
});

// ==========================================
// ADMIN API ENDPOINTS (Protected)
// ==========================================

// POST /api/admin/auth/login
app.post('/api/admin/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

// POST /api/admin/auth/logout
app.post('/api/admin/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/admin/dashboard
app.get('/api/admin/dashboard', requireAdmin, (req, res) => {
  const projects = db.getProjects();
  const messages = db.getContactMessages();
  const analytics = db.getAnalyticsSummary();
  const apkCount = projects.filter(p => p.apkUrl).length;

  res.json({
    metrics: {
      totalProjects: projects.length,
      apkApplications: apkCount,
      totalMessages: messages.length,
      unreadMessages: messages.filter(m => m.status === 'unread').length,
      analytics
    }
  });
});

// GET /api/admin/projects
app.get('/api/admin/projects', requireAdmin, (req, res) => {
  res.json({ data: db.getProjects() });
});

// POST /api/admin/projects
app.post('/api/admin/projects', requireAdmin, (req, res) => {
  const created = db.createProject(req.body);
  res.status(201).json({ success: true, data: created });
});

// PUT /api/admin/projects/:id
app.put('/api/admin/projects/:id', requireAdmin, (req, res) => {
  const updated = db.updateProject(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Project not found' });
  res.json({ success: true, data: updated });
});

// DELETE /api/admin/projects/:id
app.delete('/api/admin/projects/:id', requireAdmin, (req, res) => {
  const deleted = db.deleteProject(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Project not found' });
  res.json({ success: true, message: 'Project deleted' });
});

// PUT /api/admin/world/objects/:id (Assign/update 3D world coordinates)
app.put('/api/admin/world/objects/:id', requireAdmin, (req, res) => {
  const updated = db.updateWorldObjectPosition(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'World object not found' });
  res.json({ success: true, data: updated });
});

// GET /api/admin/messages
app.get('/api/admin/messages', requireAdmin, (req, res) => {
  res.json({ data: db.getContactMessages() });
});

// GET /api/admin/analytics
app.get('/api/admin/analytics', requireAdmin, (req, res) => {
  res.json({ data: db.getAnalyticsSummary() });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Zubair World Backend API running at http://localhost:${PORT}`);
  });
}

module.exports = app;

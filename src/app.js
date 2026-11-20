'use strict';

const express = require('express');
const path = require('path');
const userRoutes = require('./routes/userRoutes');

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api', userRoutes);

// ── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅  Validify Kit Demo running on http://localhost:${PORT}`);
  console.log(`   API health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;

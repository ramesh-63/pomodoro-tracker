const express = require('express');
const db = require('../db');
const router = express.Router();

// POST /api/sessions - save a study session
router.post('/', async (req, res) => {
  const { subject, duration_minutes, completed } = req.body;

  // Basic validation
  if (!duration_minutes || !Number.isInteger(duration_minutes) || duration_minutes <= 0) {
    return res.status(400).json({ error: 'duration_minutes must be a positive whole number' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO sessions (subject, duration_minutes, completed) VALUES (?, ?, ?)',
      [subject || null, duration_minutes, completed ? 1 : 0]
    );

    res.status(201).json({
      id: result.insertId,
      subject: subject || null,
      duration_minutes,
      completed: completed ? 1 : 0
    });
  } catch (err) {
    console.error('POST /api/sessions failed:', err);
    res.status(500).json({ error: 'Failed to save session', details: err.message });
  }
  
});

// GET /api/sessions - return all sessions, newest first
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, subject, duration_minutes, started_at, completed FROM sessions ORDER BY started_at DESC, id DESC'
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/sessions/daily - total study minutes per day
router.get('/daily', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DATE(started_at) AS study_date,
              SUM(duration_minutes) AS total_minutes,
              COUNT(*) AS session_count
       FROM sessions
       WHERE completed = 1
       GROUP BY DATE(started_at)
       ORDER BY study_date DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch daily totals' });
  }
});

module.exports = router;
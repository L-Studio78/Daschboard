require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');

const app = express();

// Migration: fehlende Spalten automatisch anlegen
const applyMigrations = async () => {
  const migrations = [
    `ALTER TABLE books ADD COLUMN IF NOT EXISTS image_url TEXT;`,
    `ALTER TABLE books ADD COLUMN IF NOT EXISTS publish_year TEXT;`,
    `ALTER TABLE books ADD COLUMN IF NOT EXISTS page_count INTEGER;`,
    `ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn TEXT;`,
    `ALTER TABLE books ADD COLUMN IF NOT EXISTS ol_url TEXT;`,
    `ALTER TABLE books ADD COLUMN IF NOT EXISTS added_date TIMESTAMP;`
  ];

  for (const migration of migrations) {
    try {
      await pool.query(migration);
      console.log(`Migration ausgeführt: ${migration}`);
    } catch (err) {
      console.error(`Fehler bei Migration "${migration}":`, err.message);
    }
  }
  console.log('Alle Migrationen geprüft und angewendet.');
};

const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.DB_HOST || 'db', // 'db' is the service name in docker-compose
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

// Test route
app.get('/', (req, res) => {
  res.send('Hello from the Dashboard Backend!');
});

// Test DB connection
app.get('/test-db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    res.json({ message: 'Database connection successful!', time: result.rows[0] });
    client.release();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// --- Book Routes ---

// Get all books
app.get('/api/books', async (req, res) => {
  try {
    const allBooks = await pool.query('SELECT * FROM books ORDER BY created_at DESC');
    res.json(allBooks.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a new book
app.post(
  '/api/books',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('author').notEmpty().withMessage('Author is required'),
    // Optional: weitere Validierungen für rating, image_url etc.
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { title, author, rating, notes, image_url, publish_year, page_count, isbn, ol_url } = req.body;
      const added_date = new Date().toISOString();
      const newBook = await pool.query(
        `INSERT INTO books (title, author, rating, notes, image_url, publish_year, page_count, isbn, ol_url, added_date)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [title, author, rating, notes, image_url, publish_year, page_count, isbn, ol_url, added_date]
      );
      res.json(newBook.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server Error', details: err.message });
    }
  }
);

// Delete a book
app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteBook = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);

    if (deleteBook.rowCount === 0) {
      return res.status(404).json({ msg: 'Book not found' });
    }

    res.json({ msg: 'Book removed', book: deleteBook.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Habit Routes ---

// Get all habits with today's completion status
app.get('/api/habits', async (req, res) => {
  try {
    const query = `
      SELECT 
        h.id, 
        h.name, 
        h.created_at,
        EXISTS (SELECT 1 FROM habit_log hl WHERE hl.habit_id = h.id AND hl.completion_date = CURRENT_DATE) as completed_today
      FROM habits h
      ORDER BY h.created_at ASC
    `;
    const habits = await pool.query(query);
    res.json(habits.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a new habit
app.post('/api/habits', async (req, res) => {
  try {
    const { name } = req.body;
    const newHabit = await pool.query('INSERT INTO habits (name) VALUES($1) RETURNING *', [name]);
    res.json(newHabit.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Toggle a habit's completion for today
app.post('/api/habits/toggle/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().slice(0, 10); // Get YYYY-MM-DD

    // Check if it's already logged
    const existingLog = await pool.query('SELECT id FROM habit_log WHERE habit_id = $1 AND completion_date = $2', [id, today]);

    if (existingLog.rowCount > 0) {
      // If exists, delete it (un-complete)
      await pool.query('DELETE FROM habit_log WHERE id = $1', [existingLog.rows[0].id]);
      res.json({ completed: false });
    } else {
      // If not exists, insert it (complete)
      await pool.query('INSERT INTO habit_log (habit_id, completion_date) VALUES ($1, $2)', [id, today]);
      res.json({ completed: true });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a habit
app.delete('/api/habits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM habits WHERE id = $1', [id]);
    res.json({ msg: 'Habit deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get habit streaks
app.get('/api/habits/streaks', async (req, res) => {
  try {
    const habits = await pool.query('SELECT id, name FROM habits');
    const streaks = [];

    for (const habit of habits.rows) {
      const logs = await pool.query(
        'SELECT completion_date FROM habit_log WHERE habit_id = $1 ORDER BY completion_date DESC',
        [habit.id]
      );
      
      let currentStreak = 0;
      let lastCompletionDate = null;

      for (const log of logs.rows) {
        const completionDate = new Date(log.completion_date);
        // Normalize to local date for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (currentStreak === 0) {
          // First check: is it today or yesterday?
          if (completionDate.toDateString() === today.toDateString()) {
            currentStreak = 1;
          } else if (completionDate.toDateString() === yesterday.toDateString()) {
            currentStreak = 1;
          } else {
            break; // No streak today or yesterday, break
          }
        } else {
          // For subsequent days, check if it's the day before the last completed day
          const expectedPrevDay = new Date(lastCompletionDate);
          expectedPrevDay.setDate(lastCompletionDate.getDate() - 1);
          expectedPrevDay.setHours(0, 0, 0, 0);

          if (completionDate.toDateString() === expectedPrevDay.toDateString()) {
            currentStreak++;
          } else {
            break; // Streak broken
          }
        }
        lastCompletionDate = completionDate;
      }
      streaks.push({ habit_id: habit.id, name: habit.name, streak: currentStreak });
    }

    res.json(streaks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Learning Session Routes ---

// Add a learning session
app.post('/api/learning-sessions', async (req, res) => {
  try {
    const { duration_minutes } = req.body;
    const newSession = await pool.query(
      'INSERT INTO learning_sessions (duration_minutes) VALUES ($1) RETURNING *',
      [duration_minutes]
    );
    res.json(newSession.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all learning sessions
app.get('/api/learning-sessions', async (req, res) => {
  try {
    const sessions = await pool.query('SELECT * FROM learning_sessions ORDER BY session_date DESC');
    res.json(sessions.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await applyMigrations(); // Run migrations after server starts
});

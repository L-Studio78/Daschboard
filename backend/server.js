require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');

const app = express();

// Migration: fehlende Spalten automatisch anlegen
const applyMigrations = async () => {
  const migrations = [
    // Books table migrations
    `ALTER TABLE books ADD COLUMN IF NOT EXISTS image_url TEXT;`,
    `ALTER TABLE books ADD COLUMN IF NOT EXISTS publish_year TEXT;`,
    `ALTER TABLE books ADD COLUMN IF NOT EXISTS page_count INTEGER;`,
    `ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn TEXT;`,
    `ALTER TABLE books ADD COLUMN IF NOT EXISTS ol_url TEXT;`,
    `ALTER TABLE books ADD COLUMN IF NOT EXISTS added_date TIMESTAMP;`,
    
    // Create todos table if not exists
    `CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      completed BOOLEAN DEFAULT FALSE,
      priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
      due_date DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP WITH TIME ZONE
    );`,
    
    // Create goals table if not exists
    `CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      target_date DATE,
      progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP WITH TIME ZONE
    );`
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

// --- Todo Routes ---

// Get all todos
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
    res.json(todos.rows);
  } catch (err) {
    console.error('Error fetching todos:', err.message);
    res.status(500).json({ 
      error: 'Server Error', 
      message: 'Fehler beim Laden der Todos',
      details: err.message 
    });
  }
});

// Add a new todo
app.post('/api/todos', async (req, res) => {
  try {
    const { title, description, priority, due_date } = req.body;
    
    // Validate required fields
    if (!title || title.trim() === '') {
      return res.status(400).json({ 
        error: 'Validation Error', 
        message: 'Titel ist erforderlich' 
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    const finalPriority = validPriorities.includes(priority) ? priority : 'medium';

    // Format due_date if provided
    let formattedDueDate = null;
    if (due_date) {
      try {
        formattedDueDate = new Date(due_date).toISOString().split('T')[0];
      } catch (dateError) {
        console.error('Invalid date format:', due_date);
        formattedDueDate = null;
      }
    }

    const newTodo = await pool.query(
      'INSERT INTO todos (title, description, priority, due_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [title.trim(), description?.trim() || '', finalPriority, formattedDueDate]
    );
    
    console.log('Todo created successfully:', newTodo.rows[0]);
    res.json(newTodo.rows[0]);
  } catch (err) {
    console.error('Error creating todo:', err.message);
    res.status(500).json({ 
      error: 'Server Error', 
      message: 'Fehler beim Erstellen des Todos',
      details: err.message 
    });
  }
});

// Update a todo (toggle completion)
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, title, description, priority, due_date } = req.body;
    
    let query, values;
    
    if (completed !== undefined) {
      // Toggle completion
      query = `
        UPDATE todos 
        SET completed = $1, completed_at = $2 
        WHERE id = $3 
        RETURNING *
      `;
      values = [completed, completed ? new Date().toISOString() : null, id];
    } else {
      // Update other fields
      const validPriorities = ['low', 'medium', 'high'];
      const finalPriority = validPriorities.includes(priority) ? priority : 'medium';
      
      let formattedDueDate = null;
      if (due_date) {
        try {
          formattedDueDate = new Date(due_date).toISOString().split('T')[0];
        } catch (dateError) {
          console.error('Invalid date format:', due_date);
          formattedDueDate = null;
        }
      }

      query = `
        UPDATE todos 
        SET title = $1, description = $2, priority = $3, due_date = $4 
        WHERE id = $5 
        RETURNING *
      `;
      values = [title?.trim() || '', description?.trim() || '', finalPriority, formattedDueDate, id];
    }
    
    const updatedTodo = await pool.query(query, values);
    
    if (updatedTodo.rowCount === 0) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Todo nicht gefunden' 
      });
    }
    
    res.json(updatedTodo.rows[0]);
  } catch (err) {
    console.error('Error updating todo:', err.message);
    res.status(500).json({ 
      error: 'Server Error', 
      message: 'Fehler beim Aktualisieren des Todos',
      details: err.message 
    });
  }
});

// Delete a todo
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteTodo = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);

    if (deleteTodo.rowCount === 0) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Todo nicht gefunden' 
      });
    }

    res.json({ 
      message: 'Todo erfolgreich gelöscht', 
      todo: deleteTodo.rows[0] 
    });
  } catch (err) {
    console.error('Error deleting todo:', err.message);
    res.status(500).json({ 
      error: 'Server Error', 
      message: 'Fehler beim Löschen des Todos',
      details: err.message 
    });
  }
});

// --- Goal Routes ---

// Get all goals
app.get('/api/goals', async (req, res) => {
  try {
    const goals = await pool.query('SELECT * FROM goals ORDER BY created_at DESC');
    res.json(goals.rows);
  } catch (err) {
    console.error('Error fetching goals:', err.message);
    res.status(500).json({ 
      error: 'Server Error', 
      message: 'Fehler beim Laden der Ziele',
      details: err.message 
    });
  }
});

// Add a new goal
app.post('/api/goals', async (req, res) => {
  try {
    const { title, description, target_date, progress } = req.body;
    
    // Validate required fields
    if (!title || title.trim() === '') {
      return res.status(400).json({ 
        error: 'Validation Error', 
        message: 'Titel ist erforderlich' 
      });
    }

    // Validate progress
    const finalProgress = Math.max(0, Math.min(100, parseInt(progress) || 0));

    // Format target_date if provided
    let formattedTargetDate = null;
    if (target_date) {
      try {
        formattedTargetDate = new Date(target_date).toISOString().split('T')[0];
      } catch (dateError) {
        console.error('Invalid date format:', target_date);
        formattedTargetDate = null;
      }
    }

    const newGoal = await pool.query(
      'INSERT INTO goals (title, description, target_date, progress) VALUES ($1, $2, $3, $4) RETURNING *',
      [title.trim(), description?.trim() || '', formattedTargetDate, finalProgress]
    );
    
    console.log('Goal created successfully:', newGoal.rows[0]);
    res.json(newGoal.rows[0]);
  } catch (err) {
    console.error('Error creating goal:', err.message);
    res.status(500).json({ 
      error: 'Server Error', 
      message: 'Fehler beim Erstellen des Ziels',
      details: err.message 
    });
  }
});

// Update a goal
app.put('/api/goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, target_date, progress, status } = req.body;
    
    // Validate status
    const validStatuses = ['active', 'completed', 'paused'];
    const finalStatus = validStatuses.includes(status) ? status : 'active';
    
    // Validate progress
    const finalProgress = Math.max(0, Math.min(100, parseInt(progress) || 0));

    // Format target_date if provided
    let formattedTargetDate = null;
    if (target_date) {
      try {
        formattedTargetDate = new Date(target_date).toISOString().split('T')[0];
      } catch (dateError) {
        console.error('Invalid date format:', target_date);
        formattedTargetDate = null;
      }
    }
    
    const query = `
      UPDATE goals 
      SET title = $1, description = $2, target_date = $3, progress = $4, status = $5, completed_at = $6
      WHERE id = $7 
      RETURNING *
    `;
    
    const completed_at = finalStatus === 'completed' ? new Date().toISOString() : null;
    const values = [
      title?.trim() || '', 
      description?.trim() || '', 
      formattedTargetDate, 
      finalProgress, 
      finalStatus, 
      completed_at, 
      id
    ];
    
    const updatedGoal = await pool.query(query, values);
    
    if (updatedGoal.rowCount === 0) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Ziel nicht gefunden' 
      });
    }
    
    res.json(updatedGoal.rows[0]);
  } catch (err) {
    console.error('Error updating goal:', err.message);
    res.status(500).json({ 
      error: 'Server Error', 
      message: 'Fehler beim Aktualisieren des Ziels',
      details: err.message 
    });
  }
});

// Delete a goal
app.delete('/api/goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteGoal = await pool.query('DELETE FROM goals WHERE id = $1 RETURNING *', [id]);

    if (deleteGoal.rowCount === 0) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Ziel nicht gefunden' 
      });
    }

    res.json({ 
      message: 'Ziel erfolgreich gelöscht', 
      goal: deleteGoal.rows[0] 
    });
  } catch (err) {
    console.error('Error deleting goal:', err.message);
    res.status(500).json({ 
      error: 'Server Error', 
      message: 'Fehler beim Löschen des Ziels',
      details: err.message 
    });
  }
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await applyMigrations(); // Run migrations after server starts
});

-- This script will be executed when the database container is first created.

-- Create a table for books
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    image_url VARCHAR(2048),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- You can add more tables here for other features like habits, finances, etc.

-- Insert some sample data (optional)
INSERT INTO books (title, author, rating, notes, image_url) VALUES
('The Hobbit', 'J.R.R. Tolkien', 5, 'A classic adventure.', 'https://images-na.ssl-images-amazon.com/images/I/91b0C2YNSrL.jpg'),
('1984', 'George Orwell', 4, 'Thought-provoking and still relevant.', 'https://images-na.ssl-images-amazon.com/images/I/819js3EQwbL.jpg');


-- Create a table for habits
CREATE TABLE habits (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a table to log habit completions
CREATE TABLE habit_log (
    id SERIAL PRIMARY KEY,
    habit_id INT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    UNIQUE(habit_id, completion_date) -- Ensures a habit can only be logged once per day
);

-- Insert some sample habits
INSERT INTO habits (name) VALUES
('Read for 20 minutes'),
('Go for a walk');


-- Create a table for learning sessions
CREATE TABLE learning_sessions (
    id SERIAL PRIMARY KEY,
    duration_minutes INT NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a table for todos
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create a table for long-term goals
CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Insert some sample todos
INSERT INTO todos (title, description, priority, due_date) VALUES
('Einkaufen gehen', 'Milch, Brot und Obst kaufen', 'high', CURRENT_DATE + INTERVAL '1 day'),
('Projektplanung', 'Dashboard-Features planen', 'medium', CURRENT_DATE + INTERVAL '3 days'),
('Sport machen', '30 Minuten Joggen', 'low', CURRENT_DATE);

-- Insert some sample goals
INSERT INTO goals (title, description, target_date, progress) VALUES
('Programmieren lernen', 'React und Node.js beherrschen', CURRENT_DATE + INTERVAL '6 months', 25),
('Fitness-Ziel', '10km in unter 50 Minuten laufen', CURRENT_DATE + INTERVAL '3 months', 40),
('Sprachen lernen', 'Spanisch B1 Niveau erreichen', CURRENT_DATE + INTERVAL '1 year', 15);

-- Add migration for additional book columns
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS publish_year TEXT,
  ADD COLUMN IF NOT EXISTS page_count INTEGER,
  ADD COLUMN IF NOT EXISTS isbn TEXT,
  ADD COLUMN IF NOT EXISTS ol_url TEXT,
  ADD COLUMN IF NOT EXISTS added_date TIMESTAMP;

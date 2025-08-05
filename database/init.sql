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

-- Add migration for additional book columns
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS publish_year TEXT,
  ADD COLUMN IF NOT EXISTS page_count INTEGER,
  ADD COLUMN IF NOT EXISTS isbn TEXT,
  ADD COLUMN IF NOT EXISTS ol_url TEXT,
  ADD COLUMN IF NOT EXISTS added_date TIMESTAMP;

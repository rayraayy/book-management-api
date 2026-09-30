const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;
const allowedStatuses = ['to-read', 'reading', 'completed'];
const dbPath = path.join(__dirname, 'database.db');

app.use(express.json());

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
    process.exit(1);
  }

  console.log('Connected to SQLite database.');
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      year INTEGER,
      status TEXT NOT NULL CHECK(status IN ('to-read', 'reading', 'completed'))
    )`,
    (err) => {
      if (err) {
        console.error('Failed to create books table:', err.message);
      }
    }
  );
});

function isValidStatus(status) {
  return allowedStatuses.includes(status);
}

function validateCreateBody(body) {
  const { title, author, status, year } = body;

  if (!title || !author || !status) {
    return 'title, author, and status are required';
  }

  if (!isValidStatus(status)) {
    return `status must be one of: ${allowedStatuses.join(', ')}`;
  }

  if (year !== undefined && year !== null && !Number.isInteger(year)) {
    return 'year must be an integer when provided';
  }

  return null;
}

function validateUpdateBody(body) {
  const allowedFields = ['title', 'year', 'status'];
  const providedFields = Object.keys(body);

  if (providedFields.length === 0) {
    return 'at least one field must be provided';
  }

  const hasInvalidField = providedFields.some((field) => !allowedFields.includes(field));
  if (hasInvalidField) {
    return 'only title, year, and status can be updated';
  }

  if (body.status !== undefined && !isValidStatus(body.status)) {
    return `status must be one of: ${allowedStatuses.join(', ')}`;
  }

  if (body.year !== undefined && body.year !== null && !Number.isInteger(body.year)) {
    return 'year must be an integer when provided';
  }

  return null;
}

app.get('/', (req, res) => {
  res.json({
    message: 'Book Management API is running',
    author: 'Ray Gadliauskas',
    endpoints: [
      'GET /books',
      'GET /books/:id',
      'GET /books?status=reading',
      'POST /books',
      'PUT /books/:id',
      'DELETE /books/:id'
    ]
  });
});

app.get('/books', (req, res) => {
  const { status } = req.query;

  if (status !== undefined) {
    if (!isValidStatus(status)) {
      return res.status(400).json({
        error: `status must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    return db.all(
      'SELECT * FROM books WHERE status = ?',
      [status],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to retrieve books' });
        }

        return res.status(200).json(rows);
      }
    );
  }

  db.all('SELECT * FROM books', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve books' });
    }

    return res.status(200).json(rows);
  });
});

app.get('/books/:id', (req, res) => {
  const bookId = Number(req.params.id);

  if (!Number.isInteger(bookId)) {
    return res.status(400).json({ error: 'Book ID must be an integer' });
  }

  db.get('SELECT * FROM books WHERE id = ?', [bookId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve book' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.status(200).json(row);
  });
});

app.post('/books', (req, res) => {
  const validationError = validateCreateBody(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { title, author, year = null, status } = req.body;

  db.run(
    'INSERT INTO books (title, author, year, status) VALUES (?, ?, ?, ?)',
    [title, author, year, status],
    function insertCallback(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add book' });
      }

      return res.status(201).json({
        message: 'Book added successfully',
        id: this.lastID
      });
    }
  );
});

app.put('/books/:id', (req, res) => {
  const bookId = Number(req.params.id);

  if (!Number.isInteger(bookId)) {
    return res.status(400).json({ error: 'Book ID must be an integer' });
  }

  const validationError = validateUpdateBody(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  db.get('SELECT * FROM books WHERE id = ?', [bookId], (findErr, row) => {
    if (findErr) {
      return res.status(500).json({ error: 'Failed to retrieve book' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const updatedTitle = req.body.title ?? row.title;
    const updatedYear = req.body.year ?? row.year;
    const updatedStatus = req.body.status ?? row.status;

    db.run(
      'UPDATE books SET title = ?, year = ?, status = ? WHERE id = ?',
      [updatedTitle, updatedYear, updatedStatus, bookId],
      function updateCallback(updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: 'Failed to update book' });
        }

        return res.status(200).json({
          message: 'Book updated successfully',
          changes: this.changes
        });
      }
    );
  });
});

app.delete('/books/:id', (req, res) => {
  const bookId = Number(req.params.id);

  if (!Number.isInteger(bookId)) {
    return res.status(400).json({ error: 'Book ID must be an integer' });
  }

  db.run('DELETE FROM books WHERE id = ?', [bookId], function deleteCallback(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete book' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.status(200).json({ message: 'Book deleted successfully' });
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

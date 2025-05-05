const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const app = express();
const PORT = 3000;
const JWT_SECRET = 'your_jwt_secret_here'; // Change this to a secure secret in production

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '/')));

// Initialize SQLite database
let db;
(async () => {
  db = await open({
    filename: './barberstyle.db',
    driver: sqlite3.Database
  });

  // Create tables if not exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT CHECK(role IN ('user', 'admin')) NOT NULL DEFAULT 'user'
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      name TEXT,
      service TEXT,
      date TEXT,
      time TEXT,
      status TEXT CHECK(status IN ('pending', 'confirmed', 'cancelled')) NOT NULL DEFAULT 'pending',
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `);

  // Create default admin user if not exists
  const adminUser = await db.get("SELECT * FROM users WHERE role = 'admin'");
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.run(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      ['admin', 'admin@barberstyle.com', hashedPassword, 'admin']
    );
    console.log('Default admin user created: username=admin, password=admin123');
  }
})();

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Middleware to check admin role
function authorizeAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// Register new user
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ message: 'Username or email already exists' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get appointments (admin gets all, user gets own)
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    let appointments;
    if (req.user.role === 'admin') {
      appointments = await db.all('SELECT * FROM appointments');
    } else {
      appointments = await db.all('SELECT * FROM appointments WHERE userId = ?', [req.user.id]);
    }
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create appointment (user)
app.post('/api/appointments', authenticateToken, async (req, res) => {
  const { name, service, date, time } = req.body;
  if (!name || !service || !date || !time) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    await db.run(
      'INSERT INTO appointments (userId, name, service, date, time) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, name, service, date, time]
    );
    res.status(201).json({ message: 'Appointment created' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update appointment (admin)
app.put('/api/appointments/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, service, date, time, name } = req.body;
  try {
    const appointment = await db.get('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    await db.run(
      'UPDATE appointments SET status = ?, service = ?, date = ?, time = ?, name = ? WHERE id = ?',
      [status || appointment.status, service || appointment.service, date || appointment.date, time || appointment.time, name || appointment.name, id]
    );
    res.json({ message: 'Appointment updated' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete appointment (admin)
app.delete('/api/appointments/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await db.get('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    await db.run('DELETE FROM appointments WHERE id = ?', [id]);
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

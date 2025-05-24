const express = require('express');
// const mysql = require('mysql');
const cors = require('cors');
// const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');


require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.use(cors());
// app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'foodhouse'
});
app.get('/api/restaurants', (req, res) => {
    const zip = req.query.zip_code;
    if (!zip) {
        return res.status(400).json({ error: 'Missing zip_code parameter' });
    }

    pool.query(
        'SELECT name, address FROM restaurants WHERE zip_code = ?',
        [zip],
        (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ error: 'Database query error' });
            }
            res.json(results);
        }
    );
});


app.use('./prediction', express.static(path.join(__dirname, 'prediction')));

app.use('/static', express.static(path.join(__dirname, 'prediction', 'static')));

app.get('/predict', (req, res) => {
  res.sendFile(path.join(__dirname, 'prediction', 'templates', 'index.html'));
});


const { exec } = require('child_process');

app.post('/run-predict', (req, res) => {
  exec('python prediction/menu_prediction_app.py', { cwd: 'backend/prediction' }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr });
    res.json({ output: stdout });
  });
});



const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect(err => {
  if (err) {
    console.error('Database connection error: ', err);
    return;
  }
  console.log('Connected to MySQL database.');
});


app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM users WHERE username = ?';
  
  db.query(sql, [username], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(401).json({ status: 'fail', message: 'Invalid credentials' });
    
    const user = results[0];
    bcrypt.compare(password, user.password, (bcryptErr, isMatch) => {
      if (bcryptErr) return res.status(500).json({ error: 'Error comparing passwords' });
      if (isMatch) {
        res.json({ status: 'success' });
      } else {
        res.status(401).json({ status: 'fail', message: 'Invalid credentials' });
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

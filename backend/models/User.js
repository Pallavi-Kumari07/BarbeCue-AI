const pool = require('../config/db');

const findUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

const createUser = async ({ 
  username, 
  org_name, 
  license_number, 
  passwordHash, 
  user_type, 
  email, 
  phone, 
  registered_at, 
  location 
}) => {
  const [result] = await pool.query(
    `INSERT INTO users 
    (username, org_name, license_number, password, user_type, email, phone, registered_at, location) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [username, org_name, license_number, passwordHash, user_type, email, phone, registered_at, location]
  );
  return result.insertId;
};

module.exports = { findUserByEmail, createUser };

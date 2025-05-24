const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../models/User');
require('dotenv').config();

const generateToken = (user) => {
  return jwt.sign({ id: user.id, userType: user.user_type }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

exports.register = async (req, res) => {
  // console.log('Signup request body:', req.body);
  const {
    username,
    org_name,
    license_number,
    password,
    user_type,
    email,
    phone,
    registered_at,
    location
  } = req.body;

  if (
    !username ||
    !org_name ||
    !license_number ||
    !password ||
    !user_type ||
    !email ||
    !phone ||
    !registered_at ||
    !location
  ) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await createUser({
      username,
      org_name,
      license_number,
      passwordHash,
      user_type,
      email,
      phone,
      registered_at,
      location
    });

    return res.json({ success: true, userId });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.login = async (req, res) => {
  const { email, password, user_type } = req.body;

  if (!email || !password || !user_type) {
    return res.status(400).json({ success: false, message: "Email, password, and user type are required." });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user || user.user_type !== user_type) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const token = generateToken(user);
    return res.json({ success: true, token, userType: user.user_type });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

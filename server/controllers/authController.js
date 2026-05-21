const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function signup(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Validation failed',
      });
    }

    const { name, email, phone, password, role, vehicleType } = req.body;
    if (!['customer', 'worker'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role for signup' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashed,
      role,
      vehicleType: role === 'worker' ? vehicleType || '' : '',
      isAvailable: false,
    });

    const token = signToken(user._id);
    const safe = user.toObject();
    delete safe.password;

    return res.status(201).json({
      success: true,
      data: { user: safe, token },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error during signup' });
  }
}

async function login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Validation failed',
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    const safe = user.toObject();
    delete safe.password;

    return res.json({
      success: true,
      data: { user: safe, token },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const safe = user.toObject();
    delete safe.password;
    return res.json({ success: true, data: { user: safe } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { signup, login, me, signToken };

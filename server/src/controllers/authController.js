import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { createLog } from '../services/auditService.js';

const tokenOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
};

const makeToken = (user) =>
  signToken({ id: user._id, role: user.role }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || '7d');

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  user.lastLoginAt = new Date();
  await user.save();

  await createLog({
    actor: user._id,
    entityType: 'Auth',
    action: 'LOGIN',
    message: `${user.email} logged in`
  });

  const token = makeToken(user);
  res.cookie('ict_token', token, tokenOptions);
  res.json({ token, user: user.toSafeObject() });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('ict_token', tokenOptions);
  res.json({ message: 'Logged out successfully' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

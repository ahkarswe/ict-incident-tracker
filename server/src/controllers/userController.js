import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { createLog } from '../services/auditService.js';

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map((user) => user.toSafeObject()) });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({ name, email, passwordHash: password, role });
  await createLog({
    actor: req.user?._id ?? null,
    entityType: 'User',
    entityId: user._id,
    action: 'USER_CREATED',
    message: `Created user ${user.email}`
  });

  res.status(201).json({ user: user.toSafeObject() });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+passwordHash');
  if (!user) return res.status(404).json({ message: 'User not found' });

  const before = user.toSafeObject();
  const { name, email, password, role, isActive, avatarUrl } = req.body;
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (password) user.passwordHash = password;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  await user.save();
  await createLog({
    actor: req.user?._id ?? null,
    entityType: 'User',
    entityId: user._id,
    action: 'USER_UPDATED',
    message: `Updated user ${user.email}`,
    previousValue: before,
    newValue: user.toSafeObject()
  });

  res.json({ user: user.toSafeObject() });
});

export const profile = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { name, password, avatarUrl } = req.body;
  if (name !== undefined) user.name = name;
  if (password) user.passwordHash = password;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  await user.save();
  res.json({ user: user.toSafeObject() });
});

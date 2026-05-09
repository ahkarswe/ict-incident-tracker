import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Incident from '../models/Incident.js';
import Comment from '../models/Comment.js';
import ActivityLog from '../models/ActivityLog.js';

dotenv.config();

const run = async () => {
  await connectDB(process.env.MONGO_URI);

  await Promise.all([User.deleteMany({}), Incident.deleteMany({}), Comment.deleteMany({}), ActivityLog.deleteMany({})]);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@ict.local',
    passwordHash: 'Admin123!',
    role: 'Admin'
  });
  const engineer = await User.create({
    name: 'Engineer User',
    email: 'engineer@ict.local',
    passwordHash: 'Engineer123!',
    role: 'Engineer'
  });
  const viewer = await User.create({
    name: 'Viewer User',
    email: 'viewer@ict.local',
    passwordHash: 'Viewer123!',
    role: 'Viewer'
  });

  await Incident.create([
    {
      incidentId: 'ICT-20260507-0001',
      title: 'Core switch packet loss',
      description: 'Intermittent packet loss affecting the campus core switch pair.',
      category: 'Network',
      priority: 'Critical',
      status: 'In Progress',
      impactLevel: 'High',
      createdBy: admin._id,
      assignedEngineer: engineer._id,
      slaDueTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      tags: ['noc', 'switch', 'core']
    },
    {
      incidentId: 'ICT-20260507-0002',
      title: 'VM host storage latency',
      description: 'Storage latency spike on virtualization cluster host 3.',
      category: 'Server',
      priority: 'High',
      status: 'Monitoring',
      impactLevel: 'Medium',
      createdBy: engineer._id,
      assignedEngineer: engineer._id,
      slaDueTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
      tags: ['storage', 'virtualization']
    }
  ]);

  console.log('Seed complete', { admin: admin.email, engineer: engineer.email, viewer: viewer.email });
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

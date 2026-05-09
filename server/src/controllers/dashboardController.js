import asyncHandler from 'express-async-handler';
import Incident from '../models/Incident.js';

export const getSummary = asyncHandler(async (req, res) => {
  const [total, open, critical, resolved, breached] = await Promise.all([
    Incident.countDocuments({ isDeleted: false }),
    Incident.countDocuments({ isDeleted: false, status: { $in: ['Open', 'In Progress', 'Monitoring'] } }),
    Incident.countDocuments({ isDeleted: false, priority: 'Critical' }),
    Incident.countDocuments({ isDeleted: false, status: 'Resolved' }),
    Incident.countDocuments({
      isDeleted: false,
      slaDueTime: { $lt: new Date() },
      status: { $nin: ['Resolved', 'Closed'] }
    })
  ]);

  const byCategory = await Incident.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$category', value: { $sum: 1 } } },
    { $sort: { value: -1 } }
  ]);

  const byPriority = await Incident.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$priority', value: { $sum: 1 } } }
  ]);

  const monthlyTrend = await Incident.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        value: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const slaTotal = await Incident.countDocuments({ isDeleted: false });
  const slaMet = await Incident.countDocuments({
    isDeleted: false,
    $or: [{ status: { $in: ['Resolved', 'Closed'] } }, { slaDueTime: { $gte: new Date() } }]
  });

  const recent = await Incident.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('assignedEngineer', 'name email role')
    .populate('createdBy', 'name email role');

  res.json({
    summary: { total, open, critical, resolved, breached },
    byCategory,
    byPriority,
    monthlyTrend,
    slaComplianceRate: slaTotal ? Math.round((slaMet / slaTotal) * 100) : 100,
    recent
  });
});

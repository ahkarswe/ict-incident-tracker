import asyncHandler from 'express-async-handler';
import Incident from '../models/Incident.js';
import { parseDateTimeInTimeZone } from '../utils/incident.js';

const buildDateFilter = (query) => {
  const from = query.from || query.date;
  const to = query.to || query.date;
  if (!from && !to) return {};

  const filter = {};
  const start = from ? parseDateTimeInTimeZone(from) : null;
  const end = to ? parseDateTimeInTimeZone(to) : null;

  if (start) filter.$gte = start;
  if (end) filter.$lt = new Date(end.getTime() + 24 * 60 * 60 * 1000);

  return Object.keys(filter).length ? { createdAt: filter } : {};
};

export const getSummary = asyncHandler(async (req, res) => {
  const dateFilter = buildDateFilter(req.query);
  const match = { isDeleted: false, ...dateFilter };

  const [total, open, critical, resolved, breached] = await Promise.all([
    Incident.countDocuments(match),
    Incident.countDocuments({ ...match, status: { $in: ['Open', 'In Progress', 'Monitoring'] } }),
    Incident.countDocuments({ ...match, priority: 'Critical' }),
    Incident.countDocuments({ ...match, status: 'Resolved' }),
    Incident.countDocuments({
      ...match,
      slaDueTime: { $lt: new Date() },
      status: { $nin: ['Resolved', 'Closed'] }
    })
  ]);

  const byCategory = await Incident.aggregate([
    { $match: match },
    { $group: { _id: '$category', value: { $sum: 1 } } },
    { $sort: { value: -1 } }
  ]);

  const byPriority = await Incident.aggregate([
    { $match: match },
    { $group: { _id: '$priority', value: { $sum: 1 } } }
  ]);

  const monthlyTrend = await Incident.aggregate([
    { $match: match },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        value: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const slaTotal = await Incident.countDocuments(match);
  const slaMet = await Incident.countDocuments({
    ...match,
    $or: [{ status: { $in: ['Resolved', 'Closed'] } }, { slaDueTime: { $gte: new Date() } }]
  });

  const recent = await Incident.find(match)
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

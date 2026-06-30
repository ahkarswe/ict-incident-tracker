import asyncHandler from 'express-async-handler';
import Incident from '../models/Incident.js';

const buildCreatedAtFilter = (query) => {
  const filter = { isDeleted: false };
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) {
      const toDate = new Date(query.to);
      toDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDate;
    }
  }
  return filter;
};


export const getSummary = asyncHandler(async (req, res) => {
  const createdAtFilter = buildCreatedAtFilter(req.query);
  const breachedFilter = {
    ...createdAtFilter,
    slaDueTime: { $lt: new Date() },
    status: { $nin: ['Resolved', 'Closed'] }
  };

  const [total, open, critical, resolved, breached] = await Promise.all([
    Incident.countDocuments(createdAtFilter),
    Incident.countDocuments({ ...createdAtFilter, status: { $in: ['Open', 'In Progress', 'Monitoring'] } }),
    Incident.countDocuments({ ...createdAtFilter, priority: 'Critical' }),
    Incident.countDocuments({ ...createdAtFilter, status: 'Resolved' }),
    Incident.countDocuments({ isDeleted: false, ...breachedFilter })
  ]);

  const byCategory = await Incident.aggregate([
    { $match: createdAtFilter },
    { $group: { _id: '$category', value: { $sum: 1 } } },
    { $sort: { value: -1 } }
  ]);

  const byPriority = await Incident.aggregate([
    { $match: createdAtFilter },
    { $group: { _id: '$priority', value: { $sum: 1 } } }
  ]);

  const monthlyTrend = await Incident.aggregate([
    { $match: createdAtFilter },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        value: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const slaTotal = await Incident.countDocuments(createdAtFilter);
  const slaMet = await Incident.countDocuments({
    ...createdAtFilter,
    $or: [{ status: { $in: ['Resolved', 'Closed'] } }, { slaDueTime: { $gte: new Date() } }]
  });

  const recent = await Incident.find(createdAtFilter)
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

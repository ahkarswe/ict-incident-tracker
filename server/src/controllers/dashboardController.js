import asyncHandler from 'express-async-handler';
import Incident from '../models/Incident.js';

const buildStartTimeFilter = (query) => {
  const filter = { isDeleted: false };
  if (query.from || query.to) {
    filter.startTime = {};
    if (query.from) filter.startTime.$gte = new Date(query.from);
    if (query.to) {
      const toDate = new Date(query.to);
      toDate.setHours(23, 59, 59, 999);
      filter.startTime.$lte = toDate;
    }
  }
  return filter;
};


export const getSummary = asyncHandler(async (req, res) => {
  const startTimeFilter = buildStartTimeFilter(req.query);
  const breachedFilter = {
    ...startTimeFilter,
    slaDueTime: { $lt: new Date() },
    status: { $nin: ['Resolved', 'Closed'] }
  };

  const [total, open, critical, resolved, closed, breached] = await Promise.all([
    Incident.countDocuments(startTimeFilter),
    Incident.countDocuments({ ...startTimeFilter, status: { $ne: 'Closed' } }),
    Incident.countDocuments({ ...startTimeFilter, priority: 'Critical' }),
    Incident.countDocuments({ ...startTimeFilter, status: 'Resolved' }),
    Incident.countDocuments({ ...startTimeFilter, status: 'Closed' }),
    Incident.countDocuments(breachedFilter)
  ]);

  const byCategory = await Incident.aggregate([
    { $match: startTimeFilter },
    { $group: { _id: '$category', value: { $sum: 1 } } },
    { $sort: { value: -1 } }
  ]);

  const byPriority = await Incident.aggregate([
    { $match: startTimeFilter },
    { $group: { _id: '$priority', value: { $sum: 1 } } }
  ]);

  const monthlyTrend = await Incident.aggregate([
    { $match: startTimeFilter },
    {
      $group: {
        _id: { year: { $year: '$startTime' }, month: { $month: '$startTime' } },
        value: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const slaTotal = await Incident.countDocuments(startTimeFilter);
  const slaMet = await Incident.countDocuments({
    ...startTimeFilter,
    $or: [{ status: { $in: ['Resolved', 'Closed'] } }, { slaDueTime: { $gte: new Date() } }]
  });

  const tableFilter = { ...startTimeFilter };
  if (req.query.tableStatus === 'open') tableFilter.status = { $ne: 'Closed' };
  if (req.query.tableStatus === 'closed') tableFilter.status = 'Closed';
  if (req.query.tableStatus === 'critical') tableFilter.priority = 'Critical';
  if (req.query.tableStatus === 'breached') Object.assign(tableFilter, breachedFilter);

  const recentQuery = Incident.find(tableFilter).sort({ startTime: -1 });
  if (!req.query.tableStatus && !req.query.from && !req.query.to) recentQuery.limit(10);
  const recent = await recentQuery
    .populate('assignedEngineer', 'name email role')
    .populate('createdBy', 'name email role');

  res.json({
    summary: { total, open, critical, resolved, closed, breached },
    byCategory,
    byPriority,
    monthlyTrend,
    slaComplianceRate: slaTotal ? Math.round((slaMet / slaTotal) * 100) : 100,
    recent
  });
});

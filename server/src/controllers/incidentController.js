import asyncHandler from 'express-async-handler';
import { stringify } from 'csv-stringify/sync';
import Comment from '../models/Comment.js';
import Incident from '../models/Incident.js';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import { buildIncidentId, getSlaIndicator, parseDateTimeInTimeZone } from '../utils/incident.js';
import { createIncidentLog } from '../services/auditService.js';
import { queueIncidentNotification } from '../services/notificationService.js';
import { isS3Storage, uploadAttachmentBuffer } from '../services/storageService.js';
import path from 'path';

const buildFilter = (query) => {
  const filter = { isDeleted: false };
  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { incidentId: { $regex: query.search, $options: 'i' } }
    ];
  }
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;
  if (query.assignedEngineer) filter.assignedEngineer = query.assignedEngineer;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }
  return filter;
};

const parseMaybeDate = (value) => parseDateTimeInTimeZone(value);

const parseMaybeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const safeParseJson = (value, fallback = []) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const formatExportDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const timeZone = process.env.TIME_ZONE || 'Asia/Yangon';
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
};

const populateIncidentReportQuery = (query) =>
  query
    .populate('createdBy', 'name email role')
    .populate('assignedEngineer', 'name email role')
    .populate({ path: 'comments', populate: { path: 'author', select: 'name email role' } })
    .populate({ path: 'activityLogs', populate: { path: 'actor', select: 'name email role' } });

const toIncidentReport = (incident) => ({ ...incident.toObject(), slaIndicator: getSlaIndicator(incident) });

const normalizeIncidentPayload = (body) => ({
  title: body.title,
  description: body.description,
  category: body.category,
  priority: body.priority,
  status: body.status,
  impactLevel: body.impactLevel,
  rootCause: body.rootCause,
  resolutionSummary: body.resolutionSummary,
  assignedEngineer: body.assignedEngineer || null,
  startTime: parseMaybeDate(body.startTime),
  endTime: parseMaybeDate(body.endTime),
  slaDueTime: parseMaybeDate(body.slaDueTime),
  tags: parseMaybeArray(body.tags)
});

const mapUploadedAttachments = (files = []) =>
  files.map((file) => ({
    filename: file.originalname,
    url: `/uploads/${path.basename(file.path)}`,
    mimeType: file.mimetype,
    label: 'Screenshot'
  }));

const mapUploadedAttachmentsForStorage = async (files = []) => {
  if (!files.length) return [];
  if (!isS3Storage()) return mapUploadedAttachments(files);
  const uploads = await Promise.all(
    files.map((file) =>
      uploadAttachmentBuffer({
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname
      })
    )
  );
  return uploads;
};

export const listIncidents = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Number(req.query.limit || 10), 100);
  const sort = req.query.sort || '-createdAt';
  const filter = buildFilter(req.query);

  const [items, total] = await Promise.all([
    Incident.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name email role')
      .populate('assignedEngineer', 'name email role')
      .populate('comments')
      .populate('activityLogs'),
    Incident.countDocuments(filter)
  ]);

  res.json({
    items: items.map((incident) => ({ ...incident.toObject(), slaIndicator: getSlaIndicator(incident) })),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  });
});

export const getIncident = asyncHandler(async (req, res) => {
  const incident = await populateIncidentReportQuery(Incident.findOne({ _id: req.params.id, isDeleted: false }));

  if (!incident) return res.status(404).json({ message: 'Incident not found' });
  res.json({ incident: toIncidentReport(incident) });
});

export const createIncident = asyncHandler(async (req, res) => {
  const count = (await Incident.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } })) + 1;
  const attachments = [...(await mapUploadedAttachmentsForStorage(req.files || [])), ...safeParseJson(req.body.existingAttachments, [])];
  const incident = await Incident.create({
    ...normalizeIncidentPayload(req.body),
    attachments,
    incidentId: buildIncidentId(count),
    createdBy: req.user._id
  });

  const log = await createIncidentLog(incident, req.user, 'CREATED', `Incident ${incident.incidentId} created`);
  incident.activityLogs.push(log._id);
  await incident.save();
  await queueIncidentNotification(incident, 'created');

  res.status(201).json({ incident });
});

export const updateIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);
  if (!incident || incident.isDeleted) return res.status(404).json({ message: 'Incident not found' });

  const before = incident.toObject();
  const payload = normalizeIncidentPayload(req.body);
  const trackedFields = ['title', 'description', 'category', 'priority', 'status', 'impactLevel', 'rootCause', 'resolutionSummary', 'assignedEngineer', 'startTime', 'endTime', 'slaDueTime', 'tags'];
  trackedFields.forEach((field) => {
    if (payload[field] !== undefined) incident[field] = payload[field];
  });

  const uploadedAttachments = await mapUploadedAttachmentsForStorage(req.files || []);
  const existingAttachments = req.body.existingAttachments ? safeParseJson(req.body.existingAttachments, incident.attachments) : incident.attachments;
  if (uploadedAttachments.length || req.body.existingAttachments !== undefined) {
    incident.attachments = [...existingAttachments, ...uploadedAttachments];
  }

  await incident.save();

  for (const field of trackedFields) {
    if (req.body[field] !== undefined && String(before[field] ?? '') !== String(incident[field] ?? '')) {
      const log = await createIncidentLog(
        incident,
        req.user,
        field === 'status' ? 'STATUS_CHANGED' : 'UPDATED',
        `${field} updated on ${incident.incidentId}`,
        { field, previousValue: before[field], newValue: incident[field] }
      );
      incident.activityLogs.push(log._id);
    }
  }

  if (req.body.assignedEngineer !== undefined) {
    const engineer = await User.findById(req.body.assignedEngineer);
    if (engineer) {
      const log = await createIncidentLog(incident, req.user, 'ASSIGNED', `Assigned to ${engineer.name}`, {
        field: 'assignedEngineer',
        previousValue: before.assignedEngineer,
        newValue: engineer._id
      });
      incident.activityLogs.push(log._id);
    }
  }

  if (req.body.status === 'Resolved') {
    const log = await createIncidentLog(incident, req.user, 'RESOLVED', `Incident ${incident.incidentId} resolved`);
    incident.activityLogs.push(log._id);
  }
  if (req.body.status === 'Closed') {
    const log = await createIncidentLog(incident, req.user, 'CLOSED', `Incident ${incident.incidentId} closed`);
    incident.activityLogs.push(log._id);
  }

  await incident.save();
  await queueIncidentNotification(incident, 'updated');

  res.json({ incident });
});

export const deleteIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);
  if (!incident) return res.status(404).json({ message: 'Incident not found' });
  incident.isDeleted = true;
  await incident.save();
  res.json({ message: 'Incident archived' });
});

export const addComment = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);
  if (!incident || incident.isDeleted) return res.status(404).json({ message: 'Incident not found' });

  const comment = await Comment.create({
    incident: incident._id,
    author: req.user._id,
    body: req.body.body
  });

  const log = await createIncidentLog(incident, req.user, 'COMMENTED', 'Comment added');
  incident.comments.push(comment._id);
  incident.activityLogs.push(log._id);
  await incident.save();

  res.status(201).json({ comment });
});

export const getActivity = asyncHandler(async (req, res) => {
  const activity = await ActivityLog.find({ incident: req.params.id }).populate('actor', 'name email role').sort({ createdAt: 1 });
  res.json({ activity });
});

export const exportCsv = asyncHandler(async (req, res) => {
  const incidents = await Incident.find({ isDeleted: false }).populate('createdBy', 'name email role').populate('assignedEngineer', 'name email role');
  const csv = stringify(
    incidents.map((incident) => ({
      _id: incident._id,
      incidentId: incident.incidentId,
      title: incident.title,
      description: incident.description,
      category: incident.category,
      priority: incident.priority,
      status: incident.status,
      impactLevel: incident.impactLevel,
      rootCause: incident.rootCause,
      resolutionSummary: incident.resolutionSummary,
      assignedEngineer: incident.assignedEngineer?.name || '',
      createdBy: incident.createdBy?.name || '',
      createdAt: formatExportDateTime(incident.createdAt),
      updatedAt: formatExportDateTime(incident.updatedAt),
      startTime: formatExportDateTime(incident.startTime),
      endTime: formatExportDateTime(incident.endTime),
      slaDueTime: formatExportDateTime(incident.slaDueTime),
      downtimeDuration: incident.downtimeDuration,
      tags: (incident.tags || []).join('|'),
      attachments: JSON.stringify(incident.attachments || [])
    })),
    { header: true }
  );

  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', 'attachment; filename=incidents.csv');
  res.send(csv);
});

export const incidentReport = asyncHandler(async (req, res) => {
  const incident = await populateIncidentReportQuery(Incident.findOne({ _id: req.params.id, isDeleted: false }));
  if (!incident) return res.status(404).json({ message: 'Incident not found' });

  res.json({ incident: toIncidentReport(incident), generatedAt: new Date().toISOString() });
});

export const allIncidentsReport = asyncHandler(async (req, res) => {
  const incidents = await populateIncidentReportQuery(
    Incident.find({ isDeleted: false }).sort({ createdAt: -1 })
  );

  res.json({
    incidents: incidents.map(toIncidentReport),
    generatedAt: new Date().toISOString()
  });
});

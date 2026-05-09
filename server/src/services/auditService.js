import ActivityLog from '../models/ActivityLog.js';

export const createLog = async (payload) => {
  return ActivityLog.create(payload);
};

export const createIncidentLog = async (incident, actor, action, message, extra = {}) => {
  const log = await ActivityLog.create({
    incident: incident?._id ?? null,
    actor: actor?._id ?? null,
    entityType: 'Incident',
    entityId: incident?._id ?? null,
    action,
    message,
    ...extra
  });
  return log;
};

export const buildIncidentId = (sequence) => {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `ICT-${date}-${String(sequence).padStart(4, '0')}`;
};

export const calculateDowntimeMinutes = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.round((end - start) / 60000);
};

export const getSlaIndicator = (incident) => {
  const now = new Date();
  if (incident.status === 'Resolved' || incident.status === 'Closed') return 'green';
  if (incident.slaDueTime && new Date(incident.slaDueTime) < now) return 'red';
  if (incident.slaDueTime) {
    const diffMs = new Date(incident.slaDueTime).getTime() - now.getTime();
    return diffMs <= 60 * 60 * 1000 ? 'yellow' : 'green';
  }
  return 'green';
};

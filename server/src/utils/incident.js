const defaultTimeZone = process.env.TIME_ZONE || 'Asia/Yangon';

const hasExplicitTimeZone = (value) => /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(value);

const getTimeZoneFormatter = (timeZone) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });

const parseLocalDateTime = (value) => {
  const [datePart, timePart = '00:00'] = value.trim().split('T');
  const dateSegments = datePart.split('-').map(Number);
  if (dateSegments.length !== 3 || dateSegments.some((segment) => Number.isNaN(segment))) return null;

  const [year, month, day] = dateSegments;
  const [clockPart = '00:00:00', fractionalPart = ''] = timePart.split('.');
  const timeSegments = clockPart.split(':').map(Number);
  if (timeSegments.length < 2 || timeSegments.some((segment) => Number.isNaN(segment))) return null;

  const [hour, minute, second = 0] = timeSegments;
  const milliseconds = fractionalPart ? Number(fractionalPart.padEnd(3, '0').slice(0, 3)) : 0;
  if (Number.isNaN(milliseconds)) return null;

  return { year, month, day, hour, minute, second, milliseconds };
};

const getTimeZoneOffsetMs = (date, timeZone = defaultTimeZone) => {
  const formatter = getTimeZoneFormatter(timeZone);
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  ) - date.getTime();
};

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

export const formatDateTimeLocal = (value, timeZone = defaultTimeZone) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const formatter = getTimeZoneFormatter(timeZone);
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

export const parseDateTimeInTimeZone = (value, timeZone = defaultTimeZone) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (hasExplicitTimeZone(trimmed)) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const localParts = parseLocalDateTime(trimmed);
  if (!localParts) return null;

  const utcGuess = new Date(Date.UTC(
    localParts.year,
    localParts.month - 1,
    localParts.day,
    localParts.hour,
    localParts.minute,
    localParts.second,
    localParts.milliseconds
  ));

  const offsetMs = getTimeZoneOffsetMs(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offsetMs);
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

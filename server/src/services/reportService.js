import PDFDocument from 'pdfkit';

const palette = {
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f8fafc',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#ef4444',
  violet: '#8b5cf6'
};

const statusColor = {
  Open: palette.red,
  'In Progress': palette.orange,
  Monitoring: palette.blue,
  Resolved: palette.green,
  Closed: '#64748b'
};

const priorityColor = {
  Critical: '#dc2626',
  High: palette.orange,
  Medium: palette.yellow,
  Low: palette.green
};

const safeText = (value) => (value === null || value === undefined || value === '' ? 'N/A' : String(value));

const normalizeUser = (value) => value?.name || value?.email || value || 'N/A';

const getAttachmentText = (attachments = []) =>
  attachments.length
    ? attachments.map((item) => `${item.filename}${item.url ? ` (${item.url})` : ''}`).join(', ')
    : 'N/A';

const metricCard = (doc, { x, y, w, h, label, value, color }) => {
  doc.save();
  doc.roundedRect(x, y, w, h, 10).fillAndStroke(palette.slate900, palette.slate700);
  doc.fillColor(palette.slate300).fontSize(9).text(label, x + 12, y + 10, { width: w - 24 });
  doc.fillColor(color).fontSize(18).text(String(value), x + 12, y + 30, { width: w - 24 });
  doc.restore();
};

const progressBar = (doc, x, y, w, label, percent, color) => {
  doc.fillColor(palette.slate300).fontSize(9).text(label, x, y - 12);
  doc.roundedRect(x, y, w, 10).fill(palette.slate800);
  doc.roundedRect(x, y, Math.max(6, Math.min(w, (w * percent) / 100)), 10).fill(color);
  doc.fillColor(palette.slate300).fontSize(9).text(`${percent}%`, x + w + 8, y - 1);
};

const statusPill = (doc, label, x, y) => {
  const fill = statusColor[label] || palette.blue;
  doc.save();
  doc.roundedRect(x, y, 86, 22, 7).fill(fill);
  doc.fillColor('#ffffff').fontSize(9).text(label, x, y + 6, { width: 86, align: 'center' });
  doc.restore();
};

const drawHeader = (doc, title, subtitle) => {
  const width = doc.page.width;
  doc.rect(0, 0, width, 112).fill(palette.slate900);
  doc.fillColor(palette.slate100).fontSize(22).text(title, 36, 24);
  if (subtitle) {
    doc.fillColor(palette.slate300).fontSize(10).text(subtitle, 36, 56, { width: width - 180 });
  }
};

const addPageFooter = (doc, pageNumber, totalPages, label) => {
  const y = doc.page.height - 34;
  doc.fillColor(palette.slate300).fontSize(9).text(label, 36, y);
  doc.text(`Page ${pageNumber} of ${totalPages}`, 0, y, { align: 'right' });
};

const writeField = (doc, label, value, x, y, width = 240) => {
  doc.fillColor(palette.slate300).fontSize(9).text(label, x, y);
  doc.fillColor(palette.slate200).fontSize(10).text(safeText(value), x, y + 12, { width });
};

const renderIncidentSection = (doc, incident, options = {}) => {
  const { showPageBreak = false } = options;
  if (showPageBreak) doc.addPage();

  const topX = 36;
  const topY = 136;
  const pageWidth = doc.page.width - 72;
  const slaBreached = incident.slaDueTime && new Date(incident.slaDueTime) < new Date() && !['Resolved', 'Closed'].includes(incident.status);
  const commentCount = incident.comments?.length || 0;
  const activityCount = incident.activityLogs?.length || 0;
  const attachmentCount = incident.attachments?.length || 0;

  doc.fillColor(palette.slate100).fontSize(18).text(incident.incidentId, topX, topY);
  doc.fillColor(palette.slate300).fontSize(11).text(incident.title, topX, topY + 24, { width: pageWidth - 120 });
  statusPill(doc, incident.status, doc.page.width - 122, topY - 4);

  metricCard(doc, { x: topX, y: 90, w: 116, h: 56, label: 'Priority', value: incident.priority, color: priorityColor[incident.priority] || palette.blue });
  metricCard(doc, { x: topX + 126, y: 90, w: 116, h: 56, label: 'Comments', value: commentCount, color: palette.cyan });
  metricCard(doc, { x: topX + 252, y: 90, w: 116, h: 56, label: 'Activities', value: activityCount, color: palette.violet });
  metricCard(doc, { x: topX + 378, y: 90, w: 116, h: 56, label: 'Attachments', value: attachmentCount, color: palette.green });

  doc.fillColor(palette.slate200).fontSize(12).text('SLA Summary', topX, 164);
  progressBar(doc, topX, 186, 180, 'Compliance', slaBreached ? 0 : 100, slaBreached ? palette.red : palette.green);
  progressBar(doc, topX, 214, 180, 'Timeline Complete', incident.endTime ? 100 : 45, incident.endTime ? palette.green : palette.blue);

  doc.fillColor(palette.slate200).fontSize(12).text('Incident Details', topX, 252);
  const leftX = topX;
  const rightX = topX + 260;
  const rows = [
    ['Incident ID', incident.incidentId],
    ['Title', incident.title],
    ['Category', incident.category],
    ['Priority', incident.priority],
    ['Status', incident.status],
    ['Impact Level', incident.impactLevel],
    ['Created By', normalizeUser(incident.createdBy)],
    ['Assigned Engineer', normalizeUser(incident.assignedEngineer)],
    ['Start Time', incident.startTime ? new Date(incident.startTime).toLocaleString() : 'N/A'],
    ['End Time', incident.endTime ? new Date(incident.endTime).toLocaleString() : 'N/A'],
    ['SLA Due Time', incident.slaDueTime ? new Date(incident.slaDueTime).toLocaleString() : 'N/A'],
    ['Downtime Minutes', incident.downtimeDuration],
    ['Root Cause', incident.rootCause],
    ['Resolution Summary', incident.resolutionSummary],
    ['Tags', (incident.tags || []).join(', ') || 'N/A'],
    ['Attachments', getAttachmentText(incident.attachments || [])]
  ];

  let leftY = 274;
  let rightY = 274;
  rows.forEach((entry, index) => {
    const x = index % 2 === 0 ? leftX : rightX;
    const y = index % 2 === 0 ? leftY : rightY;
    writeField(doc, entry[0], entry[1], x, y, 232);
    if (index % 2 === 0) leftY += 40;
    else rightY += 40;
  });

  const summaryY = Math.max(leftY, rightY) + 18;
  doc.fillColor(palette.slate200).fontSize(12).text('Description', topX, summaryY);
  doc.fillColor(palette.slate300).fontSize(10).text(safeText(incident.description), topX, summaryY + 16, { width: pageWidth });

  const commentsStartY = summaryY + 72;
  doc.fillColor(palette.slate200).fontSize(12).text('Comments', topX, commentsStartY);
  let cursorY = commentsStartY + 18;
  (incident.comments || []).slice(0, 8).forEach((comment) => {
    doc.fillColor('#93c5fd').fontSize(9).text(`${normalizeUser(comment.author)} · ${new Date(comment.createdAt).toLocaleString()}`, topX, cursorY);
    doc.fillColor(palette.slate200).fontSize(10).text(safeText(comment.body), topX, cursorY + 12, { width: pageWidth });
    cursorY += 36;
  });

  const activityStartY = Math.max(cursorY + 8, 560);
  doc.fillColor(palette.slate200).fontSize(12).text('Activity Timeline', topX, activityStartY);
  let activityY = activityStartY + 18;
  (incident.activityLogs || []).slice(0, 10).forEach((activity) => {
    doc.fillColor(palette.slate300).fontSize(9).text(new Date(activity.createdAt).toLocaleString(), topX, activityY);
    doc.fillColor(palette.slate200).fontSize(10).text(`${activity.action} - ${activity.message}`, topX + 120, activityY, { width: pageWidth - 120 });
    activityY += 20;
  });
};

export const buildIncidentPdf = (incident, comments = [], activities = []) => {
  const doc = new PDFDocument({ margin: 36, size: 'A4', bufferPages: true });
  incident.comments = comments;
  incident.activityLogs = activities;

  drawHeader(doc, 'Incident Report', incident.incidentId);
  renderIncidentSection(doc, incident);
  doc.end();
  return doc;
};

export const buildAllIncidentsPdf = (incidents = []) => {
  const doc = new PDFDocument({ margin: 36, size: 'A4', bufferPages: true });
  const safeIncidents = incidents.map((incident) => ({
    ...incident,
    comments: incident.comments || [],
    activityLogs: incident.activityLogs || []
  }));

  const totalOpen = safeIncidents.filter((item) => ['Open', 'In Progress', 'Monitoring'].includes(item.status)).length;
  const totalCritical = safeIncidents.filter((item) => item.priority === 'Critical').length;
  const totalResolved = safeIncidents.filter((item) => item.status === 'Resolved').length;
  const totalBreached = safeIncidents.filter((item) => item.slaDueTime && new Date(item.slaDueTime) < new Date() && !['Resolved', 'Closed'].includes(item.status)).length;
  const totalComments = safeIncidents.reduce((sum, item) => sum + (item.comments?.length || 0), 0);

  drawHeader(doc, 'ICT Incident Tracker Report', 'All incidents in one downloadable operational report.');
  metricCard(doc, { x: 36, y: 130, w: 116, h: 56, label: 'Total', value: safeIncidents.length, color: palette.blue });
  metricCard(doc, { x: 162, y: 130, w: 116, h: 56, label: 'Open', value: totalOpen, color: palette.orange });
  metricCard(doc, { x: 288, y: 130, w: 116, h: 56, label: 'Critical', value: totalCritical, color: palette.red });
  metricCard(doc, { x: 414, y: 130, w: 116, h: 56, label: 'Resolved', value: totalResolved, color: palette.green });
  metricCard(doc, { x: 540, y: 130, w: 116, h: 56, label: 'Breached', value: totalBreached, color: palette.violet });

  doc.fillColor(palette.slate200).fontSize(12).text('Summary Metrics', 36, 206);
  progressBar(doc, 36, 228, 180, 'Comment Coverage', safeIncidents.length ? Math.min(100, Math.round((totalComments / safeIncidents.length) * 20)) : 0, palette.cyan);
  progressBar(doc, 36, 256, 180, 'SLA Breach Rate', safeIncidents.length ? Math.round((totalBreached / safeIncidents.length) * 100) : 0, totalBreached ? palette.red : palette.green);

  safeIncidents.forEach((incident, index) => {
    doc.addPage();
    drawHeader(doc, 'Incident Section', incident.incidentId);
    renderIncidentSection(doc, incident, { showPageBreak: false });
  });

  const pages = doc.bufferedPageRange();
  for (let pageNumber = 0; pageNumber < pages.count; pageNumber += 1) {
    doc.switchToPage(pageNumber);
    addPageFooter(doc, pageNumber + 1, pages.count, 'All incidents report');
  }

  doc.end();
  return doc;
};

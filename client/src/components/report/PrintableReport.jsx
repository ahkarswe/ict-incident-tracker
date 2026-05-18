import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../Badge';

const reportTimeZone = import.meta.env.VITE_TIME_ZONE || 'Asia/Yangon';

const reportColors = {
  body: '#0f172a',
  muted: '#475569',
  label: '#64748b',
  cardBorder: '#dbe4ee',
  cardBg: '#ffffff',
  pageBg:
    'radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 30%), radial-gradient(circle at top right, rgba(14, 165, 233, 0.06), transparent 22%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 52%, #e2e8f0 100%)',
  accent: '#2563eb'
};

const styles = {
  page: {
    minHeight: '100vh',
    padding: '24px 0 48px',
    background: reportColors.pageBg,
    color: reportColors.body,
    fontFamily: "'Noto Sans Myanmar UI', 'Noto Sans Myanmar', 'Segoe UI', Arial, sans-serif",
    fontSize: '15px',
    lineHeight: 1.65
  },
  shell: {
    width: 'min(1200px, calc(100% - 32px))',
    margin: '0 auto',
    display: 'grid',
    gap: '24px'
  },
  toolbar: {
    width: 'min(1200px, calc(100% - 32px))',
    margin: '0 auto 16px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    border: `1px solid ${reportColors.cardBorder}`,
    borderRadius: '18px',
    background: 'rgba(255, 255, 255, 0.94)',
    padding: '16px 20px',
    boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
    backdropFilter: 'blur(14px)'
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 0.9fr)',
    gap: '20px',
    padding: '24px',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04), transparent 45%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    border: `1px solid ${reportColors.cardBorder}`,
    borderRadius: '16px'
  },
  card: {
    border: `1px solid ${reportColors.cardBorder}`,
    borderRadius: '16px',
    background: reportColors.cardBg
  },
  cardPadded: {
    border: `1px solid ${reportColors.cardBorder}`,
    borderRadius: '16px',
    background: reportColors.cardBg,
    padding: '12px'
  },
  metaCard: {
    border: `1px solid ${reportColors.cardBorder}`,
    borderRadius: '16px',
    background: reportColors.cardBg,
    padding: '12px 14px'
  },
  metricCard: {
    border: `1px solid ${reportColors.cardBorder}`,
    borderRadius: '16px',
    background: reportColors.cardBg,
    padding: '18px'
  },
  label: {
    color: reportColors.label,
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.22em'
  },
  value: {
    color: reportColors.body
  },
  muted: {
    color: reportColors.muted
  },
  heading: {
    color: reportColors.body
  },
  tableTh: {
    width: '28%',
    fontSize: '0.72rem',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: reportColors.label
  },
  tableTd: {
    color: reportColors.body,
    fontSize: '0.95rem'
  }
};

export const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: reportTimeZone,
    dateStyle: 'medium',
    timeStyle: 'medium'
  }).format(date);
};

export const normalizeUser = (value) => value?.name || value?.email || value || 'N/A';

export const isImageAttachment = (attachment = {}) => {
  const mimeType = String(attachment.mimeType || '').toLowerCase();
  const filename = String(attachment.filename || '').toLowerCase();
  return mimeType.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(filename);
};

export const ReportShell = ({ title, subtitle, meta = [], actions, children }) => {
  useEffect(() => {
    document.documentElement.classList.add('report-print');
    return () => {
      document.documentElement.classList.remove('report-print');
    };
  }, []);

  return (
    <div className="report-page" style={styles.page}>
      <div className="report-toolbar report-no-print" style={styles.toolbar}>
        <div>
          <div className="text-xs uppercase tracking-[0.25em]" style={styles.label}>
            Printable report
          </div>
          <div className="mt-1 text-sm" style={styles.muted}>
            Open this page in Chrome or Edge and use Print or Save as PDF.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>

      <div className="report-shell" style={styles.shell}>
        <header className="report-hero panel" style={styles.hero}>
          <div className="space-y-3">
            <div className="report-kicker" style={{ color: reportColors.accent, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase' }}>
              ICT Incident Tracker
            </div>
            <div>
              <h1 className="report-title" style={{ ...styles.heading, fontSize: 'clamp(1.9rem, 3.5vw, 3.1rem)', lineHeight: 1.12, fontWeight: 800, letterSpacing: '-0.03em' }}>
                {title}
              </h1>
              {subtitle ? (
                <p className="report-subtitle" style={{ ...styles.muted, maxWidth: '70ch', fontSize: '1rem', lineHeight: 1.8 }}>
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          <div className="report-meta-grid">
            {meta.map((item) => (
              <div key={item.label} className="report-meta-card" style={styles.metaCard}>
                <div className="report-meta-label" style={styles.label}>
                  {item.label}
                </div>
                <div className="report-meta-value" style={{ ...styles.value, marginTop: 6, fontSize: '0.98rem', wordBreak: 'break-word' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </header>

        {children}
      </div>
    </div>
  );
};

export const MetricGrid = ({ items }) => (
  <div className="report-metrics">
    {items.map((item) => (
      <div key={item.label} className="report-metric panel" style={styles.metricCard}>
        <div className="report-metric-label" style={styles.label}>
          {item.label}
        </div>
        <div className="report-metric-value" style={{ ...styles.heading, marginTop: 10, fontSize: 'clamp(1.8rem, 3vw, 2.7rem)', fontWeight: 700, lineHeight: 1 }}>
          {item.value}
        </div>
        {item.helper ? (
          <div className="report-metric-helper" style={{ ...styles.muted, marginTop: 8, fontSize: '0.9rem' }}>
            {item.helper}
          </div>
        ) : null}
      </div>
    ))}
  </div>
);

export const KeyValueTable = ({ rows }) => (
  <div className="panel report-card" style={styles.card}>
    <div className="panel-header">Incident Details</div>
    <div className="panel-body">
      <table className="report-table">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th style={styles.tableTh}>{row.label}</th>
              <td style={styles.tableTd}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const ReportTextSection = ({ title, children, className = '' }) => (
  <section className={`panel report-card ${className}`.trim()} style={styles.card}>
    <div className="panel-header">{title}</div>
    <div className="panel-body">{children}</div>
  </section>
);

export const AttachmentGallery = ({ attachments = [] }) => {
  if (!attachments.length) {
    return <div className="text-sm" style={styles.muted}>No attachments uploaded.</div>;
  }

  return (
    <div className="report-attachment-grid">
      {attachments.map((attachment) => (
        <div key={`${attachment.url || attachment.filename}`} className="report-attachment-card" style={styles.cardPadded}>
          {isImageAttachment(attachment) ? (
            <a href={attachment.url} target="_blank" rel="noreferrer">
              <img className="report-attachment-image" src={attachment.url} alt={attachment.filename} loading="lazy" />
            </a>
          ) : (
            <div className="report-attachment-fallback">
              <div className="text-xs uppercase tracking-[0.2em]" style={styles.label}>
                {attachment.label || 'Attachment'}
              </div>
              <a href={attachment.url} target="_blank" rel="noreferrer" className="text-brand-300 hover:text-brand-200" style={{ color: reportColors.accent }}>
                {attachment.filename}
              </a>
            </div>
          )}
          <div className="mt-2 text-xs" style={styles.muted}>
            {attachment.filename}
          </div>
        </div>
      ))}
    </div>
  );
};

export const CommentsList = ({ comments = [] }) => (
  <div className="space-y-3">
    {comments.length ? (
      comments.map((comment) => (
        <article key={comment._id || `${comment.createdAt}-${comment.body}`} className="report-entry panel" style={styles.card}>
          <div className="panel-body">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium" style={styles.heading}>
                {normalizeUser(comment.author)}
              </div>
              <div className="text-xs" style={styles.muted}>
                {formatDateTime(comment.createdAt)}
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm" style={styles.value}>
              {comment.body}
            </p>
          </div>
        </article>
      ))
    ) : (
      <div className="text-sm" style={styles.muted}>
        No comments yet.
      </div>
    )}
  </div>
);

export const ActivityList = ({ items = [] }) => (
  <div className="space-y-3">
    {items.length ? (
      items.map((item) => (
        <article key={item._id || `${item.createdAt}-${item.action}`} className="report-entry report-timeline-item">
          <div className="report-timeline-dot" />
          <div className="panel report-timeline-card" style={styles.card}>
            <div className="panel-body">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium" style={styles.heading}>
                  {item.action}
                </div>
                <div className="text-xs" style={styles.muted}>
                  {formatDateTime(item.createdAt)}
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm" style={styles.muted}>
                {item.message}
              </p>
            </div>
          </div>
        </article>
      ))
    ) : (
      <div className="text-sm" style={styles.muted}>
        No activity entries yet.
      </div>
    )}
  </div>
);

export const IncidentReportSection = ({ incident, pageBreak = false }) => {
  const slaLabel = incident.slaIndicator ? `SLA ${incident.slaIndicator}` : 'SLA N/A';
  const detailRows = [
    { label: 'Incident ID', value: incident.incidentId },
    { label: 'Title', value: incident.title },
    { label: 'Category', value: incident.category },
    { label: 'Priority', value: incident.priority },
    { label: 'Status', value: incident.status },
    { label: 'Impact Level', value: incident.impactLevel },
    { label: 'Created By', value: normalizeUser(incident.createdBy) },
    { label: 'Assigned Engineer', value: normalizeUser(incident.assignedEngineer) },
    { label: 'Start Time', value: formatDateTime(incident.startTime) },
    { label: 'End Time', value: formatDateTime(incident.endTime) },
    { label: 'SLA Due Time', value: formatDateTime(incident.slaDueTime) },
    { label: 'Downtime Minutes', value: incident.downtimeDuration ?? 'N/A' },
    { label: 'Root Cause', value: incident.rootCause || 'N/A' },
    { label: 'Resolution Summary', value: incident.resolutionSummary || 'N/A' },
    { label: 'Tags', value: (incident.tags || []).join(', ') || 'N/A' }
  ];

  return (
    <section className={`report-incident ${pageBreak ? 'report-page-break' : ''}`.trim()}>
      <div className="report-incident-header panel" style={styles.card}>
        <div className="panel-body report-incident-header-inner">
          <div>
            <div className="text-xs uppercase tracking-[0.25em]" style={styles.label}>
              {incident.incidentId}
            </div>
            <h2 className="mt-2 text-2xl font-semibold" style={styles.heading}>
              {incident.title}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge value={incident.priority} />
              <Badge value={incident.status} />
              <span className={`badge ${incident.slaIndicator === 'red' ? 'badge-red' : incident.slaIndicator === 'yellow' ? 'badge-yellow' : 'badge-green'}`}>
                {slaLabel}
              </span>
            </div>
          </div>

          <div className="report-mini-stats">
            <div className="report-mini-stat" style={styles.metaCard}>
              <div className="report-meta-label" style={styles.label}>
                Comments
              </div>
              <div className="report-mini-value" style={{ ...styles.heading, marginTop: 6, fontSize: '1.35rem', fontWeight: 700 }}>
                {incident.comments?.length || 0}
              </div>
            </div>
            <div className="report-mini-stat" style={styles.metaCard}>
              <div className="report-meta-label" style={styles.label}>
                Activity
              </div>
              <div className="report-mini-value" style={{ ...styles.heading, marginTop: 6, fontSize: '1.35rem', fontWeight: 700 }}>
                {incident.activityLogs?.length || 0}
              </div>
            </div>
            <div className="report-mini-stat" style={styles.metaCard}>
              <div className="report-meta-label" style={styles.label}>
                Attachments
              </div>
              <div className="report-mini-value" style={{ ...styles.heading, marginTop: 6, fontSize: '1.35rem', fontWeight: 700 }}>
                {incident.attachments?.length || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          <KeyValueTable rows={detailRows} />

          <ReportTextSection title="Description">
            <p className="whitespace-pre-wrap text-sm leading-6" style={styles.value}>
              {incident.description}
            </p>
          </ReportTextSection>

          <ReportTextSection title="Attachments">
            <AttachmentGallery attachments={incident.attachments || []} />
          </ReportTextSection>
        </div>

        <div className="space-y-6">
          <ReportTextSection title="Comments">
            <CommentsList comments={incident.comments || []} />
          </ReportTextSection>

          <ReportTextSection title="Activity Timeline">
            <ActivityList items={incident.activityLogs || []} />
          </ReportTextSection>
        </div>
      </div>
    </section>
  );
};

export const ReportActions = ({ backTo, backLabel, printLabel = 'Print Report', onPrint, extra }) => (
  <>
    <Link className="btn-secondary" to={backTo}>
      {backLabel}
    </Link>
    {extra}
    <button className="btn-primary" onClick={onPrint}>
      {printLabel}
    </button>
  </>
);

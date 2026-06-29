import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { Loader } from '../components/Loader';
import { formatDateTimeLocalValue } from '../utils/dateTime';

const buildDefaultSlaDueTime = () => formatDateTimeLocalValue(new Date(Date.now() + 4 * 60 * 60 * 1000));

const createBaseForm = () => ({
  title: '',
  description: '',
  category: 'Network',
  priority: 'High',
  status: 'Open',
  impactLevel: 'Medium',
  rootCause: '',
  resolutionSummary: '',
  reportBy: '',
  assignedEngineer: '',
  startTime: '',
  endTime: '',
  slaDueTime: buildDefaultSlaDueTime(),
  tags: '',
  attachment: null,
  existingAttachments: []
});

export default function IncidentFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(createBaseForm);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    api.get('/users').then(({ data }) => setUsers(data.users.filter((user) => user.role !== 'Viewer'))).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode !== 'edit') return;
    api.get(`/incidents/${id}`).then(({ data }) => {
      const incident = data.incident;
      setForm({
        title: incident.title,
        description: incident.description,
        category: incident.category,
        priority: incident.priority,
        status: incident.status,
        impactLevel: incident.impactLevel || 'Medium',
        rootCause: incident.rootCause || '',
        resolutionSummary: incident.resolutionSummary || '',
        reportBy: incident.reportBy || '',
        assignedEngineer: incident.assignedEngineer?._id || '',
        startTime: formatDateTimeLocalValue(incident.startTime),
        endTime: formatDateTimeLocalValue(incident.endTime),
        slaDueTime: formatDateTimeLocalValue(incident.slaDueTime),
        tags: (incident.tags || []).join(', '),
        attachment: null,
        existingAttachments: incident.attachments || []
      });
      setLoading(false);
    });
  }, [id, mode]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const fieldClass = (baseClass, field) => `${baseClass}${fieldErrors[field] ? ' field-invalid' : ''}`;

  const submit = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    const hasFile = Boolean(form.attachment);
    const sendBody = hasFile ? new FormData() : {};
    const append = (key, value) => {
      if (hasFile) {
        if (value !== undefined && value !== null) sendBody.append(key, value);
      } else if (value !== undefined) {
        sendBody[key] = value;
      }
    };

    append('title', form.title);
    append('description', form.description);
    append('category', form.category);
    append('priority', form.priority);
    append('status', form.status);
    append('impactLevel', form.impactLevel);
    append('rootCause', form.rootCause);
    append('resolutionSummary', form.resolutionSummary);
    append('reportBy', form.reportBy);
    append('assignedEngineer', form.assignedEngineer || '');
    append('startTime', form.startTime || '');
    append('endTime', form.endTime || '');
    append('slaDueTime', form.slaDueTime);
    append('tags', form.tags);
    append('existingAttachments', JSON.stringify(form.existingAttachments || []));
    if (form.attachment) append('attachments', form.attachment);

    try {
      if (mode === 'create') {
        await api.post('/incidents', sendBody);
        toast.success('Incident created');
      } else {
        await api.patch(`/incidents/${id}`, sendBody);
        toast.success('Incident updated');
      }
      setFieldErrors({});
      navigate('/incidents');
    } catch (error) {
      const validationErrors = error.response?.data?.errors || [];
      if (validationErrors.length) {
        const nextErrors = validationErrors.reduce((acc, item) => {
          if (item?.field) acc[item.field] = item.message;
          return acc;
        }, {});
        setFieldErrors(nextErrors);
        toast.error(validationErrors[0]?.message || error.response?.data?.message || 'Validation failed');
        return;
      }
      toast.error(error.response?.data?.message || 'Save failed');
    }
  };

  if (loading) return <Loader />;

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">{mode === 'create' ? 'Create Incident' : 'Edit Incident'}</div>
          <div className="text-sm text-slate-400">Capture the operational details once and keep the timeline auditable.</div>
        </div>
        <button className="btn-primary" type="submit">
          Save Incident
        </button>
      </div>

      <div className="panel p-5 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Title *</label>
            <input className={fieldClass('input mt-1', 'title')} value={form.title} onChange={(e) => update('title', e.target.value)} />
            {fieldErrors.title ? <div className="field-error-text">{fieldErrors.title}</div> : null}
          </div>
          <div>
            <label className="label">Report By</label>
            <input className="input mt-1" value={form.reportBy} onChange={(e) => update('reportBy', e.target.value)} placeholder="Reported by name" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Assigned Engineer</label>
            <select className="select mt-1" value={form.assignedEngineer} onChange={(e) => update('assignedEngineer', e.target.value)}>
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Screenshot / Attachment</label>
          <input
            className="input mt-1"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => update('attachment', e.target.files?.[0] || null)}
          />
          <div className="mt-2 text-xs text-slate-400">Uploads are stored as incident attachments and included in the report.</div>
          {form.existingAttachments?.length ? (
            <div className="mt-3 space-y-2">
              {form.existingAttachments.map((attachment, index) => (
                <div key={`${attachment.url}-${index}`} className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm">
                  {attachment.filename}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input mt-1 min-h-32" value={form.description} onChange={(e) => update('description', e.target.value)} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['category', ['Network', 'Server', 'Cloud', 'Security', 'Database', 'Backup', 'Application', 'Power', 'ISP']],
            ['priority', ['Critical', 'High', 'Medium', 'Low']],
            ['status', ['Open', 'In Progress', 'Monitoring', 'Resolved', 'Closed']]
          ].map(([field, options]) => (
            <div key={field}>
              <label className="label">{field}{field === 'category' || field === 'priority' ? ' *' : ''}</label>
              <select className={fieldClass('select mt-1', field)} value={form[field]} onChange={(e) => update(field, e.target.value)}>
                {options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              {fieldErrors[field] ? <div className="field-error-text">{fieldErrors[field]}</div> : null}
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Impact Level</label>
            <input className="input mt-1" value={form.impactLevel} onChange={(e) => update('impactLevel', e.target.value)} />
          </div>
          <div>
            <label className="label">Start Time</label>
            <input type="datetime-local" className="input mt-1" value={form.startTime} onChange={(e) => update('startTime', e.target.value)} />
          </div>
          <div>
            <label className="label">End Time</label>
            <input type="datetime-local" className="input mt-1" value={form.endTime} onChange={(e) => update('endTime', e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">SLA Due Time *</label>
            <input type="datetime-local" className={fieldClass('input mt-1', 'slaDueTime')} value={form.slaDueTime} onChange={(e) => update('slaDueTime', e.target.value)} />
            {fieldErrors.slaDueTime ? <div className="field-error-text">{fieldErrors.slaDueTime}</div> : null}
          </div>
          <div>
            <label className="label">Tags</label>
            <input className="input mt-1" value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="noc, core, urgent" />
          </div>
        </div>

        <div>
          <label className="label">Root Cause</label>
          <textarea className="input mt-1 min-h-24" value={form.rootCause} onChange={(e) => update('rootCause', e.target.value)} />
        </div>

        <div>
          <label className="label">Resolution Summary</label>
          <textarea className="input mt-1 min-h-24" value={form.resolutionSummary} onChange={(e) => update('resolutionSummary', e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
          <button className="btn-secondary" type="button" onClick={() => navigate('/incidents')}>
            Cancel
          </button>
          <button className="btn-primary" type="submit">
            Save Incident
          </button>
        </div>
      </div>
    </form>
  );
}

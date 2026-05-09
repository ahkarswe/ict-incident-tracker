import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { Loader } from '../components/Loader';

const baseForm = {
  title: '',
  description: '',
  category: 'Network',
  priority: 'High',
  status: 'Open',
  impactLevel: 'Medium',
  rootCause: '',
  resolutionSummary: '',
  assignedEngineer: '',
  startTime: '',
  endTime: '',
  slaDueTime: '',
  tags: '',
  attachment: null,
  existingAttachments: []
};

export default function IncidentFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(baseForm);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(mode === 'edit');

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
        assignedEngineer: incident.assignedEngineer?._id || '',
        startTime: incident.startTime ? new Date(incident.startTime).toISOString().slice(0, 16) : '',
        endTime: incident.endTime ? new Date(incident.endTime).toISOString().slice(0, 16) : '',
        slaDueTime: incident.slaDueTime ? new Date(incident.slaDueTime).toISOString().slice(0, 16) : '',
        tags: (incident.tags || []).join(', '),
        attachment: null,
        existingAttachments: incident.attachments || []
      });
      setLoading(false);
    });
  }, [id, mode]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
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
      navigate('/incidents');
    } catch (error) {
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
            <label className="label">Title</label>
            <input className="input mt-1" value={form.title} onChange={(e) => update('title', e.target.value)} />
          </div>
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
              <label className="label">{field}</label>
              <select className="select mt-1" value={form[field]} onChange={(e) => update(field, e.target.value)}>
                {options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
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
            <label className="label">SLA Due Time</label>
            <input type="datetime-local" className="input mt-1" value={form.slaDueTime} onChange={(e) => update('slaDueTime', e.target.value)} />
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

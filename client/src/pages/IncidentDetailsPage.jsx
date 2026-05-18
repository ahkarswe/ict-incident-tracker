import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { Badge } from '../components/Badge';
import { Loader } from '../components/Loader';
import { ErrorState } from '../components/ErrorState';
import { useAuth } from '../context/AuthContext';

export default function IncidentDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const load = () => api.get(`/incidents/${id}`).then(({ data }) => setData(data.incident)).catch((err) => setError(err.response?.data?.message || 'Failed to load incident'));

  useEffect(() => {
    load();
  }, [id]);

  const addComment = async () => {
    try {
      await api.post(`/incidents/${id}/comments`, { body: comment });
      setComment('');
      toast.success('Comment added');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Comment failed');
    }
  };

  if (error) return <ErrorState message={error} />;
  if (!data) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-400">{data.incidentId}</div>
          <div className="text-3xl font-semibold">{data.title}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge value={data.priority} />
            <Badge value={data.status} />
            <span className={`badge ${data.slaIndicator === 'red' ? 'badge-red' : data.slaIndicator === 'yellow' ? 'badge-yellow' : 'badge-green'}`}>SLA {data.slaIndicator}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link className="btn-secondary" to={`/incidents/${id}/edit`}>Edit</Link>
          <Link className="btn-primary" to={`/incidents/${id}/print?autoPrint=1`} target="_blank" rel="noreferrer">
            Print Report
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="panel">
          <div className="panel-header">Overview</div>
          <div className="panel-body space-y-4">
            <p className="text-slate-300">{data.description}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div><div className="label">Category</div><div>{data.category}</div></div>
              <div><div className="label">Impact Level</div><div>{data.impactLevel}</div></div>
              <div><div className="label">Created By</div><div>{data.createdBy?.name}</div></div>
              <div><div className="label">Assigned Engineer</div><div>{data.assignedEngineer?.name || 'Unassigned'}</div></div>
              <div><div className="label">Start Time</div><div>{data.startTime ? new Date(data.startTime).toLocaleString('en-US', {
          timeZone: 'Asia/Yangon',
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }) : '-'}</div></div>
              <div><div className="label">End Time</div><div>{data.endTime ? new Date(data.endTime).toLocaleString('en-US', {
          timeZone: 'Asia/Yangon',
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }) : '-'}</div></div>
            </div>
            <div><div className="label">Root Cause</div><div>{data.rootCause || '—'}</div></div>
            <div><div className="label">Resolution Summary</div><div>{data.resolutionSummary || '—'}</div></div>
            <div><div className="label">Tags</div><div className="flex flex-wrap gap-2">{(data.tags || []).map((tag) => <span key={tag} className="badge-slate">{tag}</span>)}</div></div>
            <div>
              <div className="label">Attachments</div>
              <div className="mt-2 space-y-2">
                {(data.attachments || []).length ? (data.attachments || []).map((attachment) => (
                  <a key={attachment.url} className="block rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-brand-400 hover:text-brand-300" href={attachment.url} target="_blank" rel="noreferrer">
                    {attachment.filename}
                  </a>
                )) : <div className="text-sm text-slate-400">No attachments uploaded.</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel">
            <div className="panel-header">SLA</div>
            <div className="panel-body space-y-2">
              <div className="label">Due</div>
              <div>{data.slaDueTime ? new Date(data.slaDueTime).toLocaleString('en-US', {
          timeZone: 'Asia/Yangon',
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }) : '-'}</div>
              <div className="label">Downtime</div>
              <div>{data.downtimeDuration} minutes</div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">Comments</div>
            <div className="panel-body space-y-3">
              <textarea className="input min-h-24" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add troubleshooting update..." />
              <button className="btn-primary" onClick={addComment} disabled={user?.role === 'Viewer'}>Add Comment</button>
              <div className="space-y-3">
                {(data.comments || []).map((entry) => (
                  <div key={entry._id} className="rounded-md border border-slate-800 bg-slate-950 p-3">
                    <div className="text-xs text-slate-400">
                      {entry.author?.name} · {new Date(entry.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-1 text-sm text-slate-200">{entry.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">Activity Timeline</div>
        <div className="panel-body space-y-3">
          {(data.activityLogs || []).map((item) => (
            <div key={item._id} className="border-l border-slate-700 pl-4">
              <div className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</div>
              <div className="font-medium">{item.action}</div>
              <div className="text-sm text-slate-300">{item.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

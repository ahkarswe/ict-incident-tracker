import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Filters } from '../components/Filters';
import { IncidentTable } from '../components/IncidentTable';
import { Loader } from '../components/Loader';
import { ErrorState } from '../components/ErrorState';
import toast from 'react-hot-toast';

const initialFilters = { search: '', status: '', priority: '', category: '', assignedEngineer: '', from: '', to: '', page: 1, limit: 10, sort: '-createdAt' };

export default function IncidentListPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [payload, setPayload] = useState(null);
  const [engineers, setEngineers] = useState([]);
  const [error, setError] = useState('');
  const [view, setView] = useState('table');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    return params.toString();
  }, [filters]);

  useEffect(() => {
    api.get(`/users`).then(({ data }) => setEngineers(data.users.filter((user) => user.role === 'Engineer'))).catch(() => {});
  }, []);

  useEffect(() => {
    api
      .get(`/incidents?${query}`)
      .then(({ data }) => setPayload(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load incidents'));
  }, [query]);

  const downloadCsv = async () => {
    try {
      const response = await api.get('/incidents/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'incidents.csv';
      link.click();
      toast.success('CSV exported');
    } catch {
      toast.error('CSV export failed');
    }
  };

  if (error) return <ErrorState message={error} />;
  if (!payload) return <Loader />;

  const grouped = ['Open', 'In Progress', 'Monitoring', 'Resolved', 'Closed'].reduce((acc, status) => {
    acc[status] = payload.items.filter((incident) => incident.status === status);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold">Incidents</div>
          <div className="text-sm text-slate-400">Search, filter, and manage operational incidents.</div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={downloadCsv}>Export CSV</button>
          <Link className="btn-primary" to="/incidents/new">New Incident</Link>
        </div>
      </div>

      <div className="panel p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Filters filters={filters} setFilters={setFilters} engineers={engineers} />
          <div className="hidden gap-2 xl:flex">
            <button className={view === 'table' ? 'btn-primary' : 'btn-secondary'} onClick={() => setView('table')}>Table</button>
            <button className={view === 'board' ? 'btn-primary' : 'btn-secondary'} onClick={() => setView('board')}>Board</button>
          </div>
        </div>
      </div>

      {view === 'table' ? (
        <div className="panel">
          <div className="panel-body">
            <IncidentTable items={payload.items} />
            <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
              <div>
                Page {payload.page} of {payload.pages || 1}
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary" disabled={payload.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>
                  Previous
                </button>
                <button className="btn-secondary" disabled={payload.page >= payload.pages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-5">
          {Object.entries(grouped).map(([status, incidents]) => (
            <div key={status} className="panel">
              <div className="panel-header flex items-center justify-between">
                <span>{status}</span>
                <span className="badge-slate">{incidents.length}</span>
              </div>
              <div className="panel-body space-y-3">
                {incidents.map((incident) => (
                  <Link key={incident._id} to={`/incidents/${incident._id}`} className="block rounded-md border border-slate-800 bg-slate-950 p-3 hover:bg-slate-900">
                    <div className="text-xs text-slate-400">{incident.incidentId}</div>
                    <div className="mt-1 font-medium">{incident.title}</div>
                    <div className="mt-2 text-xs text-slate-400">
                      {incident.priority} · {incident.category}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

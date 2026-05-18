import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { Loader } from '../components/Loader';
import { ErrorState } from '../components/ErrorState';

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/summary')
      .then(({ data }) => setSummary(data.summary))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load report summary'));
  }, []);

  const downloadCsv = async () => {
    try {
      const response = await api.get('/incidents/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'all-incidents.csv';
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'CSV download failed');
    }
  };

  if (error) return <ErrorState message={error} />;
  if (!summary) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold">Reports</div>
          <div className="text-sm text-slate-400">Generate shared operational reports for leadership, auditors, and incident review.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn-primary" to="/reports/print?autoPrint=1" target="_blank" rel="noreferrer">
            Print Report
          </Link>
          <button className="btn-secondary" onClick={downloadCsv}>Download CSV</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="panel p-4">
          <div className="text-sm text-slate-400">Total Incidents</div>
          <div className="mt-2 text-3xl font-semibold">{summary.total}</div>
        </div>
        <div className="panel p-4">
          <div className="text-sm text-slate-400">Open Incidents</div>
          <div className="mt-2 text-3xl font-semibold">{summary.open}</div>
        </div>
        <div className="panel p-4">
          <div className="text-sm text-slate-400">Critical Incidents</div>
          <div className="mt-2 text-3xl font-semibold">{summary.critical}</div>
        </div>
        <div className="panel p-4">
          <div className="text-sm text-slate-400">SLA Breached</div>
          <div className="mt-2 text-3xl font-semibold">{summary.breached}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">Report Notes</div>
        <div className="panel-body space-y-2 text-sm text-slate-300">
          <div>The printable report is organized by incident, with one dedicated section per incident record.</div>
          <div>The CSV export includes the full incident dataset, including timestamps, resolution fields, tags, and attachments.</div>
          <div>The print view is optimized for Chrome and Edge so Save as PDF matches the on-screen preview.</div>
        </div>
      </div>
    </div>
  );
}

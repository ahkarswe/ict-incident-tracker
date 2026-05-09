import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { Loader } from '../components/Loader';
import { ErrorState } from '../components/ErrorState';
import { StatCard } from '../components/StatCard';
import { IncidentTable } from '../components/IncidentTable';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#94a3b8'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/summary')
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'));
  }, []);

  const monthly = useMemo(
    () =>
      (data?.monthlyTrend || []).map((item) => ({
        name: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        value: item.value
      })),
    [data]
  );

  if (error) return <ErrorState message={error} />;
  if (!data) return <Loader />;

  const { summary, byCategory, byPriority, slaComplianceRate, recent } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Incidents" value={summary.total} />
        <StatCard label="Open Incidents" value={summary.open} accent="yellow" />
        <StatCard label="Critical Incidents" value={summary.critical} accent="red" />
        <StatCard label="Resolved Incidents" value={summary.resolved} accent="green" />
        <StatCard label="SLA Breached" value={summary.breached} accent="red" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel">
          <div className="panel-header">Incidents by Category</div>
          <div className="panel-body h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="_id" outerRadius={110} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}>
                  {byCategory.map((entry, index) => (
                    <Cell key={entry._id} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">Incidents by Priority</div>
          <div className="panel-body h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="_id" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel">
          <div className="panel-header">Monthly Incident Trend</div>
          <div className="panel-body h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">SLA Compliance Rate</div>
          <div className="panel-body flex h-72 items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-semibold">{slaComplianceRate}%</div>
              <div className="mt-2 text-sm text-slate-400">Incidents within SLA target</div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">Recent Incidents</div>
        <div className="panel-body">
          <IncidentTable items={recent} />
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Badge } from './Badge';

export const IncidentTable = ({ items = [] }) => (
  <div className="overflow-hidden rounded-lg border border-slate-800">
    <table className="min-w-full divide-y divide-slate-800 text-sm">
      <thead className="bg-slate-900">
        <tr>
          {['ID', 'Title', 'Priority', 'Status', 'Category', 'Engineer', 'SLA', 'Start Time'].map((head) => (
            <th key={head} className="px-4 py-3 text-left font-medium text-slate-400">
              {head}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800 bg-slate-950">
        {items.map((incident) => (
          <tr key={incident._id} className="hover:bg-slate-900/60">
            <td className="px-4 py-3">
              <Link className="text-brand-400 hover:text-brand-300" to={`/incidents/${incident._id}`}>
                {incident.incidentId}
              </Link>
            </td>
            <td className="px-4 py-3 text-slate-200">{incident.title}</td>
            <td className="px-4 py-3">
              <Badge value={incident.priority} />
            </td>
            <td className="px-4 py-3">
              <Badge value={incident.status} />
            </td>
            <td className="px-4 py-3 text-slate-300">{incident.category}</td>
            <td className="px-4 py-3 text-slate-300">{incident.assignedEngineer?.name || 'Unassigned'}</td>
            <td className="px-4 py-3 text-slate-300">{incident.slaIndicator}</td>
            <td className="px-4 py-3 text-slate-400">{incident.startTime ? new Date(incident.startTime).toLocaleString() : '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const Badge = ({ value }) => {
  const key = String(value || '').toLowerCase();
  if (['critical', 'red', 'breached'].includes(key)) return <span className="badge-red">{value}</span>;
  if (['high', 'yellow', 'monitoring', 'in progress'].includes(key)) return <span className="badge-yellow">{value}</span>;
  if (['resolved', 'closed', 'green'].includes(key)) return <span className="badge-green">{value}</span>;
  return <span className="badge-slate">{value}</span>;
};

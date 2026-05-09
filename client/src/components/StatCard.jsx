export const StatCard = ({ label, value, accent = 'slate', hint }) => {
  const styles = {
    slate: 'border-slate-800 bg-slate-900',
    red: 'border-rose-800/60 bg-rose-950/30',
    yellow: 'border-amber-800/60 bg-amber-950/30',
    green: 'border-emerald-800/60 bg-emerald-950/30'
  };

  return (
    <div className={`rounded-lg border p-4 ${styles[accent]}`}>
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
};

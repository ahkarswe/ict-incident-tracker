export const Filters = ({ filters, setFilters, engineers = [] }) => {
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <input className="input" placeholder="Search title or ID" value={filters.search} onChange={(e) => update('search', e.target.value)} />
      <select className="select" value={filters.status} onChange={(e) => update('status', e.target.value)}>
        <option value="">All Statuses</option>
        {['Open', 'In Progress', 'Monitoring', 'Resolved', 'Closed'].map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <select className="select" value={filters.priority} onChange={(e) => update('priority', e.target.value)}>
        <option value="">All Priorities</option>
        {['Critical', 'High', 'Medium', 'Low'].map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <select className="select" value={filters.category} onChange={(e) => update('category', e.target.value)}>
        <option value="">All Categories</option>
        {['Network', 'Server', 'Cloud', 'Security', 'Database', 'Backup', 'Application', 'Power', 'ISP'].map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <select className="select" value={filters.assignedEngineer} onChange={(e) => update('assignedEngineer', e.target.value)}>
        <option value="">All Engineers</option>
        {engineers.map((engineer) => (
          <option key={engineer.id} value={engineer.id}>
            {engineer.name}
          </option>
        ))}
      </select>
      <input className="input" type="date" value={filters.from} onChange={(e) => update('from', e.target.value)} />
      <input className="input" type="date" value={filters.to} onChange={(e) => update('to', e.target.value)} />
    </div>
  );
};

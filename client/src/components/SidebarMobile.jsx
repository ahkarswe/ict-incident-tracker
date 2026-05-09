import { NavLink } from 'react-router-dom';

export const SidebarMobile = ({ user }) => (
  <div className="lg:hidden">
    <div className="flex gap-2 overflow-x-auto border-b border-slate-800 px-4 py-3">
      <NavLink className="btn-secondary whitespace-nowrap" to="/dashboard">
        Dashboard
      </NavLink>
      <NavLink className="btn-secondary whitespace-nowrap" to="/incidents">
        Incidents
      </NavLink>
      {['Admin', 'Engineer'].includes(user?.role) ? (
        <NavLink className="btn-secondary whitespace-nowrap" to="/reports">
          Reports
        </NavLink>
      ) : null}
      {user?.role === 'Admin' ? (
        <NavLink className="btn-secondary whitespace-nowrap" to="/users">
          Users
        </NavLink>
      ) : null}
      <NavLink className="btn-secondary whitespace-nowrap" to="/profile">
        Profile
      </NavLink>
    </div>
  </div>
);

import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SidebarMobile } from './SidebarMobile';

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Incidents', to: '/incidents' },
  { label: 'Reports', to: '/reports', roles: ['Admin', 'Engineer'] },
  { label: 'Users', to: '/users', adminOnly: true },
  { label: 'Profile', to: '/profile' }
];

const navClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm transition ${isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`;

export const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-slate-800 bg-slate-950/90 p-5 lg:block">
          <Link to="/dashboard" className="mb-8 block">
            <div className="text-lg font-semibold tracking-tight">ICT Incident Tracker</div>
            <div className="text-xs text-slate-400">Operations control plane</div>
          </Link>
          <nav className="space-y-1">
            {navItems
              .filter((item) => (item.adminOnly ? user?.role === 'Admin' : !item.roles || item.roles.includes(user?.role)))
              .map((item) => (
                <NavLink key={item.to} to={item.to} className={navClass}>
                  {item.label}
                </NavLink>
              ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3 lg:px-6">
              <div>
                <div className="text-sm text-slate-400">Current view</div>
                <div className="text-lg font-medium capitalize">{location.pathname.replace('/', '') || 'Dashboard'}</div>
              </div>
              <div className="flex items-center gap-3">
                <button className="btn-secondary" onClick={toggleTheme}>
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-medium">{user?.name}</div>
                  <div className="text-xs text-slate-400">{user?.role}</div>
                </div>
                <button className="btn-primary" onClick={logout}>
                  Logout
                </button>
              </div>
            </div>
            <SidebarMobile user={user} />
          </header>
          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

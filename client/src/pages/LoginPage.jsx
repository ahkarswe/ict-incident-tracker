import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '!' });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <button className="btn-secondary absolute right-4 top-4 z-10" onClick={toggleTheme}>
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
      <div className="flex items-center justify-center border-r border-slate-800 bg-slate-950 p-8">
        <div className="max-w-md space-y-6">
          <div>
            <div className="text-3xl font-semibold">ICT Incident Tracker</div>
            <p className="mt-2 text-slate-400">Operational visibility for infrastructure incidents, outages, and remediation workflow.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {['SLA tracking', 'RBAC', 'Audit logs', 'Realtime updates'].map((item) => (
              <div key={item} className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-slate-900 p-8">
        <form onSubmit={submit} className="panel w-full max-w-md">
          <div className="panel-header">
            <div className="text-xl font-semibold">Sign in</div>
            <div className="text-sm text-slate-400">Use your ICT operations account.</div>
          </div>
          <div className="panel-body space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input mt-1" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

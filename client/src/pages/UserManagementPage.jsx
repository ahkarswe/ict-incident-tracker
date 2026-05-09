import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { Loader } from '../components/Loader';

const empty = { name: '', email: '', password: '', role: 'Viewer', avatarUrl: '', isActive: true };

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState('');

  const load = () =>
    api
      .get('/users')
      .then(({ data }) => {
        setUsers(data.users);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || 'Failed to load users');
      })
      .finally(() => {
        setLoading(false);
      });

  useEffect(() => {
    load();
  }, []);

  const createUser = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/users/${editingId}`, {
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          role: form.role,
          avatarUrl: form.avatarUrl,
          isActive: form.isActive
        });
        toast.success('User updated');
      } else {
        await api.post('/users', form);
        toast.success('User created');
      }
      setForm(empty);
      setEditingId('');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed');
    }
  };

  const toggleUser = async (user) => {
    await api.patch(`/users/${user.id}`, { isActive: !user.isActive });
    toast.success('User updated');
    load();
  };

  const beginEdit = (user) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      avatarUrl: user.avatarUrl || '',
      isActive: user.isActive
    });
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-semibold">User Management</div>
        <div className="text-sm text-slate-400">Admin-only access for role assignment and account control.</div>
      </div>

      <form onSubmit={createUser} className="panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-medium">{editingId ? 'Edit User' : 'Create User'}</div>
            <div className="text-xs text-slate-400">{editingId ? 'Update the selected account.' : 'Provision a new account for the operations team.'}</div>
          </div>
          {editingId ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditingId('');
                setForm(empty);
              }}
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" type="password" placeholder={editingId ? 'New password optional' : 'Password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {['Admin', 'Engineer', 'Viewer'].map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input className="input" placeholder="Avatar URL" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
          <label className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active account
          </label>
        </div>
        <button className="btn-primary mt-4">{editingId ? 'Update User' : 'Create User'}</button>
      </form>

      <div className="panel">
        <div className="panel-header">Accounts</div>
        <div className="panel-body overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="py-2">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-800">
                  <td className="py-3">{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.isActive ? 'Active' : 'Disabled'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-secondary" onClick={() => beginEdit(user)}>
                        Edit
                      </button>
                      <button className="btn-secondary" onClick={() => toggleUser(user)}>
                        {user.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

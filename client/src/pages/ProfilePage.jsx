import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: '', avatarUrl: '' });

  useEffect(() => {
    if (user) setForm({ name: user.name || '', avatarUrl: user.avatarUrl || '' });
  }, [user]);

  const save = async () => {
    const { data } = await api.patch('/users/profile/me', form);
    setUser(data.user);
    toast.success('Profile updated');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="text-2xl font-semibold">Profile</div>
        <div className="text-sm text-slate-400">Personal account settings for the current session.</div>
      </div>
      <div className="panel p-5 space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Avatar URL</label>
          <input className="input mt-1" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
        </div>
        <button className="btn-primary" onClick={save}>Save Profile</button>
      </div>
    </div>
  );
}

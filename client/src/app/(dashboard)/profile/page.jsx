'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Building, BookOpen, Edit3, Save, X, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { generateAvatarGradient, getInitials } from '@/lib/utils';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '', bio: user.bio || '', university: user.university || '', department: user.department || '', semester: user.semester || 1, skills: user.skills || [] });
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put('/users/profile', form);
      // updateProfile returns { success, data: updatedUser }
      // so res.data.data is the user object directly
      const updated = res.data?.data;
      if (updated && setUser) setUser(prev => ({ ...prev, ...updated }));
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const addSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !form.skills.includes(skillInput.trim())) {
      setForm(f => ({ ...f, skills: [...f.skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };

  const removeSkill = (s) => setForm(f => ({ ...f, skills: f.skills.filter(sk => sk !== s) }));

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Min 6 characters'); return; }
    setPwSaving(true);
    try {
      await api.put('/users/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    setPwSaving(false);
  };

  const grad = generateAvatarGradient(user?.name);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">My Profile</h1>

      {/* Profile header */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-2xl font-bold flex-shrink-0`}>
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-300">{user?.role}</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-slate-300">{user?.department} · Sem {user?.semester}</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-slate-300">{user?.university}</span>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)} className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-400 hover:text-white transition-colors flex-shrink-0">
            {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-white">Edit Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Full Name', key: 'name', icon: User },
              { label: 'Phone', key: 'phone', icon: Phone },
              { label: 'University', key: 'university', icon: Building },
              { label: 'Department', key: 'department', icon: BookOpen },
            ].map(({ label, key, icon: Icon }) => (
              <div key={key}>
                <label className="text-xs text-slate-400 mb-1 block">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-all" />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Semester</label>
            <select value={form.semester} onChange={e => setForm(f => ({ ...f, semester: parseInt(e.target.value) }))} className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500">
              {[1,2,3,4,5,6].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Bio</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 resize-none transition-all" />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Skills</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.skills?.map(s => (
                <span key={s} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs">
                  {s}<button onClick={() => removeSkill(s)} className="hover:text-red-400 ml-1">×</button>
                </span>
              ))}
            </div>
            <form onSubmit={addSkill} className="flex gap-2">
              <input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="Add a skill..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500" />
              <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition-colors">Add</button>
            </form>
          </div>

          <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 hover:from-indigo-500 hover:to-purple-500 transition-all">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Save Changes</>}
          </button>
        </motion.div>
      )}

      {/* Change password */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-indigo-400" />Change Password</h3>
        <form onSubmit={changePassword} className="space-y-3">
          {[
            { label: 'Current Password', key: 'currentPassword' },
            { label: 'New Password', key: 'newPassword' },
            { label: 'Confirm New Password', key: 'confirmPassword' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-xs text-slate-400 mb-1 block">{label}</label>
              <input type="password" value={pwForm[key]} onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-all" />
            </div>
          ))}
          <button type="submit" disabled={pwSaving} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-60 hover:from-indigo-500 hover:to-purple-500 transition-all">
            {pwSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

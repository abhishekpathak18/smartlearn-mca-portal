'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Edit, Trash2, CheckCircle, XCircle, Shield } from 'lucide-react';
import api from '@/lib/api';
import { formatDate, getInitials, generateAvatarGradient } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (search) params.append('search', search);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data?.data?.users || res.data?.data || []);
      setTotal(res.data?.data?.total || 0);
    } catch { setUsers([]); }
    setLoading(false);
  };

  useEffect(() => { const t = setTimeout(fetchUsers, 400); return () => clearTimeout(t); }, [search, roleFilter, page]);

  const toggleActive = async (id, isActive) => {
    try {
      await api.put(`/admin/users/${id}`, { isActive: !isActive });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !isActive } : u));
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to update user'); }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch { toast.error('Failed to delete user'); }
  };

  const makeAdmin = async (id, role) => {
    try {
      const newRole = role === 'admin' ? 'student' : 'admin';
      await api.put(`/admin/users/${id}`, { role: newRole });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role: newRole } : u));
      toast.success(`Role updated to ${newRole}`);
    } catch { toast.error('Failed to update role'); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">User Management</h1>

      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search users..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-500 outline-none focus:border-indigo-500 transition-all" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 outline-none">
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 hidden md:table-cell">Department</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 hidden lg:table-cell">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="px-5 py-3"><div className="h-8 bg-white/10 rounded animate-pulse" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-white/10 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-white/10 rounded animate-pulse" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 bg-white/10 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-white/10 rounded animate-pulse" /></td>
                    <td className="px-5 py-3"><div className="h-8 bg-white/10 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : users.map((user, i) => (
                <motion.tr key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${generateAvatarGradient(user.name)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>{getInitials(user.name)}</div>
                      <div><p className="font-medium text-white">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-300">{user.department} · Sem {user.semester}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-indigo-500/20 text-indigo-300'}`}>{user.role}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-400 text-xs">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>
                      {user.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => toggleActive(user._id, user.isActive)} title={user.isActive ? 'Deactivate' : 'Activate'} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        {user.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button onClick={() => makeAdmin(user._id, user.role)} title="Toggle Admin" className="p-1.5 rounded-lg hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-colors">
                        <Shield className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteUser(user._id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 disabled:opacity-40 hover:bg-white/10">Prev</button>
          <span className="text-sm text-slate-400">Page {page} of {Math.ceil(total / limit)}</span>
          <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 disabled:opacity-40 hover:bg-white/10">Next</button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Shield, Ban, Trash2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import api from '../../lib/axios';

const ROLES   = [{ value: '', label: 'Tous rôles' }, { value: 'user', label: 'Utilisateur' }, { value: 'admin', label: 'Admin' }];
const STATUTS = [{ value: '', label: 'Tous statuts' }, { value: 'actif', label: 'Actif' }, { value: 'bloque', label: 'Bloqué' }];

export default function AdminUsers() {
    const [users, setUsers]       = useState([]);
    const [meta, setMeta]         = useState({});
    const [loading, setLoading]   = useState(true);
    const [page, setPage]         = useState(1);
    const [filters, setFilters]   = useState({ q: '', role: '', statut: '' });
    const [showAdd, setShowAdd]   = useState(false);
    const [form, setForm]         = useState({ nom: '', email: '', password: '', telephone: '', role: 'user' });
    const [addError, setAddError] = useState('');
    const [addLoading, setAddLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
            const res = await api.get('/admin/users', { params });
            setUsers(res.data.data);
            setMeta(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [page, filters]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const updateUser = async (id, data) => {
        try {
            await api.put(`/admin/users/${id}`, data);
            fetchUsers();
        } catch (e) { console.error(e); }
    };

    const deleteUser = async (id, nom) => {
        if (!confirm(`Supprimer définitivement « ${nom} » et toutes ses annonces ?`)) return;
        try { await api.delete(`/admin/users/${id}`); fetchUsers(); }
        catch (e) { console.error(e); }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        setAddError('');
        setAddLoading(true);
        try {
            await api.post('/admin/users', form);
            setShowAdd(false);
            setForm({ nom: '', email: '', password: '', telephone: '', role: 'user' });
            fetchUsers();
        } catch (err) {
            setAddError(err.response?.data?.message || 'Erreur lors de la création.');
        } finally { setAddLoading(false); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-white">Utilisateurs</h1>
                    <p className="text-slate-400 text-sm mt-1">{meta.total ?? '—'} utilisateurs inscrits</p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#4ade80] hover:bg-[#22c55e] text-[#0f172a] font-bold rounded-xl transition text-sm"
                >
                    <Plus className="w-4 h-4" /> Ajouter
                </button>
            </div>

            {/* Filters */}
            <div className="bg-[#1e293b] rounded-2xl p-4 border border-white/5 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        value={filters.q}
                        onChange={e => { setFilters(f => ({ ...f, q: e.target.value })); setPage(1); }}
                        placeholder="Rechercher nom, email..."
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-4 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-[#4ade80]"
                    />
                </div>
                <select value={filters.role} onChange={e => { setFilters(f => ({ ...f, role: e.target.value })); setPage(1); }}
                    className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#4ade80]">
                    {ROLES.map(r => <option key={r.value} value={r.value} className="bg-[#1e293b]">{r.label}</option>)}
                </select>
                <select value={filters.statut} onChange={e => { setFilters(f => ({ ...f, statut: e.target.value })); setPage(1); }}
                    className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#4ade80]">
                    {STATUTS.map(s => <option key={s.value} value={s.value} className="bg-[#1e293b]">{s.label}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="text-left px-5 py-3.5">Utilisateur</th>
                                <th className="text-left px-5 py-3.5">Téléphone</th>
                                <th className="text-left px-5 py-3.5">Rôle</th>
                                <th className="text-left px-5 py-3.5">Statut</th>
                                <th className="text-left px-5 py-3.5">Annonces</th>
                                <th className="text-left px-5 py-3.5">Inscrit le</th>
                                <th className="text-right px-5 py-3.5">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Chargement...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Aucun utilisateur trouvé.</td></tr>
                            ) : users.map(u => (
                                <tr key={u.id} className="hover:bg-white/3 transition">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#4ade80]/10 flex items-center justify-center text-[#4ade80] font-bold text-sm uppercase flex-shrink-0">
                                                {u.nom?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">{u.nom}</p>
                                                <p className="text-xs text-slate-500">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-400">{u.telephone || '—'}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-[#4ade80]/10 text-[#4ade80]' : 'bg-white/5 text-slate-400'}`}>
                                            {u.role === 'admin' ? 'Admin' : 'Utilisateur'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.statut === 'bloque' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                            {u.statut === 'bloque' ? 'Bloqué' : 'Actif'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-400">{u.annonces_count}</td>
                                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link to={`/admin/utilisateurs/${u.id}`}
                                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition" title="Voir">
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <button onClick={() => updateUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })}
                                                className="w-8 h-8 rounded-lg bg-[#4ade80]/10 hover:bg-[#4ade80]/20 flex items-center justify-center text-[#4ade80] transition" title={u.role === 'admin' ? 'Rétrograder' : 'Promouvoir Admin'}>
                                                <Shield className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => updateUser(u.id, { statut: u.statut === 'bloque' ? 'actif' : 'bloque' })}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${u.statut === 'bloque' ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                                                title={u.statut === 'bloque' ? 'Débloquer' : 'Bloquer'}>
                                                <Ban className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteUser(u.id, u.nom)} disabled={u.role === 'admin'}
                                                className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition disabled:opacity-30 disabled:cursor-not-allowed" title="Supprimer">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta.last_page > 1 && (
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/5">
                        <p className="text-xs text-slate-500">Page {meta.current_page} / {meta.last_page}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 disabled:opacity-30 transition">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 disabled:opacity-30 transition">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Ajouter Utilisateur */}
            {showAdd && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1e293b] rounded-2xl p-8 w-full max-w-md border border-white/10 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-6">Ajouter un utilisateur</h3>
                        {addError && <p className="text-red-400 text-sm mb-4 bg-red-500/10 px-4 py-2 rounded-xl">{addError}</p>}
                        <form onSubmit={handleAdd} className="space-y-4">
                            {[
                                { key: 'nom', placeholder: 'Nom complet', type: 'text' },
                                { key: 'email', placeholder: 'Adresse email', type: 'email' },
                                { key: 'telephone', placeholder: 'Téléphone (optionnel)', type: 'text' },
                                { key: 'password', placeholder: 'Mot de passe', type: 'password' },
                            ].map(({ key, placeholder, type }) => (
                                <input key={key} type={type} placeholder={placeholder} required={key !== 'telephone'}
                                    value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-[#4ade80]"
                                />
                            ))}
                            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4ade80]">
                                <option value="user" className="bg-[#1e293b]">Utilisateur</option>
                                <option value="admin" className="bg-[#1e293b]">Admin</option>
                            </select>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowAdd(false)}
                                    className="flex-1 border border-white/10 text-slate-400 hover:text-white py-2.5 rounded-xl text-sm font-semibold transition">
                                    Annuler
                                </button>
                                <button type="submit" disabled={addLoading}
                                    className="flex-1 bg-[#4ade80] hover:bg-[#22c55e] text-[#0f172a] font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-60">
                                    {addLoading ? 'Création...' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

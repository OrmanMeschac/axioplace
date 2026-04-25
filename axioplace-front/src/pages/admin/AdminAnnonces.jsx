import { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, XCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/axios';

const STATUTS = [
    { value: '', label: 'Tous statuts' },
    { value: 'validee', label: 'Validée' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'suspendue', label: 'Suspendue' },
];

const STATUS_CFG = {
    validee:    { label: 'Validée',     cls: 'bg-green-500/10 text-green-400' },
    suspendue:  { label: 'Suspendue',   cls: 'bg-red-500/10 text-red-400' },
    en_attente: { label: 'En attente',  cls: 'bg-yellow-500/10 text-yellow-400' },
};

export default function AdminAnnonces() {
    const [annonces, setAnnonces] = useState([]);
    const [meta, setMeta]         = useState({});
    const [loading, setLoading]   = useState(true);
    const [page, setPage]         = useState(1);
    const [filters, setFilters]   = useState({ q: '', statut: '' });

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
            const res = await api.get('/admin/annonces', { params });
            setAnnonces(res.data.data);
            setMeta(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [page, filters]);

    useEffect(() => { fetch(); }, [fetch]);

    const updateStatut = async (id, statut) => {
        try { await api.put(`/admin/annonces/${id}/valider`, { statut }); fetch(); }
        catch (e) { console.error(e); }
    };

    const deleteAnnonce = async (id, titre) => {
        if (!confirm(`Supprimer « ${titre} » définitivement ?`)) return;
        try { await api.delete(`/admin/annonces/${id}`); fetch(); }
        catch (e) { console.error(e); }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-white">Annonces</h1>
                <p className="text-slate-400 text-sm mt-1">{meta.total ?? '—'} annonces au total</p>
            </div>

            {/* Filters */}
            <div className="bg-[#1e293b] rounded-2xl p-4 border border-white/5 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input value={filters.q}
                        onChange={e => { setFilters(f => ({ ...f, q: e.target.value })); setPage(1); }}
                        placeholder="Rechercher titre, vendeur..."
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-4 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-[#4ade80]"
                    />
                </div>
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
                                <th className="text-left px-5 py-3.5">Annonce</th>
                                <th className="text-left px-5 py-3.5">Vendeur</th>
                                <th className="text-left px-5 py-3.5">Catégorie</th>
                                <th className="text-left px-5 py-3.5">Prix</th>
                                <th className="text-left px-5 py-3.5">Statut</th>
                                <th className="text-left px-5 py-3.5">Date</th>
                                <th className="text-right px-5 py-3.5">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Chargement...</td></tr>
                            ) : annonces.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Aucune annonce.</td></tr>
                            ) : annonces.map(a => {
                                const s = STATUS_CFG[a.statut] || { label: a.statut, cls: 'bg-gray-500/10 text-gray-400' };
                                return (
                                    <tr key={a.id} className="hover:bg-white/3 transition">
                                        <td className="px-5 py-3.5 max-w-xs">
                                            <p className="font-semibold text-white truncate">{a.titre}</p>
                                            <p className="text-xs text-slate-500">{a.ville?.nom || '—'}</p>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-400">{a.user?.nom || '—'}</td>
                                        <td className="px-5 py-3.5 text-slate-400">{a.categorie?.nom || '—'}</td>
                                        <td className="px-5 py-3.5 text-slate-300 font-medium">{a.prix ? `${Number(a.prix).toLocaleString('fr-FR')} FCFA` : 'Sur demande'}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500 text-xs">{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-2">
                                                {a.statut !== 'validee' && (
                                                    <button onClick={() => updateStatut(a.id, 'validee')}
                                                        className="w-8 h-8 rounded-lg bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center text-green-400 transition" title="Valider">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {a.statut !== 'suspendue' && (
                                                    <button onClick={() => updateStatut(a.id, 'suspendue')}
                                                        className="w-8 h-8 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 flex items-center justify-center text-orange-400 transition" title="Suspendre">
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => deleteAnnonce(a.id, a.titre)}
                                                    className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition" title="Supprimer">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
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
        </div>
    );
}

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, UserX, Shield, Copy, MapPin, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';

const TABS = [
    { key: 'signales_souvent', label: 'Signalé souvent',     icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/10',    badge: 'bg-red-500/20 text-red-400' },
    { key: 'spam_annonces',    label: 'Spam d\'annonces',     icon: Copy,          color: 'text-orange-400', bg: 'bg-orange-500/10', badge: 'bg-orange-500/20 text-orange-400' },
    { key: 'multi_villes',     label: 'Multi-villes',         icon: MapPin,        color: 'text-purple-400', bg: 'bg-purple-500/10', badge: 'bg-purple-500/20 text-purple-400' },
    { key: 'duplicates',       label: 'Annonces dupliquées',  icon: Copy,          color: 'text-yellow-400', bg: 'bg-yellow-500/10', badge: 'bg-yellow-500/20 text-yellow-400' },
];

const REASON_LABELS = {
    signalements: { label: 'Signalé',   cls: 'bg-red-500/20 text-red-400' },
    spam:         { label: 'Spam',      cls: 'bg-orange-500/20 text-orange-400' },
    multi_villes: { label: 'Multi-villes', cls: 'bg-purple-500/20 text-purple-400' },
    duplicate:    { label: 'Doublons',  cls: 'bg-yellow-500/20 text-yellow-400' },
};

export default function AdminSuspects() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab]         = useState('signales_souvent');
    const [acting, setActing]   = useState(null);

    const fetchSuspects = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/suspects');
            setData(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchSuspects(); }, [fetchSuspects]);

    const blockUser = async (userId) => {
        if (!confirm('Bloquer cet utilisateur ?')) return;
        setActing(userId);
        try {
            await api.put(`/admin/users/${userId}`, { statut: 'bloque' });
            fetchSuspects();
        } catch (e) { console.error(e); }
        finally { setActing(null); }
    };

    const deleteUser = async (userId) => {
        if (!confirm('⚠️ Supprimer définitivement ce compte et toutes ses annonces ?')) return;
        if (!confirm('Dernière confirmation : cette action est irréversible.')) return;
        setActing(userId);
        try {
            await api.delete(`/admin/users/${userId}`);
            fetchSuspects();
        } catch (e) { console.error(e); }
        finally { setActing(null); }
    };

    const currentTab  = TABS.find(t => t.key === tab);
    const currentList = data?.[tab] ?? [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-orange-400" />
                        Comportements suspects
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Détection automatique — {data?.total ?? '—'} compte(s) identifié(s)
                    </p>
                </div>
                <button
                    onClick={fetchSuspects}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm rounded-xl transition"
                >
                    Actualiser
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {TABS.map(t => {
                    const count = data?.[t.key]?.length ?? 0;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                                tab === t.key ? 'bg-[#4ade80] text-[#0f172a]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <t.icon className="w-3.5 h-3.5" />
                            {t.label}
                            {count > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    tab === t.key ? 'bg-black/20 text-black' : t.badge
                                }`}>{count}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-2 border-white/10 border-t-[#4ade80] rounded-full animate-spin" />
                    </div>
                ) : currentList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Shield className="w-12 h-12 text-slate-600 mb-3" />
                        <p className="text-slate-400 font-semibold">Aucun compte suspect dans cette catégorie</p>
                        <p className="text-slate-600 text-sm mt-1">Bonne nouvelle ! Rien à signaler.</p>
                    </div>
                ) : (
                    <div>
                        {/* Column header */}
                        <div className={`px-5 py-3 border-b border-white/5 flex items-center gap-2 ${currentTab.bg}`}>
                            <currentTab.icon className={`w-4 h-4 ${currentTab.color}`} />
                            <span className={`text-xs font-bold uppercase tracking-wide ${currentTab.color}`}>
                                {currentTab.label} — {currentList.length} compte(s)
                            </span>
                        </div>

                        <div className="divide-y divide-white/5">
                            {currentList.map((u, idx) => {
                                const r = REASON_LABELS[u.reason] || { label: u.reason, cls: 'bg-slate-500/10 text-slate-400' };
                                const isActing = acting === u.id;
                                return (
                                    <div key={`${u.id}-${idx}`} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white/3 transition">
                                        {/* User info */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 uppercase">
                                                {u.nom?.charAt(0) || '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-semibold text-white">{u.nom}</p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.cls}`}>{r.label}</span>
                                                    {u.statut === 'bloque' && (
                                                        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">Bloqué</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 truncate">{u.email}</p>
                                                {/* Metric */}
                                                {u.nb_signalements  && <p className="text-xs text-red-400 mt-0.5">{u.nb_signalements} signalement(s) reçu(s)</p>}
                                                {u.nb_annonces_24h  && <p className="text-xs text-orange-400 mt-0.5">{u.nb_annonces_24h} annonce(s) en 24h</p>}
                                                {u.nb_villes        && <p className="text-xs text-purple-400 mt-0.5">{u.nb_villes} villes différentes</p>}
                                                {u.nb_doublons      && <p className="text-xs text-yellow-400 mt-0.5">{u.nb_doublons} doublon(s) — ex: «{u.exemple_titre}»</p>}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Link
                                                to={`/admin/utilisateurs/${u.id}`}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition"
                                            >
                                                <ExternalLink className="w-3 h-3" /> Voir
                                            </Link>
                                            {u.statut !== 'bloque' && (
                                                <button
                                                    onClick={() => blockUser(u.id)}
                                                    disabled={isActing}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-semibold transition disabled:opacity-50"
                                                >
                                                    <Shield className="w-3 h-3" /> Bloquer
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteUser(u.id)}
                                                disabled={isActing}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition disabled:opacity-50"
                                            >
                                                <UserX className="w-3 h-3" /> Supprimer
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

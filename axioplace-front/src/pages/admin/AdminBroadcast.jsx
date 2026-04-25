import { useState, useEffect, useCallback } from 'react';
import { Send, Bell, Info, AlertTriangle, Zap, RefreshCw, Trash2, Users, User, Search } from 'lucide-react';
import api from '../../lib/axios';

const TYPES = [
    { value: 'info',    label: 'Information',      icon: Info,          cls: 'bg-blue-500/10 text-blue-400',    border: 'border-blue-500/30' },
    { value: 'update',  label: 'Mise à jour',       icon: RefreshCw,     cls: 'bg-[#4ade80]/10 text-[#4ade80]', border: 'border-[#4ade80]/30' },
    { value: 'warning', label: 'Avertissement',     icon: AlertTriangle, cls: 'bg-orange-500/10 text-orange-400', border: 'border-orange-500/30' },
    { value: 'alert',   label: 'Alerte urgente',    icon: Zap,           cls: 'bg-red-500/10 text-red-400',      border: 'border-red-500/30' },
];

const TYPE_MAP = Object.fromEntries(TYPES.map(t => [t.value, t]));

export default function AdminBroadcast() {
    // Form state
    const [titre, setTitre]           = useState('');
    const [corps, setCorps]           = useState('');
    const [type, setType]             = useState('info');
    const [targetMode, setTargetMode] = useState('all'); // 'all' | 'specific'
    const [userQuery, setUserQuery]   = useState('');
    const [userResults, setUserResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [sending, setSending]       = useState(false);
    const [success, setSuccess]       = useState('');
    const [error, setError]           = useState('');

    // History
    const [history, setHistory]   = useState([]);
    const [histLoading, setHistLoading] = useState(true);
    const [histMeta, setHistMeta] = useState({});
    const [histPage, setHistPage] = useState(1);

    const selectedType = TYPE_MAP[type];

    // Fetch history
    const fetchHistory = useCallback(async () => {
        setHistLoading(true);
        try {
            const res = await api.get('/admin/notifications', { params: { page: histPage } });
            setHistory(res.data.data ?? []);
            setHistMeta(res.data);
        } catch (e) { console.error(e); }
        finally { setHistLoading(false); }
    }, [histPage]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    // User search
    useEffect(() => {
        if (!userQuery.trim() || targetMode !== 'specific') { setUserResults([]); return; }
        const t = setTimeout(async () => {
            try {
                const res = await api.get('/admin/users', { params: { q: userQuery, per_page: 8 } });
                setUserResults(res.data.data ?? []);
            } catch { setUserResults([]); }
        }, 300);
        return () => clearTimeout(t);
    }, [userQuery, targetMode]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!titre.trim() || !corps.trim()) return;
        if (targetMode === 'specific' && !selectedUser) { setError('Veuillez sélectionner un utilisateur.'); return; }

        setSending(true);
        setError('');
        setSuccess('');
        try {
            const payload = { titre, corps, type, target_user_id: targetMode === 'specific' ? selectedUser.id : null };
            const res = await api.post('/admin/notifications', payload);
            setSuccess(res.data.message);
            setTitre(''); setCorps(''); setSelectedUser(null); setUserQuery('');
            fetchHistory();
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur lors de l\'envoi.');
        } finally {
            setSending(false);
        }
    };

    const deleteNotif = async (id) => {
        if (!confirm('Supprimer cette notification ?')) return;
        try {
            await api.delete(`/admin/notifications/${id}`);
            fetchHistory();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                    <Bell className="w-6 h-6 text-[#4ade80]" />
                    Communication
                </h1>
                <p className="text-slate-400 text-sm mt-1">Envoyez des notifications à vos utilisateurs — broadcast ou ciblé</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* ── FORMULAIRE D'ENVOI ── */}
                <div className="bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/5">
                        <h2 className="font-bold text-white">Composer un message</h2>
                    </div>
                    <form onSubmit={handleSend} className="p-6 space-y-5">

                        {/* Type */}
                        <div>
                            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Type de notification</label>
                            <div className="grid grid-cols-2 gap-2">
                                {TYPES.map(t => (
                                    <button key={t.value} type="button" onClick={() => setType(t.value)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition ${
                                            type === t.value ? `${t.cls} ${t.border}` : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                                        }`}
                                    >
                                        <t.icon className="w-4 h-4 flex-shrink-0" />
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cible */}
                        <div>
                            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Destinataires</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => { setTargetMode('all'); setSelectedUser(null); setUserQuery(''); }}
                                    className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold border transition ${
                                        targetMode === 'all' ? 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/30' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                                    }`}
                                >
                                    <Users className="w-4 h-4" /> Tous les utilisateurs
                                </button>
                                <button type="button" onClick={() => setTargetMode('specific')}
                                    className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold border transition ${
                                        targetMode === 'specific' ? 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/30' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                                    }`}
                                >
                                    <User className="w-4 h-4" /> Utilisateur précis
                                </button>
                            </div>

                            {targetMode === 'specific' && (
                                <div className="mt-3 relative">
                                    {selectedUser ? (
                                        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl">
                                            <div className="w-7 h-7 rounded-full bg-[#4ade80]/20 flex items-center justify-center text-[#4ade80] font-bold text-xs uppercase flex-shrink-0">
                                                {selectedUser.nom?.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-white">{selectedUser.nom}</p>
                                                <p className="text-xs text-slate-400">{selectedUser.email}</p>
                                            </div>
                                            <button type="button" onClick={() => { setSelectedUser(null); setUserQuery(''); }}
                                                className="text-slate-500 hover:text-red-400 text-xs transition">✕</button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <input
                                                    type="text"
                                                    value={userQuery}
                                                    onChange={e => setUserQuery(e.target.value)}
                                                    placeholder="Nom ou email de l'utilisateur..."
                                                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#4ade80]/50 transition"
                                                />
                                            </div>
                                            {userResults.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden shadow-xl">
                                                    {userResults.map(u => (
                                                        <button key={u.id} type="button" onClick={() => { setSelectedUser(u); setUserQuery(''); setUserResults([]); }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition text-left"
                                                        >
                                                            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase flex-shrink-0">{u.nom?.charAt(0)}</div>
                                                            <div>
                                                                <p className="text-sm font-medium text-white">{u.nom}</p>
                                                                <p className="text-xs text-slate-500">{u.email}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Titre */}
                        <div>
                            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Titre</label>
                            <input
                                type="text"
                                value={titre}
                                onChange={e => setTitre(e.target.value)}
                                maxLength={200}
                                placeholder="Ex: Mise à jour importante d'Axioplace"
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#4ade80]/50 transition"
                                required
                            />
                        </div>

                        {/* Corps */}
                        <div>
                            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Message</label>
                            <textarea
                                value={corps}
                                onChange={e => setCorps(e.target.value)}
                                rows={5}
                                placeholder="Rédigez votre message ici..."
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#4ade80]/50 transition resize-none"
                                required
                            />
                        </div>

                        {/* Prévisualisation */}
                        {(titre || corps) && (
                            <div className={`p-4 rounded-xl border ${selectedType.border} ${selectedType.cls} space-y-1`}>
                                <div className="flex items-center gap-2">
                                    <selectedType.icon className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wide">{selectedType.label}</span>
                                </div>
                                {titre && <p className="font-bold text-sm">{titre}</p>}
                                {corps && <p className="text-xs opacity-80 whitespace-pre-wrap">{corps}</p>}
                            </div>
                        )}

                        {/* Feedback */}
                        {success && <div className="px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">{success}</div>}
                        {error   && <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

                        <button
                            type="submit"
                            disabled={sending || !titre.trim() || !corps.trim()}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#4ade80] hover:bg-[#4ade80]/90 text-[#0f172a] font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? (
                                <div className="w-4 h-4 border-2 border-[#0f172a]/30 border-t-[#0f172a] rounded-full animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {sending ? 'Envoi...' : targetMode === 'all' ? 'Envoyer à tous' : 'Envoyer'}
                        </button>
                    </form>
                </div>

                {/* ── HISTORIQUE ── */}
                <div className="bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                        <h2 className="font-bold text-white">Historique d'envois</h2>
                        <span className="text-xs text-slate-500">{histMeta.total ?? 0} notification(s)</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {histLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-6 h-6 border-2 border-white/10 border-t-[#4ade80] rounded-full animate-spin" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Bell className="w-10 h-10 text-slate-700 mb-3" />
                                <p className="text-slate-500 text-sm">Aucune notification envoyée</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {history.map(n => {
                                    const t = TYPE_MAP[n.type] || TYPES[0];
                                    return (
                                        <div key={n.id} className="px-5 py-4 flex items-start gap-3 hover:bg-white/3 transition group">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${t.cls}`}>
                                                <t.icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-white truncate">{n.titre}</p>
                                                        <p className="text-xs text-slate-500 truncate">{n.corps}</p>
                                                    </div>
                                                    <button onClick={() => deleteNotif(n.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition flex-shrink-0"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.cls}`}>{t.label}</span>
                                                    <span className="text-[10px] text-slate-600">
                                                        → {n.target_user ? n.target_user.nom : 'Tous les utilisateurs'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-600">
                                                        {new Date(n.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    {/* Pagination historique */}
                    {histMeta.last_page > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                            <p className="text-xs text-slate-500">Page {histMeta.current_page} / {histMeta.last_page}</p>
                            <div className="flex gap-2">
                                <button onClick={() => setHistPage(p => Math.max(1, p - 1))} disabled={histPage === 1}
                                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 disabled:opacity-30 transition">
                                    ‹
                                </button>
                                <button onClick={() => setHistPage(p => Math.min(histMeta.last_page, p + 1))} disabled={histPage === histMeta.last_page}
                                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 disabled:opacity-30 transition">
                                    ›
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

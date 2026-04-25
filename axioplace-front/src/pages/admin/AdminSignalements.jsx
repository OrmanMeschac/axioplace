import { useState, useEffect, useCallback } from 'react';
import {
    AlertTriangle, ChevronLeft, ChevronRight, ExternalLink,
    ShieldOff, Trash2, UserX, Bell, X, Check, Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';

const STATUTS = [
    { value: 'en_attente', label: 'En attente' },
    { value: 'traite',     label: 'Traité' },
    { value: 'rejete',     label: 'Rejeté' },
    { value: '',           label: 'Tous' },
];

const STATUS_CFG = {
    en_attente: { label: 'En attente', cls: 'bg-yellow-500/10 text-yellow-400' },
    traite:     { label: 'Traité',     cls: 'bg-green-500/10 text-green-400' },
    rejete:     { label: 'Rejeté',     cls: 'bg-slate-500/10 text-slate-400' },
};

const ACTIONS = [
    { value: 'suspend_annonce', label: 'Suspendre l\'annonce', icon: ShieldOff,  cls: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400', desc: 'Cache l\'annonce sans supprimer' },
    { value: 'block_user',      label: 'Bloquer le compte',    icon: ShieldOff,  cls: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400', desc: 'Bloque la connexion du vendeur' },
    { value: 'warn_user',       label: 'Avertir l\'utilisateur', icon: Bell,     cls: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400',   desc: 'Envoie une notification d\'avertissement' },
    { value: 'delete_annonce',  label: 'Supprimer l\'annonce', icon: Trash2,     cls: 'bg-red-500/10 hover:bg-red-500/20 text-red-400',       desc: 'Suppression définitive de l\'annonce' },
    { value: 'delete_user',     label: 'Supprimer le compte',  icon: UserX,      cls: 'bg-red-500/10 hover:bg-red-500/20 text-red-400',       desc: '⚠️ Irréversible — supprime compte + annonces' },
    { value: 'reject',          label: 'Rejeter le signalement', icon: X,        cls: 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-400', desc: 'Classé sans suite' },
];

export default function AdminSignalements() {
    const [signalements, setSignalements] = useState([]);
    const [meta, setMeta]       = useState({});
    const [loading, setLoading] = useState(true);
    const [page, setPage]       = useState(1);
    const [statut, setStatut]   = useState('en_attente');
    const [expanded, setExpanded] = useState(null);

    // Action panel
    const [actionPanel, setActionPanel] = useState(null); // { sig, action }
    const [warnNote, setWarnNote]       = useState('');
    const [acting, setActing]           = useState(false);
    const [actionMsg, setActionMsg]     = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, ...(statut ? { statut } : {}) };
            const res = await api.get('/admin/signalements', { params });
            setSignalements(res.data.data ?? []);
            setMeta(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [page, statut]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAction = async () => {
        if (!actionPanel) return;
        const { sig, action } = actionPanel;

        // Double-confirm for destructive actions
        if (['delete_user', 'delete_annonce'].includes(action.value)) {
            if (!confirm(`⚠️ ${action.label} — Action irréversible. Confirmer ?`)) return;
        }

        setActing(true);
        setActionMsg('');
        try {
            await api.post(`/admin/signalements/${sig.id}/action`, {
                action: action.value,
                note: warnNote || undefined,
            });
            setActionMsg('✅ Action effectuée avec succès.');
            setWarnNote('');
            setTimeout(() => {
                setActionPanel(null);
                setActionMsg('');
                fetchData();
            }, 1200);
        } catch (e) {
            setActionMsg('❌ ' + (e.response?.data?.message || 'Erreur lors de l\'action.'));
        } finally {
            setActing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-orange-400" />
                        Signalements
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">{meta.total ?? '—'} signalement(s) au total</p>
                </div>
            </div>

            {/* Filtres statut */}
            <div className="flex gap-2 flex-wrap">
                {STATUTS.map(s => (
                    <button key={s.value} onClick={() => { setStatut(s.value); setPage(1); setExpanded(null); }}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                            statut === s.value ? 'bg-[#4ade80] text-[#0f172a]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Liste */}
            <div className="space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center py-16 bg-[#1e293b] rounded-2xl border border-white/5">
                        <div className="w-8 h-8 border-2 border-white/10 border-t-[#4ade80] rounded-full animate-spin" />
                    </div>
                ) : signalements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-[#1e293b] rounded-2xl border border-white/5 text-center">
                        <Check className="w-12 h-12 text-green-500/30 mb-3" />
                        <p className="text-slate-400 font-semibold">Aucun signalement {statut ? `"${statut}"` : ''}</p>
                    </div>
                ) : signalements.map(sig => {
                    const s = STATUS_CFG[sig.statut] || { label: sig.statut, cls: 'bg-gray-500/10 text-gray-400' };
                    const isExp = expanded === sig.id;
                    const vendeur = sig.annonce?.user;

                    return (
                        <div key={sig.id} className="bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden">
                            {/* Résumé cliquable */}
                            <button
                                onClick={() => setExpanded(isExp ? null : sig.id)}
                                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/3 transition text-left"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                                        <span className="text-xs text-slate-500">
                                            {new Date(sig.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-white">
                                        Annonce : <span className="text-slate-300">{sig.annonce?.titre || '—'}</span>
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Par <span className="text-slate-400">{sig.signaleur?.nom}</span>
                                        {vendeur && <> · Vendeur : <span className="text-slate-400">{vendeur.nom}</span></>}
                                    </p>
                                </div>
                                <ChevronRight className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${isExp ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Détail expansé */}
                            {isExp && (
                                <div className="border-t border-white/5 px-5 py-5 space-y-5">

                                    {/* Motif */}
                                    <div className="bg-white/5 rounded-xl px-4 py-3">
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Info className="w-3 h-3" /> Motif du signalement</p>
                                        <p className="text-sm text-slate-200 italic">«{sig.motif || 'Non précisé'}»</p>
                                    </div>

                                    {/* Signaletique */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Signaleur */}
                                        <div className="bg-white/5 rounded-xl px-4 py-3">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Signaleur</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase flex-shrink-0">
                                                    {sig.signaleur?.nom?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{sig.signaleur?.nom || '—'}</p>
                                                    <p className="text-xs text-slate-500">{sig.signaleur?.email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Vendeur signalé */}
                                        {vendeur && (
                                            <div className="bg-white/5 rounded-xl px-4 py-3">
                                                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Vendeur signalé</p>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400 uppercase flex-shrink-0">
                                                            {vendeur.nom?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-sm font-semibold text-white">{vendeur.nom}</p>
                                                                {vendeur.statut === 'bloque' && (
                                                                    <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">Bloqué</span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-500">{vendeur.email}</p>
                                                        </div>
                                                    </div>
                                                    <Link to={`/admin/utilisateurs/${vendeur.id}`} className="p-1.5 text-slate-500 hover:text-[#4ade80] transition">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions (seulement si en_attente) */}
                                    {sig.statut === 'en_attente' && (
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">Action à prendre</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {ACTIONS.map(action => (
                                                    <button
                                                        key={action.value}
                                                        onClick={() => { setActionPanel({ sig, action }); setWarnNote(''); }}
                                                        className={`flex flex-col items-start gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold border border-white/5 transition ${action.cls}`}
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <action.icon className="w-3.5 h-3.5" />
                                                            {action.label}
                                                        </div>
                                                        <span className="text-[10px] opacity-70 font-normal leading-tight">{action.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {meta.last_page > 1 && (
                <div className="flex items-center justify-between bg-[#1e293b] rounded-2xl border border-white/5 px-5 py-3">
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

            {/* ── MODAL ACTION ── */}
            {actionPanel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1e293b] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
                        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <actionPanel.action.icon className="w-4 h-4" />
                                {actionPanel.action.label}
                            </h3>
                            <button onClick={() => { setActionPanel(null); setActionMsg(''); }}
                                className="text-slate-500 hover:text-white transition"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-white/5 rounded-xl px-4 py-3">
                                <p className="text-xs text-slate-400 mb-0.5">Annonce concernée</p>
                                <p className="text-sm text-white font-semibold">{actionPanel.sig.annonce?.titre}</p>
                                <p className="text-xs text-slate-500">Vendeur : {actionPanel.sig.annonce?.user?.nom}</p>
                            </div>

                            {actionPanel.action.value === 'warn_user' && (
                                <div>
                                    <label className="text-xs text-slate-400 mb-2 block font-semibold">Message d'avertissement (optionnel)</label>
                                    <textarea
                                        value={warnNote}
                                        onChange={e => setWarnNote(e.target.value)}
                                        rows={3}
                                        placeholder="Personnalisez le message envoyé à l'utilisateur..."
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#4ade80]/50 transition resize-none"
                                    />
                                </div>
                            )}

                            {actionMsg && (
                                <div className={`px-4 py-2.5 rounded-xl text-sm ${actionMsg.startsWith('✅') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {actionMsg}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => { setActionPanel(null); setActionMsg(''); }}
                                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 font-semibold rounded-xl text-sm transition">
                                    Annuler
                                </button>
                                <button onClick={handleAction} disabled={acting}
                                    className={`flex-1 px-4 py-2.5 font-bold rounded-xl text-sm transition disabled:opacity-50 ${actionPanel.action.cls.replace('hover:', '')}`}
                                >
                                    {acting ? 'En cours...' : 'Confirmer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

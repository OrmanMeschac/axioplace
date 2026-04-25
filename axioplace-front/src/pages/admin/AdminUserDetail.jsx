import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield, Ban, Trash2, FileText, AlertTriangle } from 'lucide-react';
import api from '../../lib/axios';

const STATUS_LABELS = {
    validee:   { label: 'Validée',    cls: 'bg-green-500/10 text-green-400' },
    suspendue: { label: 'Suspendue',  cls: 'bg-red-500/10 text-red-400' },
    en_attente:{ label: 'En attente', cls: 'bg-yellow-500/10 text-yellow-400' },
};

export default function AdminUserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = () => {
        api.get(`/admin/users/${id}`)
            .then(r => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, [id]);

    const update = async (payload) => {
        try { await api.put(`/admin/users/${id}`, payload); fetchData(); }
        catch (e) { console.error(e); }
    };

    const handleDelete = async () => {
        if (!confirm(`Supprimer « ${data.user.nom} » définitivement ?`)) return;
        try { await api.delete(`/admin/users/${id}`); navigate('/admin/utilisateurs'); }
        catch (e) { alert(e.response?.data?.message || 'Erreur'); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-white/10 border-t-[#4ade80] rounded-full animate-spin" /></div>;
    if (!data) return <p className="text-slate-400">Utilisateur non trouvé.</p>;

    const { user, annonces, signalements } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/admin/utilisateurs" className="flex items-center gap-1 text-slate-400 hover:text-white transition text-sm">
                    <ChevronLeft className="w-4 h-4" /> Retour
                </Link>
            </div>

            {/* User card */}
            <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-16 h-16 rounded-2xl bg-[#4ade80]/10 flex items-center justify-center text-3xl font-extrabold text-[#4ade80] uppercase flex-shrink-0">
                        {user.nom?.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                            <h1 className="text-xl font-extrabold text-white">{user.nom}</h1>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-[#4ade80]/10 text-[#4ade80]' : 'bg-white/5 text-slate-400'}`}>
                                {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user.statut === 'bloque' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                {user.statut === 'bloque' ? 'Bloqué' : 'Actif'}
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm">{user.email}</p>
                        <p className="text-slate-400 text-sm">{user.telephone || 'Aucun téléphone'}</p>
                        <p className="text-slate-500 text-xs mt-2">
                            Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {' · '}{user.annonces_count} annonce(s)
                        </p>
                    </div>
                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => update({ role: user.role === 'admin' ? 'user' : 'admin' })}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4ade80]/10 hover:bg-[#4ade80]/20 text-[#4ade80] text-sm font-semibold transition">
                            <Shield className="w-4 h-4" />
                            {user.role === 'admin' ? 'Rétrograder' : 'Promouvoir Admin'}
                        </button>
                        <button onClick={() => update({ statut: user.statut === 'bloque' ? 'actif' : 'bloque' })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${user.statut === 'bloque' ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'}`}>
                            <Ban className="w-4 h-4" />
                            {user.statut === 'bloque' ? 'Débloquer' : 'Bloquer le compte'}
                        </button>
                        <button onClick={handleDelete} disabled={user.role === 'admin'}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition">
                            <Trash2 className="w-4 h-4" /> Supprimer
                        </button>
                    </div>
                </div>
            </div>

            {/* Annonces */}
            <div className="bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-5 border-b border-white/5 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#4ade80]" />
                    <h2 className="font-bold text-white">Ses annonces ({annonces.length})</h2>
                </div>
                {annonces.length === 0 ? (
                    <p className="text-slate-500 text-sm p-5">Aucune annonce.</p>
                ) : (
                    <div className="divide-y divide-white/5">
                        {annonces.map(a => {
                            const s = STATUS_LABELS[a.statut] || { label: a.statut, cls: 'bg-gray-500/10 text-gray-400' };
                            return (
                                <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-white truncate">{a.titre}</p>
                                        <p className="text-xs text-slate-500">{a.categorie?.nom} · {a.ville?.nom} · {Number(a.prix).toLocaleString('fr-FR')} FCFA</p>
                                    </div>
                                    <span className={`ml-3 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${s.cls}`}>{s.label}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Signalements reçus */}
            <div className="bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-5 border-b border-white/5 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <h2 className="font-bold text-white">Signalements reçus ({signalements.length})</h2>
                </div>
                {signalements.length === 0 ? (
                    <p className="text-slate-500 text-sm p-5">Aucun signalement.</p>
                ) : (
                    <div className="divide-y divide-white/5">
                        {signalements.map(s => (
                            <div key={s.id} className="px-5 py-3.5">
                                <p className="text-sm text-white truncate">{s.annonce?.titre}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{s.motif}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

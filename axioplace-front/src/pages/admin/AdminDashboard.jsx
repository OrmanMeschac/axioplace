import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Users, FileText, AlertTriangle, TrendingUp,
    Shield, Bell, UserX, BarChart3
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../lib/axios';

const STATUS_LABELS = {
    validee:    { label: 'Validée',    cls: 'bg-green-500/10 text-green-400' },
    suspendue:  { label: 'Suspendue', cls: 'bg-red-500/10 text-red-400' },
    en_attente: { label: 'En attente', cls: 'bg-yellow-500/10 text-yellow-400' },
};

const PIE_COLORS = ['#4ade80', '#ffcb30', '#60a5fa', '#f87171', '#c084fc', '#fb923c'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
            <p className="text-slate-400">{label}</p>
            <p className="text-[#4ade80] font-bold">{payload[0].value}</p>
        </div>
    );
};

function StatCard({ label, value, icon: Icon, color, sub, to }) {
    const content = (
        <div className={`bg-[#1e293b] rounded-2xl p-6 border border-white/5 transition ${to ? 'hover:border-[#4ade80]/20 hover:bg-[#1e293b]/80 cursor-pointer' : ''}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-white mb-1">{value ?? '—'}</p>
            <p className="text-sm text-slate-400">{label}</p>
            {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
    );
    return to ? <Link to={to}>{content}</Link> : content;
}

export default function AdminDashboard() {
    const [stats, setStats]     = useState(null);
    const [loading, setLoading] = useState(true);
    const pollRef = useRef(null);

    const loadStats = () => {
        api.get('/admin/stats')
            .then(r => { setStats(r.data); setLoading(false); })
            .catch(console.error);
    };

    useEffect(() => {
        loadStats();
        pollRef.current = setInterval(loadStats, 15000); // Polling 15s
        return () => clearInterval(pollRef.current);
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-white/10 border-t-[#4ade80] rounded-full animate-spin" />
        </div>
    );

    // Graphique activité 7j
    const activityData = (() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(); date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            const label = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
            const users = stats?.new_users?.find(d => d.date === key)?.total ?? 0;
            const annonces = stats?.new_annonces?.find(d => d.date === key)?.total ?? 0;
            days.push({ label, users, annonces });
        }
        return days;
    })();

    // Graphique catégories
    const catData = (stats?.category_stats ?? []).map(c => ({ name: c.nom, value: c.total }));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-white">Dashboard</h1>
                    <p className="text-slate-400 text-sm mt-1">Vue d'ensemble — actualisation toutes les 15s</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/5 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
                    Live
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    label="Utilisateurs inscrits"
                    value={stats?.total_users?.toLocaleString()}
                    icon={Users} color="bg-blue-500/10 text-blue-400"
                    sub={`${stats?.users_bloques ?? 0} bloqué(s)`}
                    to="/admin/utilisateurs"
                />
                <StatCard
                    label="Annonces publiées"
                    value={stats?.total_annonces?.toLocaleString()}
                    icon={FileText} color="bg-[#4ade80]/10 text-[#4ade80]"
                    sub={`${stats?.annonces_actives ?? 0} actives`}
                    to="/admin/annonces"
                />
                <StatCard
                    label="Signalements en attente"
                    value={stats?.signal_pending?.toLocaleString()}
                    icon={AlertTriangle} color="bg-orange-500/10 text-orange-400"
                    to="/admin/signalements"
                />
                <StatCard
                    label="Comptes suspects"
                    value={stats?.suspects_count?.toLocaleString() ?? 0}
                    icon={UserX} color="bg-red-500/10 text-red-400"
                    sub="Détectés automatiquement"
                    to="/admin/suspects"
                />
            </div>

            {/* Graphique activité + catégories */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Activité 7 jours */}
                <div className="xl:col-span-2 bg-[#1e293b] rounded-2xl border border-white/5 p-6">
                    <h2 className="font-bold text-white mb-1">Activité des 7 derniers jours</h2>
                    <p className="text-xs text-slate-500 mb-6">Inscriptions vs nouvelles annonces</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={activityData} barGap={4}>
                            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                            <Bar dataKey="users"    fill="#60a5fa" radius={[4,4,0,0]} name="Inscriptions" />
                            <Bar dataKey="annonces" fill="#4ade80" radius={[4,4,0,0]} name="Annonces" />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#60a5fa]" /><span className="text-xs text-slate-400">Inscriptions</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#4ade80]" /><span className="text-xs text-slate-400">Annonces</span></div>
                    </div>
                </div>

                {/* Répartition catégories */}
                <div className="bg-[#1e293b] rounded-2xl border border-white/5 p-6">
                    <h2 className="font-bold text-white mb-1">Top catégories</h2>
                    <p className="text-xs text-slate-500 mb-4">Par nombre d'annonces</p>
                    {catData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                                    {catData.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-40 text-slate-600 text-sm">Aucune donnée</div>
                    )}
                </div>
            </div>

            {/* Mini-widgets + derniers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#1e293b] rounded-2xl border border-white/5 p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#4ade80]/10 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-[#4ade80]" />
                    </div>
                    <div>
                        <p className="text-2xl font-extrabold text-white">{stats?.new_annonces?.reduce((a, d) => a + d.total, 0) ?? 0}</p>
                        <p className="text-sm text-slate-400">Annonces cette semaine</p>
                    </div>
                </div>
                <div className="bg-[#1e293b] rounded-2xl border border-white/5 p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-extrabold text-white">{stats?.notif_week ?? 0}</p>
                        <p className="text-sm text-slate-400">Notifications envoyées (7j)</p>
                    </div>
                </div>
                <Link to="/admin/suspects" className="bg-[#1e293b] rounded-2xl border border-white/5 p-5 flex items-center gap-4 hover:border-red-500/20 transition group">
                    <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-extrabold text-white group-hover:text-red-400 transition">{stats?.suspects_count ?? 0}</p>
                        <p className="text-sm text-slate-400">Suspects détectés → Voir</p>
                    </div>
                </Link>
            </div>

            {/* Tables derniers inscrits / annonces */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <div className="bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                        <h2 className="font-bold text-white">Derniers inscrits</h2>
                        <Link to="/admin/utilisateurs" className="text-xs text-[#4ade80] hover:underline">Voir tous →</Link>
                    </div>
                    <div className="divide-y divide-white/5">
                        {stats?.latest_users?.map(u => (
                            <Link key={u.id} to={`/admin/utilisateurs/${u.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#4ade80]/10 flex items-center justify-center text-[#4ade80] font-bold text-sm uppercase">{u.nom?.charAt(0)}</div>
                                    <div>
                                        <p className="text-sm font-medium text-white group-hover:text-[#4ade80] transition">{u.nom}</p>
                                        <p className="text-xs text-slate-500">{u.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {u.role === 'admin' && <span className="text-[10px] bg-[#4ade80]/10 text-[#4ade80] px-2 py-0.5 rounded-full font-bold">Admin</span>}
                                    {u.statut === 'bloque' && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold">Bloqué</span>}
                                    <span className="text-xs text-slate-500">{u.annonces_count} ann.</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                        <h2 className="font-bold text-white">Dernières annonces</h2>
                        <Link to="/admin/annonces" className="text-xs text-[#4ade80] hover:underline">Voir toutes →</Link>
                    </div>
                    <div className="divide-y divide-white/5">
                        {stats?.latest_annonces?.map(a => {
                            const s = STATUS_LABELS[a.statut] || { label: a.statut, cls: 'bg-gray-500/10 text-gray-400' };
                            return (
                                <div key={a.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-white truncate">{a.titre}</p>
                                        <p className="text-xs text-slate-500">{a.user?.nom} · {a.categorie?.nom}</p>
                                    </div>
                                    <span className={`ml-3 flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

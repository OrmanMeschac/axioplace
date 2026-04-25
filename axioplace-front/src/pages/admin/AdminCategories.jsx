import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../lib/axios';

function Section({ title, items, onAdd, onDelete, addPlaceholder, addLabel }) {
    const [val, setVal] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!val.trim()) return;
        setErr(''); setLoading(true);
        try { await onAdd(val.trim()); setVal(''); }
        catch (e) { setErr(e.response?.data?.message || 'Erreur.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/5">
                <h2 className="font-bold text-white text-lg">{title}</h2>
                <p className="text-slate-500 text-sm">{items.length} élément(s)</p>
            </div>

            {/* Add form */}
            <div className="p-5 border-b border-white/5">
                {err && <p className="text-red-400 text-xs mb-3 bg-red-500/10 px-3 py-2 rounded-lg">{err}</p>}
                <form onSubmit={handleAdd} className="flex gap-2">
                    <input value={val} onChange={e => setVal(e.target.value)} placeholder={addPlaceholder}
                        className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-[#4ade80]"
                    />
                    <button type="submit" disabled={loading || !val.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-[#4ade80] hover:bg-[#22c55e] text-[#0f172a] font-bold rounded-xl text-sm transition disabled:opacity-50">
                        <Plus className="w-4 h-4" /> {addLabel}
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                {items.length === 0 ? (
                    <p className="text-slate-500 text-sm p-5">Aucun élément.</p>
                ) : items.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition">
                        <div>
                            <p className="text-sm font-medium text-white">{item.nom}</p>
                            <p className="text-xs text-slate-500">{item.annonces_count ?? 0} annonce(s)</p>
                        </div>
                        <button onClick={() => onDelete(item.id, item.nom)}
                            disabled={(item.annonces_count ?? 0) > 0}
                            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={(item.annonces_count ?? 0) > 0 ? 'Impossible (annonces liées)' : 'Supprimer'}>
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [villes, setVilles]         = useState([]);

    const fetchAll = () => {
        api.get('/admin/categories').then(r => setCategories(r.data)).catch(console.error);
        api.get('/admin/villes').then(r => setVilles(r.data)).catch(console.error);
    };

    useEffect(() => { fetchAll(); }, []);

    const addCat = async (nom) => {
        await api.post('/admin/categories', { nom });
        fetchAll();
    };
    const deleteCat = async (id, nom) => {
        if (!confirm(`Supprimer la catégorie « ${nom} » ?`)) return;
        await api.delete(`/admin/categories/${id}`);
        fetchAll();
    };
    const addVille = async (nom) => {
        await api.post('/admin/villes', { nom });
        fetchAll();
    };
    const deleteVille = async (id, nom) => {
        if (!confirm(`Supprimer la ville « ${nom} » ?`)) return;
        await api.delete(`/admin/villes/${id}`);
        fetchAll();
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-white">Catégories & Villes</h1>
                <p className="text-slate-400 text-sm mt-1">Gérez les catégories et les villes de la plateforme</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Section
                    title="Catégories"
                    items={categories}
                    onAdd={addCat}
                    onDelete={deleteCat}
                    addPlaceholder="Nom de la catégorie..."
                    addLabel="Ajouter"
                />
                <Section
                    title="Villes"
                    items={villes}
                    onAdd={addVille}
                    onDelete={deleteVille}
                    addPlaceholder="Nom de la ville..."
                    addLabel="Ajouter"
                />
            </div>
        </div>
    );
}

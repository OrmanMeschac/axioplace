import { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, User, Menu, X, Heart, ChevronDown, LogOut, LayoutList, PlusCircle, Home, Tag, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import echo from '../lib/echo';
import api from '../lib/axios';

function NavLink({ to, children, className = '' }) {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
    return (
        <Link
            to={to}
            className={`relative text-sm font-semibold transition-colors duration-200 py-1 group ${
                isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
            } ${className}`}
        >
            {children}
            <span className={`absolute -bottom-1 left-0 w-full h-0.5 rounded-full bg-axio-jaune transition-all duration-300 ${
                isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
            }`} />
        </Link>
    );
}

function UserDropdown({ user, logout }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => { setOpen(false); await logout(); navigate('/'); };
    const initiale = user?.nom?.charAt(0)?.toUpperCase() || 'U';

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition shadow-sm"
                id="user-menu-btn"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-axio-jaune to-orange-400 flex items-center justify-center text-white font-bold text-sm">
                    {user?.photo_profil
                        ? <img src={import.meta.env.VITE_API_URL + '/storage/' + user.photo_profil} alt="" className="w-full h-full object-cover rounded-full" />
                        : initiale}
                </div>
                <span className="text-sm font-semibold text-gray-700 max-w-[90px] truncate hidden sm:block">{user?.nom?.split(' ')[0]}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-slide-down z-50">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-xs text-gray-500">Connecté en tant que</p>
                        <p className="font-semibold text-gray-900 text-sm truncate">{user?.nom}</p>
                    </div>
                    <div className="py-1">
                        {user?.role === 'admin' && (
                            <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-axio-vert hover:bg-green-50 transition font-bold bg-green-50/50">
                                <Shield className="w-4 h-4 text-axio-vert" /> Tableau de bord Admin
                            </Link>
                        )}
                        <Link to="/profil" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                            <User className="w-4 h-4 text-gray-400" /> Mon profil
                        </Link>
                        <Link to="/mes-annonces" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                            <LayoutList className="w-4 h-4 text-gray-400" /> Mes annonces
                        </Link>
                        <Link to="/favoris" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                            <Heart className="w-4 h-4 text-gray-400" /> Mes favoris
                        </Link>
                    </div>
                    <div className="border-t border-gray-100 py-1">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                            <LogOut className="w-4 h-4" /> Déconnexion
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function MobileMenu({ open, onClose, isAuthenticated, user, logout }) {
    const navigate = useNavigate();
    const handleLogout = async () => { onClose(); await logout(); navigate('/'); };
    return (
        <>
            <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            <div className={`fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <span className="font-bold text-lg text-gray-900">Menu</span>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition"><X className="w-5 h-5" /></button>
                </div>
                <nav className="flex flex-col p-4 gap-1">
                    {[
                        { to: '/', label: 'Accueil', Icon: Home },
                        { to: '/annonces', label: 'Annonces', Icon: Tag },
                        { to: '/favoris', label: 'Favoris', Icon: Heart },
                        { to: '/notifications', label: 'Notifications', Icon: Bell },
                    ].map(({ to, label, Icon }) => (
                        <Link key={to} to={to} onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition">
                            <Icon className="w-5 h-5 text-gray-400" /> {label}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-100 space-y-3 mt-auto absolute bottom-0 left-0 right-0">
                    {isAuthenticated ? (
                        <>
                            {user?.role === 'admin' && (
                                <Link to="/admin" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl text-axio-vert bg-green-50/50 hover:bg-green-50 font-bold transition">
                                    <Shield className="w-5 h-5 text-axio-vert" /> Espace Admin
                                </Link>
                            )}
                            <Link to="/profil" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition">
                                <User className="w-5 h-5 text-gray-400" /> Mon profil
                            </Link>
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-medium transition">
                                <LogOut className="w-5 h-5" /> Déconnexion
                            </button>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <Link to="/login" onClick={onClose} className="btn-secondary w-full">Se connecter</Link>
                            <Link to="/register" onClick={onClose} className="btn-primary w-full">S'inscrire</Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function AppLayout() {
    const { isAuthenticated, user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [favorisCount, setFavorisCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isRinging, setIsRinging] = useState(false);
    const location = useLocation();
    // Ref pour le polling de notifications — garde la valeur précédente du compteur non-lu
    const prevUnreadRef = useRef(0);
    const ringTimerRef  = useRef(null);

    usePushNotifications(isAuthenticated);

    // ── Favoris ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isAuthenticated) {
            api.get('/favoris').then(res => setFavorisCount(Array.isArray(res.data) ? res.data.length : 0)).catch(() => {});
        } else { setFavorisCount(0); setUnreadCount(0); }
    }, [isAuthenticated, location.pathname]);

    // ── Cloche : détection en temps réel (WebSocket + polling fallback) ──────────
    const triggerRing = useCallback(() => {
        setIsRinging(true);
        clearTimeout(ringTimerRef.current);
        ringTimerRef.current = setTimeout(() => setIsRinging(false), 3500);
    }, []);

    // Polling toutes les 5s — s'arrête automatiquement si on est sur /notifications
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const checkUnread = () => {
            if (location.pathname.includes('/notifications')) return;
            api.get('/conversations')
                .then(res => {
                    const count = (res.data || []).filter(
                        c => !c.lu && String(c.destinataire_id) === String(user.id)
                    ).length;
                    setUnreadCount(count);
                    // Déclencher la cloche uniquement si le compteur a augmenté
                    if (count > prevUnreadRef.current) {
                        triggerRing();
                    }
                    prevUnreadRef.current = count;
                })
                .catch(() => {});
        };

        // Premier appel immédiat
        checkUnread();
        const pollId = setInterval(checkUnread, 5000);
        return () => clearInterval(pollId);
    }, [isAuthenticated, user?.id, location.pathname, triggerRing]); // eslint-disable-line

    // WebSocket (Reverb) — déclenche la cloche en plus du polling
    useEffect(() => {
        if (!isAuthenticated || !user) return;
        const channel = echo.private(`chat.${user.id}`);
        channel.listen('.MessageSent', (incoming) => {
            const msg = incoming.message;
            if (!msg) return;
            if (
                String(msg.destinataire_id) === String(user.id) &&
                !location.pathname.includes('/notifications')
            ) {
                setUnreadCount(prev => {
                    const next = prev + 1;
                    prevUnreadRef.current = next; // Sync pour éviter doublon polling
                    return next;
                });
                triggerRing();
            }
        });
        return () => { channel.stopListening('.MessageSent'); echo.leave(`chat.${user.id}`); };
    }, [isAuthenticated, user?.id, triggerRing]); // eslint-disable-line

    useEffect(() => {
        if (location.pathname.includes('/notifications') || location.pathname.includes('/messages')) {
            setUnreadCount(0);
            prevUnreadRef.current = 0;
        }
    }, [location.pathname]);

    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    const SOCIAL = [
        { label: 'Facebook',  icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
        { label: 'Instagram', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
        { label: 'LinkedIn',  icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
        { label: 'X',         icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    ];

    return (
        <div className="min-h-screen flex flex-col font-inter bg-[#f6f7f9]">

            {/* ── NAVBAR ── */}
            <header className="bg-white/95 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100 shadow-sm">
                <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-4">
                    <Link to="/" className="flex items-center gap-2.5 flex-shrink-0" id="nav-logo">
                        <div className="w-9 h-9 bg-gradient-to-br from-axio-jaune to-orange-400 rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-white font-black text-lg leading-none">A</span>
                        </div>
                        <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                            Axio<span className="text-axio-jaune">place</span>
                        </span>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-8">
                        <NavLink to="/">Accueil</NavLink>
                        <NavLink to="/annonces">Annonces</NavLink>
                        {isAuthenticated && (
                            <NavLink to="/favoris">
                                <span className="flex items-center gap-1.5">
                                    Favoris
                                    {favorisCount > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">{favorisCount}</span>
                                    )}
                                </span>
                            </NavLink>
                        )}
                        <NavLink to="/notifications">Notifications</NavLink>
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link to="/notifications"
                            className={`hidden sm:flex w-9 h-9 items-center justify-center rounded-xl border transition relative ${isRinging ? 'border-red-400 bg-red-50 text-red-500 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            id="nav-notifications"
                        >
                            <Bell className={`w-4 h-4 ${isRinging ? 'animate-bounce' : ''}`} />
                            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse" />}
                        </Link>
                        <Link to="/publier" id="nav-publish-btn" className="hidden md:flex btn-primary py-2 px-4 text-sm rounded-xl gap-1.5">
                            <PlusCircle className="w-4 h-4" /> Publier
                        </Link>
                        {isAuthenticated ? (
                            <UserDropdown user={user} logout={logout} />
                        ) : (
                            <div className="hidden md:flex items-center gap-2">
                                <Link to="/login" className="btn-secondary py-2 px-4 text-sm rounded-xl">Connexion</Link>
                                <Link to="/register" className="btn-primary py-2 px-4 text-sm rounded-xl">Inscription</Link>
                            </div>
                        )}
                        <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition" id="nav-mobile-menu">
                            <Menu className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
            </header>

            <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} isAuthenticated={isAuthenticated} user={user} logout={logout} />

            <main className="flex-1 flex flex-col"><Outlet /></main>

            {/* ── FOOTER ── */}
            <footer className="mt-auto">
                {/* Bandeau coloré supérieur */}
                <div className="h-1 w-full bg-gradient-to-r from-axio-jaune via-orange-300 to-axio-vert" />
                <div className="bg-white border-t-0">
                <div className="container mx-auto max-w-7xl px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">

                        {/* Brand */}
                        <div className="space-y-4">
                            <Link to="/" className="flex items-center gap-2.5">
                                <div className="w-9 h-9 bg-gradient-to-br from-axio-jaune to-orange-400 rounded-xl flex items-center justify-center shadow-sm">
                                    <span className="text-white font-black text-lg leading-none">A</span>
                                </div>
                                <span className="text-xl font-extrabold text-gray-900 tracking-tight">Axio<span className="text-axio-jaune">place</span></span>
                            </Link>
                            <p className="text-sm text-gray-500 leading-relaxed">La marketplace moderne et de confiance adaptée au marché africain.</p>


                        </div>

                        {/* Navigation */}
                        <div>
                            <h4 className="font-bold text-axio-vert mb-4 text-sm uppercase tracking-wider">Navigation</h4>
                            <ul className="space-y-2.5 text-sm text-gray-500">
                                {[
                                    { label: 'Accueil',       to: '/' },
                                    { label: 'Annonces',      to: '/annonces' },
                                    { label: 'Mes favoris',   to: '/favoris' },
                                    { label: 'Publier',       to: '/publier' },
                                    { label: 'Notifications', to: '/notifications' },
                                ].map(({ label, to }) => (
                                    <li key={label}><Link to={to} className="hover:text-axio-vert transition-colors">{label}</Link></li>
                                ))}
                            </ul>
                        </div>

                        {/* Informations */}
                        <div>
                            <h4 className="font-bold text-axio-vert mb-4 text-sm uppercase tracking-wider">Informations</h4>
                            <ul className="space-y-2.5 text-sm text-gray-500">
                                {[
                                    { label: 'À propos',                 to: '/a-propos' },
                                    { label: 'Contact',                   to: '/contact' },
                                    { label: "Conditions d'utilisation",  to: '/cgu' },
                                    { label: 'Confidentialité',           to: '/politique-confidentialite' },
                                ].map(({ label, to }) => (
                                    <li key={label}><Link to={to} className="hover:text-axio-vert transition-colors">{label}</Link></li>
                                ))}
                            </ul>
                        </div>

                        {/* App Store + Réseaux */}
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-axio-vert mb-4 text-sm uppercase tracking-wider">Télécharger l'app</h4>
                                <div className="space-y-2.5">
                                    {/* Badge Google Play officiel */}
                                    <a href="#" id="footer-play-store" aria-label="Disponible sur Google Play"
                                        className="flex items-center gap-3 bg-[#1a1a1a] hover:bg-black rounded-xl px-4 py-2.5 transition-all duration-200 group w-fit">
                                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                                            <path d="M3.18 23.76a2.1 2.1 0 0 1-1.18-1.9V2.14A2.1 2.1 0 0 1 3.18.24l12.09 11.76-12.09 11.76Z" fill="#EA4335"/>
                                            <path d="M19.64 15.6 16.1 12l3.54-3.6 3.28 1.9a2.1 2.1 0 0 1 0 3.4L19.64 15.6Z" fill="#FBBC04"/>
                                            <path d="M3.18 23.76 16.1 12 19.64 15.6 5.16 24.36a2.08 2.08 0 0 1-1.98-.6Z" fill="#34A853"/>
                                            <path d="M3.18.24A2.08 2.08 0 0 1 5.16-.6L19.64 8.4 16.1 12 3.18.24Z" fill="#4285F4"/>
                                        </svg>
                                        <div>
                                            <p className="text-[9px] text-gray-400 leading-none">DISPONIBLE SUR</p>
                                            <p className="text-sm font-bold text-white leading-tight">Google Play</p>
                                        </div>
                                    </a>
                                    {/* Badge App Store officiel */}
                                    <a href="#" id="footer-app-store" aria-label="Disponible sur l'App Store"
                                        className="flex items-center gap-3 bg-[#1a1a1a] hover:bg-black rounded-xl px-4 py-2.5 transition-all duration-200 group w-fit">
                                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="white">
                                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                        </svg>
                                        <div>
                                            <p className="text-[9px] text-gray-400 leading-none">DISPONIBLE SUR</p>
                                            <p className="text-sm font-bold text-white leading-tight">App Store</p>
                                        </div>
                                    </a>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-axio-vert mb-3 text-sm uppercase tracking-wider">Suivez-nous</h4>
                                <div className="flex flex-wrap gap-2">
                                    {SOCIAL.map(({ label, icon }) => (
                                        <a key={label} href="#" id={`footer-social-${label.toLowerCase()}`} aria-label={label}
                                            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-axio-jaune text-gray-500 hover:text-gray-900 flex items-center justify-center transition-all duration-200">
                                            {icon}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
                        <span>© {new Date().getFullYear()} <span className="font-bold text-axio-vert">Axioplace</span> — Tous droits réservés.</span>
                        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
                            <Link to="/cgu" className="hover:text-axio-vert transition-colors">CGU</Link>
                            <span className="text-gray-200">·</span>
                            <Link to="/politique-confidentialite" className="hover:text-axio-vert transition-colors">Confidentialité</Link>
                            <span className="text-gray-200">·</span>
                            <Link to="/contact" className="hover:text-axio-vert transition-colors">Contact</Link>
                            <span className="text-gray-200">·</span>
                            <span>Made with <span className="text-red-400">♥</span> en République du Congo</span>
                        </div>
                    </div>
                </div>
                </div>
            </footer>
        </div>
    );
}

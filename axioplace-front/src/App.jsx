import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home          from './pages/Home';
import Login         from './pages/Login';
import Register      from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';
import PublishAnnonce from './pages/PublishAnnonce';
import Annonces      from './pages/Annonces';
import AnnonceDetails from './pages/AnnonceDetails';
import UserProfile   from './pages/UserProfile';
import Profil        from './pages/Profil';
import Favoris       from './pages/Favoris';
import Notifications  from './pages/Notifications';
import PolitiqueConfidentialite from './pages/PolitiqueConfidentialite';
import Contact       from './pages/Contact';
import CGU           from './pages/CGU';
import APropos       from './pages/APropos';

import AdminLayout      from './pages/admin/AdminLayout';
import AdminDashboard   from './pages/admin/AdminDashboard';
import AdminUsers       from './pages/admin/AdminUsers';
import AdminUserDetail  from './pages/admin/AdminUserDetail';
import AdminAnnonces    from './pages/admin/AdminAnnonces';
import AdminSignalements from './pages/admin/AdminSignalements';
import AdminCategories  from './pages/admin/AdminCategories';
import AdminSuspects    from './pages/admin/AdminSuspects';
import AdminBroadcast   from './pages/admin/AdminBroadcast';
import AdminMessages     from './pages/admin/AdminMessages';

export default function App() {
    return (
        // ⚠ Remplace VOTRE_GOOGLE_CLIENT_ID par ton vrai Client ID Google
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'VOTRE_GOOGLE_CLIENT_ID'}>
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<AppLayout />}>

                        {/* Pages publiques */}
                        <Route index           element={<Home />} />
                        <Route path="login"    element={<Login />} />
                        <Route path="register" element={<Register />} />
                        <Route path="mot-de-passe-oublie" element={<ForgotPassword />} />
                        <Route path="reinitialiser-mot-de-passe" element={<ResetPassword />} />
                        <Route path="annonces" element={<Annonces />} />
                        <Route path="annonces/:id" element={<AnnonceDetails />} />
                        <Route path="vendeur/:id" element={<UserProfile />} />
                        <Route path="politique-confidentialite" element={<PolitiqueConfidentialite />} />
                        <Route path="contact"   element={<Contact />} />
                        <Route path="cgu"        element={<CGU />} />
                        <Route path="a-propos"   element={<APropos />} />

                        {/* Pages protégées */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="publier"        element={<PublishAnnonce />} />
                            <Route path="modifier-annonce/:id" element={<PublishAnnonce />} />
                            <Route path="favoris"        element={<Favoris />} />
                            <Route path="profil"         element={<Profil />} />
                            <Route path="mes-annonces"   element={<Profil />} />
                            <Route path="notifications"  element={<Notifications />} />
                            <Route path="messages"       element={<Notifications />} />
                        </Route>

                        {/* Pages admin */}
                        <Route element={<ProtectedRoute requireAdmin={true} />}>
                            <Route element={<AdminLayout />}>
                                <Route path="admin"                    element={<AdminDashboard />} />
                                <Route path="admin/utilisateurs"       element={<AdminUsers />} />
                                <Route path="admin/utilisateurs/:id"   element={<AdminUserDetail />} />
                                <Route path="admin/annonces"           element={<AdminAnnonces />} />
                                <Route path="admin/signalements"       element={<AdminSignalements />} />
                                <Route path="admin/suspects"           element={<AdminSuspects />} />
                                <Route path="admin/communication"      element={<AdminBroadcast />} />
                                <Route path="admin/messages"           element={<AdminMessages />} />
                                <Route path="admin/categories"         element={<AdminCategories />} />
                            </Route>
                        </Route>

                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
        </GoogleOAuthProvider>
    );
}

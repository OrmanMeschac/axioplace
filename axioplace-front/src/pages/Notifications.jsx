import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, ChevronLeft, Calendar } from 'lucide-react';
import api from '../lib/axios';
import echo from '../lib/echo';
import { useAuth } from '../contexts/AuthContext';

export default function Notifications() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Construit l'URL de la photo de profil
    const getProfilePhotoUrl = (path) => {
        if (!path) return null;
        const clean = String(path).replace(/^\/?storage\//, '');
        return `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:8000'}/storage/${clean}`;
    };
    
    // Chat actif
    const [activeChat, setActiveChat] = useState(null);
    const activeChatRef = useRef(null); // Évite les stale closures dans le callback Echo
    const [messages, setMessages] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const pollingRef = useRef(null);

    // Synchroniser le ref avec le state activeChat
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    // Charger les conversations
    const fetchConversations = useCallback(() => {
        api.get('/conversations')
            .then(res => setConversations(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!user) return;

        fetchConversations();

        // ── WEBSOCKET (Reverb) ───────────────────────────────────────────
        const channel = echo.private(`chat.${user.id}`);

        channel.listen('.MessageSent', (incoming) => {
            const msg = incoming.message;
            if (!msg) return;

            const currentChat = activeChatRef.current;
            if (currentChat) {
                // Normaliser null/undefined pour la comparaison
                const sameAnnonce = (msg.annonce_id ?? null) === (currentChat.annonce_id ?? null);
                const sameConv =
                    String(msg.expediteur_id) === String(currentChat.interlocuteur_id) ||
                    String(msg.destinataire_id) === String(currentChat.interlocuteur_id);

                if (sameAnnonce && sameConv) {
                    setMessages(prev => {
                        // Éviter les doublons
                        if (prev.some(m => m.id === msg.id && !m.isOptimistic)) return prev;
                        // Remplacer le message optimiste correspondant
                        const idx = prev.findIndex(
                            m => m.isOptimistic &&
                                 m.contenu === msg.contenu &&
                                 String(m.expediteur_id) === String(msg.expediteur_id)
                        );
                        if (idx !== -1) {
                            const updated = [...prev];
                            updated[idx] = msg;
                            return updated;
                        }
                        return [...prev, msg];
                    });
                }
            }
            fetchConversations();
        });

        return () => {
            channel.stopListening('.MessageSent');
        };
    }, [user, fetchConversations]);

    // Scroll automatique vers le bas
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // ── Polling de sécurité (fallback si Reverb est hors-ligne) ─────────────
    // Rafraîchit la conversation active toutes les 4s — invisible si WebSocket fonctionne
    const fetchActiveMessages = useCallback(() => {
        const chat = activeChatRef.current;
        if (!chat) return;
        const annonceParam = chat.annonce_id ?? 'null';
        api.get(`/messages/${annonceParam}/${chat.interlocuteur_id}`)
            .then(res => {
                setMessages(prev => {
                    const incoming = res.data || [];
                    // Ne mettre à jour que si de nouveaux messages sont arrivés
                    const prevRealIds = prev.filter(m => !m.isOptimistic).map(m => m.id);
                    const newRealIds  = incoming.map(m => m.id);
                    if (JSON.stringify(prevRealIds) === JSON.stringify(newRealIds)) return prev;
                    // Fusionner : garder les optimistes + remplacer par les réels
                    return incoming;
                });
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        pollingRef.current = setInterval(() => {
            fetchActiveMessages();
        }, 4000);
        return () => clearInterval(pollingRef.current);
    }, [fetchActiveMessages]);

    const openChat = (conv) => {
        const interlocuteurId = conv.expediteur_id === user.id ? conv.destinataire_id : conv.expediteur_id;
        const interlocuteur = conv.expediteur_id === user.id ? conv.destinataire : conv.expediteur;
        
        const chat = {
            annonce_id: conv.annonce_id,
            annonce: conv.annonce,
            interlocuteur_id: interlocuteurId,
            interlocuteur: interlocuteur
        };

        setActiveChat(chat);
        activeChatRef.current = chat; // Sync immédiat du ref avant le fetch async
        setMessages([]);
        
        setChatLoading(true);
        api.get(`/messages/${conv.annonce_id}/${interlocuteurId}`)
            .then(res => {
                setMessages(res.data);
                fetchConversations(); // Marquer comme lu
            })
            .catch(console.error)
            .finally(() => {
                setChatLoading(false);
                // Focus sur l'input après chargement
                setTimeout(() => inputRef.current?.focus(), 100);
            });
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content || !activeChat) return;

        // === OPTIMISTIC UI ===
        // Affichage immédiat du message côté expéditeur
        const tempId = `temp_${Date.now()}`;
        const optimisticMsg = {
            id: tempId,
            expediteur_id: user.id,
            destinataire_id: activeChat.interlocuteur_id,
            annonce_id: activeChat.annonce_id,
            contenu: content,
            created_at: new Date().toISOString(),
            isOptimistic: true,
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');
        setSending(true);

        try {
            const res = await api.post('/messages', {
                destinataire_id: activeChat.interlocuteur_id,
                annonce_id: activeChat.annonce_id,
                contenu: content
            });
            
            // Remplacer le message optimiste par le message réel du serveur
            // Le canal WS (toOthers()) ne renverra pas ce message à l'expéditeur,
            // donc on remplace ici manuellement.
            setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
            fetchConversations();
        } catch (err) {
            console.error('Erreur envoi message:', err);
            // Retirer le message optimiste en cas d'échec
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#ffcb30] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-[#f6f7f9] min-h-[calc(100vh-64px)] py-6 lg:py-10">
            <div className="container mx-auto max-w-6xl px-4 h-[calc(100vh-120px)] lg:h-[80vh]">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 h-full flex overflow-hidden">
                    
                    {/* INBOX (Liste à gauche) */}
                    <div className={`w-full lg:w-1/3 flex-shrink-0 border-r border-gray-100 flex flex-col ${activeChat ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                                <MessageSquare className="w-6 h-6 text-axio-jaune" />
                                Messages
                            </h1>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {conversations.length === 0 ? (
                                <div className="text-center py-10">
                                    <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">Aucune conversation</p>
                                </div>
                            ) : (
                                conversations.map(conv => {
                                    const interlocuteur = conv.expediteur_id === user.id ? conv.destinataire : conv.expediteur;
                                    const isActive = activeChat && 
                                        activeChat.annonce_id === conv.annonce_id && 
                                        String(activeChat.interlocuteur_id) === String(interlocuteur?.id);
                                    // Non lu = destiné à moi et non lu
                                    const isUnread = !conv.lu && String(conv.destinataire_id) === String(user.id);

                                    return (
                                        <div
                                            key={conv.id}
                                            onClick={() => openChat(conv)}
                                            className={`p-4 rounded-2xl cursor-pointer transition flex items-start gap-4 ${
                                                isActive ? 'bg-axio-jaune/10 border-axio-jaune/30' : 'bg-white hover:bg-gray-50 border-transparent'
                                            } border`}
                                        >
                                            {/* Avatar : photo réelle ou lettre initiale */}
                                            {interlocuteur?.photo_profil ? (
                                                <img
                                                    src={getProfilePhotoUrl(interlocuteur.photo_profil)}
                                                    alt={interlocuteur.nom}
                                                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                                    onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                                                />
                                            ) : null}
                                            <div
                                                className="w-12 h-12 rounded-full bg-gradient-to-br from-axio-jaune to-orange-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 uppercase"
                                                style={{ display: interlocuteur?.photo_profil ? 'none' : 'flex' }}
                                            >
                                                {interlocuteur?.nom?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className={`text-sm truncate ${isUnread ? 'font-extrabold text-gray-900' : 'font-bold text-gray-700'}`}>
                                                        {interlocuteur?.nom || 'Utilisateur'}
                                                    </h4>
                                                    {isUnread && <span className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0 animate-pulse" />}
                                                </div>
                                                <p className="text-xs text-axio-vert font-semibold truncate my-0.5">{conv.annonce?.titre}</p>
                                                <p className={`text-xs truncate ${isUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                                    {String(conv.expediteur_id) === String(user.id) ? 'Vous: ' : ''}{conv.contenu}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* DISCUSSION (Interface à droite) */}
                    <div className={`flex-1 flex flex-col bg-gray-50/30 ${!activeChat ? 'hidden lg:flex' : 'flex'}`}>
                        {!activeChat ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <MessageSquare className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-600 mb-2">Sélectionnez une conversation</h3>
                                <p className="text-gray-400 text-sm max-w-sm">
                                    Choisissez une discussion dans le menu pour lire les messages et répondre.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Header Chat */}
                                <div className="px-6 py-4 bg-white border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setActiveChat(null)} className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-50 rounded-xl">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <div className="flex items-center gap-3">
                                            {/* Avatar : photo réelle */}
                                            {activeChat.interlocuteur?.photo_profil ? (
                                                <img
                                                    src={getProfilePhotoUrl(activeChat.interlocuteur.photo_profil)}
                                                    alt={activeChat.interlocuteur?.nom}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                    onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                                                />
                                            ) : null}
                                            <div
                                                className="w-10 h-10 rounded-full bg-[#ffcb30]/20 flex items-center justify-center text-[#b45309] font-bold uppercase"
                                                style={{ display: activeChat.interlocuteur?.photo_profil ? 'none' : 'flex' }}
                                            >
                                                {activeChat.interlocuteur?.nom?.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 leading-none">{activeChat.interlocuteur?.nom}</h3>
                                                <span className="text-xs text-gray-400">Membre Axioplace</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-2 rounded-xl text-xs flex items-center gap-2 max-w-xs">
                                        <div className="flex-1 min-w-0">
                                            <strong className="text-gray-700 block truncate">{activeChat.annonce?.titre}</strong>
                                            <span className="text-axio-vert font-extrabold">
                                                {activeChat.annonce?.prix ? Number(activeChat.annonce.prix).toLocaleString('fr-FR') + ' FCFA' : 'Sur demande'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Body Chat */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                                    {chatLoading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <span className="w-8 h-8 border-2 border-gray-200 border-t-axio-jaune rounded-full animate-spin" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-center mb-6">
                                                <span className="bg-gray-100 text-gray-500 text-[10px] uppercase font-bold py-1 px-3 rounded-full inline-flex items-center gap-1.5">
                                                    <Calendar className="w-3 h-3" /> Début de la discussion
                                                </span>
                                            </div>
                                            {messages.map((msg, i) => {
                                                const isMe = String(msg.expediteur_id) === String(user?.id);
                                                return (
                                                    <div 
                                                        key={msg.id || i} 
                                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${msg.isOptimistic ? 'opacity-70' : 'opacity-100'} transition-opacity`}
                                                    >
                                                        <div className={`max-w-[75%] px-5 py-3 text-sm rounded-2xl shadow-sm ${
                                                            isMe 
                                                                ? 'bg-axio-jaune text-gray-900 rounded-tr-sm' 
                                                                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                                                        }`}>
                                                            <p style={{ wordBreak: 'break-word' }}>{msg.contenu}</p>
                                                            <p className={`text-[10px] mt-1.5 font-medium text-right ${isMe ? 'text-gray-600/70' : 'text-gray-400'}`}>
                                                                {msg.isOptimistic ? '⏳' : new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>

                                {/* Input Chat */}
                                <div className="p-4 bg-white border-t border-gray-100">
                                    <form onSubmit={sendMessage} className="flex items-center gap-2">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Écrivez votre message..."
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-axio-jaune/50 transition"
                                            autoComplete="off"
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={!newMessage.trim() || sending}
                                            className="bg-axio-jaune text-gray-900 p-3.5 rounded-2xl hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
                                        >
                                            <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

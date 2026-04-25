import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, ChevronLeft, Calendar } from 'lucide-react';
import api from '../../lib/axios';
import echo from '../../lib/echo';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminMessages() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    const getProfilePhotoUrl = (path) => {
        if (!path) return null;
        const clean = String(path).replace(/^\/?storage\//, '');
        return `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:8000'}/storage/${clean}`;
    };
    
    const [activeChat, setActiveChat] = useState(null);
    const activeChatRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    const fetchConversations = useCallback(() => {
        api.get('/conversations')
            .then(res => setConversations(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!user) return;
        fetchConversations();

        const channel = echo.private(`chat.${user.id}`);
        channel.listen('.MessageSent', (incoming) => {
            const msg = incoming.message;
            if (!msg) return;

            const currentChat = activeChatRef.current;
            if (currentChat) {
                const sameAnnonce = String(msg.annonce_id) === String(currentChat.annonce_id);
                const isRelevant = sameAnnonce && (
                    String(msg.expediteur_id) === String(currentChat.interlocuteur_id) ||
                    String(msg.destinataire_id) === String(currentChat.interlocuteur_id)
                );

                if (isRelevant) {
                    setMessages(prev => {
                        if (prev.some(m => m.id === msg.id && !m.isOptimistic)) return prev;
                        const optimisticIndex = prev.findIndex(
                            m => m.isOptimistic && m.contenu === msg.contenu && String(m.expediteur_id) === String(msg.expediteur_id)
                        );
                        if (optimisticIndex !== -1) {
                            const updated = [...prev];
                            updated[optimisticIndex] = msg;
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

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

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
        activeChatRef.current = chat;
        setMessages([]);
        setChatLoading(true);
        
        const annonceIdParam = conv.annonce_id ? conv.annonce_id : 'null';

        api.get(`/messages/${annonceIdParam}/${interlocuteurId}`)
            .then(res => {
                setMessages(res.data);
                fetchConversations();
            })
            .catch(console.error)
            .finally(() => {
                setChatLoading(false);
                setTimeout(() => inputRef.current?.focus(), 100);
            });
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content || !activeChat) return;

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
            
            setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
            fetchConversations();
        } catch (err) {
            console.error('Erreur envoi message:', err);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="w-10 h-10 border-4 border-white/10 border-t-[#4ade80] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-white">Requêtes & Messages</h1>
                <p className="text-slate-400 text-sm mt-1">Gérez les échanges directs avec les utilisateurs d'Axioplace</p>
            </div>

            <div className="h-[calc(100vh-220px)] flex bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden text-white shadow-xl">
                
                {/* INBOX */}
                <div className={`w-full xl:w-1/3 flex-shrink-0 border-r border-white/5 flex flex-col ${activeChat ? 'hidden xl:flex' : 'flex'}`}>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {conversations.length === 0 ? (
                            <div className="text-center py-10 mt-10">
                                <MessageSquare className="w-10 h-10 text-white/20 mx-auto mb-3" />
                                <p className="text-slate-400 text-sm">Aucune requête en cours</p>
                            </div>
                        ) : (
                            conversations.map(conv => {
                                const interlocuteur = conv.expediteur_id === user.id ? conv.destinataire : conv.expediteur;
                                const isActive = activeChat && 
                                    String(activeChat.annonce_id) === String(conv.annonce_id) && 
                                    String(activeChat.interlocuteur_id) === String(interlocuteur?.id);
                                const isUnread = !conv.lu && String(conv.destinataire_id) === String(user.id);

                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => openChat(conv)}
                                        className={`p-4 rounded-xl cursor-pointer transition flex items-start gap-4 ${
                                            isActive ? 'bg-[#4ade80]/10 border-[#4ade80]/30' : 'bg-transparent hover:bg-white/5 border-transparent'
                                        } border`}
                                    >
                                        {interlocuteur?.photo_profil ? (
                                            <img
                                                src={getProfilePhotoUrl(interlocuteur.photo_profil)}
                                                alt={interlocuteur.nom}
                                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                                onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                                            />
                                        ) : (
                                            <div
                                                className="w-10 h-10 rounded-full bg-[#4ade80]/20 flex items-center justify-center text-[#4ade80] font-bold text-sm flex-shrink-0 uppercase"
                                            >
                                                {interlocuteur?.nom?.charAt(0) || 'U'}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className={`text-sm truncate ${isUnread ? 'font-extrabold text-white' : 'font-medium text-slate-300'}`}>
                                                    {interlocuteur?.nom || 'Utilisateur'}
                                                </h4>
                                                {isUnread && <span className="w-2.5 h-2.5 bg-[#4ade80] rounded-full flex-shrink-0 animate-pulse" />}
                                            </div>
                                            {conv.annonce ? (
                                                <p className="text-xs text-[#4ade80] font-semibold truncate my-0.5">{conv.annonce.titre}</p>
                                            ) : (
                                                <p className="text-[10px] uppercase font-bold text-slate-400 my-0.5 tracking-wider">Communication Système</p>
                                            )}
                                            <p className={`text-xs truncate ${isUnread ? 'text-slate-300 font-medium' : 'text-slate-500'}`}>
                                                {String(conv.expediteur_id) === String(user.id) ? 'Vous: ' : ''}{conv.contenu}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* DISCUSSION */}
                <div className={`flex-1 flex flex-col bg-[#0f172a]/30 ${!activeChat ? 'hidden xl:flex' : 'flex'}`}>
                    {!activeChat ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#0f172a]/10">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                                <MessageSquare className="w-8 h-8 text-slate-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-300 mb-2">Sélectionnez une requête</h3>
                            <p className="text-slate-500 text-sm max-w-sm">
                                Choisissez une conversation dans le panneau de gauche pour répondre à l'utilisateur.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setActiveChat(null)} className="xl:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-xl">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div className="flex items-center gap-3">
                                        {activeChat.interlocuteur?.photo_profil ? (
                                            <img
                                                src={getProfilePhotoUrl(activeChat.interlocuteur.photo_profil)}
                                                alt={activeChat.interlocuteur?.nom}
                                                className="w-9 h-9 rounded-full object-cover"
                                                onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-[#4ade80]/20 flex items-center justify-center text-[#4ade80] font-bold text-sm uppercase">
                                                {activeChat.interlocuteur?.nom?.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-white leading-none">{activeChat.interlocuteur?.nom}</h3>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 inline-block">Utilisateur Actif</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white/5 px-4 py-2 flex items-center gap-2 rounded-xl border border-white/5 max-w-[200px] md:max-w-xs">
                                    <div className="text-xs text-slate-300 truncate">
                                        {activeChat.annonce ? (
                                            <>Annonce: <span className="font-semibold text-white">{activeChat.annonce.titre}</span></>
                                        ) : (
                                            <span className="text-[#4ade80] font-semibold tracking-wide">Signalements & Système</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                                {chatLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <span className="w-8 h-8 border-2 border-white/20 border-t-[#4ade80] rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-center mb-6">
                                            <span className="bg-white/5 border border-white/10 text-slate-400 text-[10px] uppercase font-bold py-1 px-3 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                                                <Calendar className="w-3 h-3" /> Historique chargé
                                            </span>
                                        </div>
                                        {messages.map((msg, i) => {
                                            const isMe = String(msg.expediteur_id) === String(user?.id);
                                            return (
                                                <div 
                                                    key={msg.id || i} 
                                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${msg.isOptimistic ? 'opacity-70' : 'opacity-100'} transition-opacity`}
                                                >
                                                    <div className={`max-w-[75%] px-4 py-3 text-sm rounded-2xl shadow-sm ${
                                                        isMe 
                                                            ? 'bg-[#4ade80] text-slate-900 rounded-tr-sm font-medium' 
                                                            : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm'
                                                    }`}>
                                                        <p style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.contenu}</p>
                                                        <p className={`text-[9px] mt-1.5 font-bold text-right uppercase tracking-wider ${isMe ? 'text-slate-900/60' : 'text-slate-500'}`}>
                                                            {msg.isOptimistic ? 'ENVOI...' : new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>

                            <div className="p-4 bg-[#1e293b] border-t border-white/5">
                                <form onSubmit={sendMessage} className="flex items-center gap-3">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Répondez à cette requête de support..."
                                        className="flex-1 bg-[#0f172a] border border-white/10 text-white placeholder-slate-500 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-[#4ade80]/50 transition shadow-inner"
                                        autoComplete="off"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!newMessage.trim() || sending}
                                        className="bg-[#4ade80] text-[#0f172a] p-3.5 rounded-xl hover:bg-[#4ade80]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95 flex-shrink-0"
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
    );
}

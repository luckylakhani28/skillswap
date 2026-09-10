import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, ArrowLeft, MessageSquare, Circle } from 'lucide-react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import { PageLoader, Spinner } from '../components/Loader';

export default function Messages() {
  const { userId: activeId } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);

  const [thread, setThread] = useState(null); // { user, conversationId, messages }
  const [loadingThread, setLoadingThread] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [online, setOnline] = useState(new Set());

  // Refs so socket handlers (registered once) always see current values.
  const activeIdRef = useRef(activeId);
  const convoIdRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const lastTypingSent = useRef(0);

  const myId = me?._id;

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data.conversations);
    } catch {
      /* non-fatal */
    } finally {
      setLoadingConvos(false);
    }
  }, []);

  // --- One-time socket wiring ---
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const onReceive = (msg) => {
      const otherId = msg.sender === myId ? msg.receiver : msg.sender;
      if (otherId === activeIdRef.current) {
        setThread((t) => {
          if (!t || t.messages.some((m) => m._id === msg._id)) return t;
          return { ...t, messages: [...t.messages, msg] };
        });
        // If I'm the recipient and the thread is open, mark it seen immediately.
        if (msg.receiver === myId && convoIdRef.current) {
          socket.emit('mark_seen', { conversationId: convoIdRef.current });
        }
      }
      loadConversations();
    };

    const onTyping = ({ from }) => {
      if (from !== activeIdRef.current) return;
      setPeerTyping(true);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setPeerTyping(false), 1500);
    };

    const onSeen = ({ by }) => {
      if (by !== activeIdRef.current) return;
      setThread((t) => (t ? { ...t, messages: t.messages.map((m) => ({ ...m, seen: true })) } : t));
    };

    const onOnline = (ids) => setOnline(new Set(ids));

    socket.on('receive_message', onReceive);
    socket.on('typing', onTyping);
    socket.on('message_seen', onSeen);
    socket.on('online_users', onOnline);

    return () => {
      socket.off('receive_message', onReceive);
      socket.off('typing', onTyping);
      socket.off('message_seen', onSeen);
      socket.off('online_users', onOnline);
      clearTimeout(typingTimeout.current);
    };
  }, [myId, loadConversations]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // --- Load the active thread when the route param changes ---
  useEffect(() => {
    activeIdRef.current = activeId;
    setPeerTyping(false);
    if (!activeId) {
      setThread(null);
      convoIdRef.current = null;
      return;
    }
    setLoadingThread(true);
    api
      .get(`/messages/${activeId}`)
      .then(({ data }) => {
        setThread({ user: data.user, conversationId: data.conversationId, messages: data.messages });
        convoIdRef.current = data.conversationId;
        const socket = getSocket();
        if (socket) socket.emit('mark_seen', { conversationId: data.conversationId });
        loadConversations(); // refresh unread badge
      })
      .catch(() => navigate('/messages'))
      .finally(() => setLoadingThread(false));
  }, [activeId, navigate, loadConversations]);

  // Auto-scroll to newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages?.length, peerTyping]);

  const handleInput = (e) => {
    setInput(e.target.value);
    const socket = getSocket();
    const now = Date.now();
    // Throttle typing pings to at most one per second.
    if (socket && activeId && now - lastTypingSent.current > 1000) {
      socket.emit('typing', { to: activeId });
      lastTypingSent.current = now;
    }
  };

  const send = (e) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content || !activeId) return;
    const socket = getSocket();
    if (!socket) return;
    setSending(true);
    socket.emit('send_message', { to: activeId, content });
    setInput('');
    setSending(false);
  };

  if (loadingConvos && !activeId) return <PageLoader />;

  return (
    <div className="grid h-[calc(100vh-10rem)] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-surface-card md:grid-cols-[320px_1fr]">
      {/* Conversation list */}
      <aside className={`flex-col border-r border-slate-200 dark:border-slate-800 ${activeId ? 'hidden md:flex' : 'flex'}`}>
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h1 className="font-display text-lg font-bold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No conversations yet. Open a listing and start a swap chat.
            </div>
          ) : (
            conversations.map((c) => (
              <Link
                key={c.conversationId}
                to={`/messages/${c.user?._id}`}
                className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40 ${
                  c.user?._id === activeId ? 'bg-teach-soft/50 dark:bg-teach/10' : ''
                }`}
              >
                <ConvoAvatar user={c.user} isOnline={online.has(c.user?._id)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-medium">{c.user?.name || 'Unknown'}</span>
                    {c.unread > 0 && (
                      <span className="ml-2 grid h-5 min-w-[20px] place-items-center rounded-full bg-teach px-1.5 text-xs font-semibold text-white">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {c.lastMessage?.fromMe ? 'You: ' : ''}{c.lastMessage?.content || (c.lastMessage?.image ? '📷 Photo' : '')}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </aside>

      {/* Thread */}
      <section className={`flex-col ${activeId ? 'flex' : 'hidden md:flex'}`}>
        {!activeId ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
            <MessageSquare className="h-10 w-10" />
            <p className="mt-3 text-sm">Select a conversation to start chatting.</p>
          </div>
        ) : loadingThread ? (
          <div className="flex flex-1 items-center justify-center"><Spinner className="h-7 w-7" /></div>
        ) : (
          <>
            {/* Thread header */}
            <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <button onClick={() => navigate('/messages')} className="md:hidden" aria-label="Back">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <ConvoAvatar user={thread?.user} isOnline={online.has(activeId)} />
              <div>
                <Link to={`/profile/${thread?.user?.username}`} className="font-semibold hover:underline">
                  {thread?.user?.name}
                </Link>
                <p className="text-xs text-slate-400">
                  {online.has(activeId) ? 'Online now' : 'Offline'}
                </p>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50/50 p-4 dark:bg-slate-900/30">
              {thread?.messages.map((m) => {
                const mine = m.sender === myId;
                return (
                  <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                      mine
                        ? 'rounded-br-sm bg-teach text-white'
                        : 'rounded-bl-sm bg-white text-slate-800 shadow-soft dark:bg-slate-800 dark:text-slate-100'
                    }`}>
                      {m.content}
                      <span className={`ml-2 inline-block align-bottom text-[10px] ${mine ? 'text-white/70' : 'text-slate-400'}`}>
                        {formatTime(m.createdAt)}{mine && (m.seen ? ' · Seen' : ' · Sent')}
                      </span>
                    </div>
                  </div>
                );
              })}
              {peerTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 shadow-soft dark:bg-slate-800">
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
              <input
                className="input flex-1"
                placeholder="Type a message…"
                value={input}
                onChange={handleInput}
                aria-label="Message"
              />
              <button className="btn-primary" disabled={sending || !input.trim()} aria-label="Send">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function ConvoAvatar({ user, isOnline }) {
  return (
    <div className="relative">
      {user?.profilePicture ? (
        <img src={user.profilePicture} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <span className="grid h-10 w-10 place-items-center rounded-full bg-teach/15 text-sm font-semibold text-teach dark:text-violet-300">
          {user?.name?.[0]?.toUpperCase() || '?'}
        </span>
      )}
      {isOnline && (
        <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-learn text-white dark:text-surface-card" strokeWidth={3} />
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-1">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </span>
  );
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

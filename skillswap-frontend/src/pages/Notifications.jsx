import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bell, Inbox, Check, X, Ban, CheckCircle2, MessageSquare, Star, Eye, Trash2, CheckCheck,
} from 'lucide-react';
import api from '../lib/api';
import { PageLoader } from '../components/Loader';

const ICONS = {
  request_received: Inbox,
  request_accepted: Check,
  request_rejected: X,
  request_cancelled: Ban,
  swap_completed: CheckCircle2,
  message_received: MessageSquare,
  review_received: Star,
  profile_viewed: Eye,
};

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setItems(data.notifications);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const open = async (n) => {
    if (!n.isRead) {
      try {
        await api.put(`/notifications/${n._id}/read`);
        setItems((list) => list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      } catch { /* non-fatal */ }
    }
    if (n.link) navigate(n.link);
  };

  const remove = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setItems((list) => list.filter((x) => x._id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const markAll = async () => {
    try {
      await api.put('/notifications/read-all');
      setItems((list) => list.map((x) => ({ ...x, isRead: true })));
      toast.success('All caught up');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <PageLoader />;

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {unread > 0 ? `${unread} unread` : 'You are all caught up.'}
          </p>
        </div>
        {unread > 0 && (
          <button className="btn-ghost" onClick={markAll}><CheckCheck className="h-4 w-4" /> Mark all read</button>
        )}
      </header>

      {items.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <Bell className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 font-display text-lg font-semibold">Nothing here yet</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Requests, messages, and reviews will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const Icon = ICONS[n.type] || Bell;
            return (
              <div
                key={n._id}
                onClick={() => open(n)}
                className={`card flex cursor-pointer items-start gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                  n.isRead ? '' : 'border-l-4 border-l-teach'
                }`}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                  n.isRead ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : 'bg-teach/15 text-teach dark:text-violet-300'
                }`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${n.isRead ? 'text-slate-600 dark:text-slate-300' : 'font-medium'}`}>{n.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
                </div>
                <button
                  onClick={(e) => remove(e, n._id)}
                  aria-label="Delete notification"
                  className="text-slate-300 hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Moon, Sun, LayoutDashboard, Compass, LogOut, Plus, ArrowLeftRight, MessageSquare, Bell, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  // Poll the unread notification count while logged in.
  useEffect(() => {
    if (!user) { setUnread(0); return undefined; }
    let active = true;
    const fetchUnread = () =>
      api.get('/notifications').then(({ data }) => active && setUnread(data.unread)).catch(() => {});
    fetchUnread();
    const id = setInterval(fetchUnread, 30000);
    return () => { active = false; clearInterval(id); };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `hidden items-center gap-1.5 text-sm font-medium sm:inline-flex ${
      isActive ? 'text-teach dark:text-violet-300' : 'text-slate-600 hover:text-ink dark:text-slate-300 dark:hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-surface-light/80 backdrop-blur dark:border-slate-800 dark:bg-surface-dark/80">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-teach text-white">
            <ArrowLeftRight className="h-4 w-4" />
          </span>
          Skill<span className="-ml-1.5 text-learn">Swap</span>
        </Link>

        <div className="flex items-center gap-4">
          <NavLink to="/browse" className={linkClass}>
            <Compass className="h-4 w-4" /> Browse
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={linkClass}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </NavLink>
          )}
          {user && (
            <NavLink to="/messages" className={linkClass}>
              <MessageSquare className="h-4 w-4" /> Messages
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>
              <ShieldCheck className="h-4 w-4" /> Admin
            </NavLink>
          )}

          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/notifications"
                aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
                className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-teach px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
              <Link to="/skills/new" className="btn-primary hidden sm:inline-flex">
                <Plus className="h-4 w-4" /> New listing
              </Link>
              <Link to={`/profile/${user.username}`} className="flex items-center gap-2">
                <Avatar user={user} />
              </Link>
              <button
                onClick={handleLogout}
                aria-label="Log out"
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost">Log in</Link>
              <Link to="/register" className="btn-primary">Join free</Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

function Avatar({ user }) {
  if (user.profilePicture) {
    return (
      <img
        src={user.profilePicture}
        alt={user.name}
        className="h-9 w-9 rounded-full object-cover ring-2 ring-teach/30"
      />
    );
  }
  return (
    <span className="grid h-9 w-9 place-items-center rounded-full bg-teach/15 text-sm font-semibold text-teach dark:text-violet-300">
      {user.name?.[0]?.toUpperCase() || 'U'}
    </span>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem } from '../../types';
import { apiRequest } from '../../services/api';
import { Bell, User as UserIcon, LogOut, Shield, Search, CheckCircle, Code2, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onNavigate: (page: string) => void;
  activePage: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, activePage }) => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (user) {
      apiRequest('/notifications')
        .then((res) => setNotifications(res.notifications || []))
        .catch(() => {});
    }
  }, [user, activePage]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {}
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800/60 dark:border-slate-800/80 bg-slate-900/40 dark:bg-slate-950/80 px-6 backdrop-blur-xl transition-colors">
      {/* Brand & Search */}
      <div className="flex items-center gap-8">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 text-left group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
            <Code2 className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Code<span className="text-red-600 dark:text-red-400">Sphere</span></span>
            <span className="hidden sm:inline-block text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">PRO</span>
          </div>
        </button>

        <div className="relative hidden md:block w-80">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search languages, lessons, challenges..."
            onClick={() => onNavigate('explore')}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 py-1.5 pl-9 pr-4 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-red-500 focus:outline-none transition-all cursor-pointer shadow-sm"
          />
        </div>
      </div>

      {/* Right Navigation Controls */}
      <div className="flex items-center gap-3">
        {/* Light / Dark Mode Background Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'White (Light)' : 'Black (Dark)'} theme`}
          className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4 text-red-400 fill-red-400" />
              <span className="hidden sm:inline-block">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-red-600 fill-red-600" />
              <span className="hidden sm:inline-block">Dark Mode</span>
            </>
          )}
        </button>

        {user ? (
          <>
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xl z-50 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Notifications</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                      >
                        <CheckCircle className="h-3 w-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No new notifications</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`rounded-xl p-3 text-xs transition-colors border ${
                            notif.is_read
                              ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-500/30 text-slate-800 dark:text-slate-200 font-medium'
                          }`}
                        >
                          <div className="font-bold text-red-600 dark:text-red-300 mb-0.5">{notif.title}</div>
                          <div className="text-[11px]">{notif.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 pr-3 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600/10 dark:bg-red-600/20 text-red-600 dark:text-red-400 font-extrabold text-xs border border-red-500/30">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-semibold hidden sm:inline-block">{user.full_name || user.username}</span>
                {user.role === 'admin' && (
                  <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-extrabold text-red-600 dark:text-red-400 border border-red-500/20">
                    ADMIN
                  </span>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl z-50">
                  <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{user.full_name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">@{user.username}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate('profile');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-slate-400" /> Profile & Settings
                  </button>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('admin');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10"
                    >
                      <Shield className="h-3.5 w-3.5" /> Admin Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('login')}
              className="rounded-xl px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="theme-btn-primary rounded-xl px-4 py-1.5 text-xs font-bold"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
